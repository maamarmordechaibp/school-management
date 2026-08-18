import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Check, Loader2, AlertCircle, Plus, RefreshCw, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { pickField as pick, classifyImportRow } from '@/lib/importUtils';

const STATUS_META = {
  new: { label: 'New', icon: Plus, cls: 'text-emerald-600' },
  update: { label: 'Update', icon: RefreshCw, cls: 'text-blue-600' },
  duplicate: { label: 'Duplicate in file', icon: Copy, cls: 'text-amber-600' },
  invalid: { label: 'Missing name', icon: AlertCircle, cls: 'text-red-500' },
};

/**
 * Bulk student import (Phase 19). Upserts by external student ID so re-imports
 * update existing students instead of creating duplicates, with a per-row
 * preview (New / Update / Duplicate / Invalid) and an error report.
 */
const ImportStudentsModal = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [classMap, setClassMap] = useState({}); // lowercased class name -> id
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      const { data } = await supabase.from('classes').select('id, name');
      const map = {};
      for (const c of data || []) if (c.name) map[c.name.trim().toLowerCase()] = c.id;
      setClassMap(map);
    })();
  }, [isOpen]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setResult(null);
    readExcel(selected);
  };

  const readExcel = (f) => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'binary' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet);

        const parsed = json.map((r) => {
          const first = pick(r, ['First Name', 'First', 'firstname']);
          const last = pick(r, ['Last Name', 'Last', 'lastname', 'Family Name']);
          const hebrew = pick(r, ['Hebrew Name', 'Hebrew', 'Yiddish Name', 'Name', 'Student Name']);
          return {
            external_student_id: pick(r, ['External ID', 'ExternalId', 'ID', 'Student ID', 'StudentId', 'Ext ID']) || null,
            first_name: first || null,
            last_name: last || null,
            hebrew_name: hebrew || null,
            father_name: pick(r, ['Father', 'Father Name']) || null,
            father_phone: pick(r, ['Father Phone', 'Father Cell']) || null,
            mother_name: pick(r, ['Mother', 'Mother Name']) || null,
            mother_phone: pick(r, ['Mother Phone', 'Mother Cell']) || null,
            _className: pick(r, ['Class', 'Grade', 'Classroom']),
          };
        });

        // Which external ids already exist in the DB?
        const ids = parsed.map((p) => p.external_student_id).filter(Boolean);
        const existing = new Set();
        if (ids.length) {
          for (let i = 0; i < ids.length; i += 200) {
            const chunk = ids.slice(i, i + 200);
            const { data } = await supabase
              .from('students')
              .select('external_student_id')
              .in('external_student_id', chunk);
            for (const s of data || []) existing.add(s.external_student_id);
          }
        }

        // Assign a status to each row (in-file duplicates flagged).
        const seen = new Set();
        const withStatus = parsed.map((p) => {
          const hasName = !!(p.first_name || p.last_name || p.hebrew_name);
          const status = classifyImportRow({
            externalId: p.external_student_id,
            hasName,
            existsInDb: p.external_student_id && existing.has(p.external_student_id),
            seenInFile: p.external_student_id && seen.has(p.external_student_id),
          });
          if (p.external_student_id) seen.add(p.external_student_id);
          return { ...p, _status: status };
        });

        setRows(withStatus);
      } catch (err) {
        console.error(err);
        toast({ variant: 'destructive', title: 'Could not read file', description: err.message });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsBinaryString(f);
  };

  const counts = rows.reduce((acc, r) => { acc[r._status] = (acc[r._status] || 0) + 1; return acc; }, {});

  const buildPayload = (r) => {
    const name = r.hebrew_name || `${r.first_name || ''} ${r.last_name || ''}`.trim() || null;
    const class_id = r._className ? classMap[r._className.trim().toLowerCase()] || null : null;
    return {
      external_student_id: r.external_student_id,
      first_name: r.first_name,
      last_name: r.last_name,
      hebrew_name: r.hebrew_name,
      name,
      father_name: r.father_name,
      father_phone: r.father_phone,
      mother_name: r.mother_name,
      mother_phone: r.mother_phone,
      class_id,
      status: 'active',
    };
  };

  const handleImport = async () => {
    const importable = rows.filter((r) => r._status === 'new' || r._status === 'update');
    if (importable.length === 0) return;
    setIsUploading(true);
    const errors = [];
    let created = 0, updated = 0;

    try {
      // Upsert rows that carry an external id (update-or-insert by that key).
      const withId = importable.filter((r) => r.external_student_id).map(buildPayload);
      if (withId.length) {
        const { error } = await supabase.from('students').upsert(withId, { onConflict: 'external_student_id' });
        if (error) errors.push(`Upsert by external ID: ${error.message}`);
        else {
          updated += importable.filter((r) => r._status === 'update' && r.external_student_id).length;
          created += importable.filter((r) => r._status === 'new' && r.external_student_id).length;
        }
      }

      // Rows without an external id can only be inserted (no safe match key).
      const noId = importable.filter((r) => !r.external_student_id).map(buildPayload);
      if (noId.length) {
        const { error } = await supabase.from('students').insert(noId);
        if (error) errors.push(`Insert (no external ID): ${error.message}`);
        else created += noId.length;
      }

      setResult({ created, updated, skipped: rows.length - importable.length, errors });
      if (errors.length === 0) {
        toast({ title: 'Import complete', description: `${created} created, ${updated} updated.` });
        onSuccess?.();
      } else {
        toast({ variant: 'destructive', title: 'Import finished with errors', description: errors[0] });
      }
    } catch (error) {
      console.error(error);
      setResult({ created, updated, skipped: 0, errors: [error.message] });
      toast({ variant: 'destructive', title: 'Import failed', description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => { setFile(null); setRows([]); setResult(null); };

  const importableCount = (counts.new || 0) + (counts.update || 0);

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Import Students</DialogTitle>
          <DialogDescription>
            Upload an Excel/CSV. Columns like <strong>External ID</strong>, First/Last/Hebrew Name, Class,
            Father/Mother Name &amp; Phone are matched automatically. Re-importing an existing
            <strong> External ID</strong> updates that student instead of creating a duplicate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors">
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileChange} className="hidden" id="file-upload" />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
              <FileSpreadsheet className="h-10 w-10 text-slate-400 mb-2" />
              <span className="text-sm font-medium text-slate-700">{file ? file.name : 'Click to upload Excel/CSV file'}</span>
              <span className="text-xs text-slate-500 mt-1">Supports .xlsx, .xls, .csv</span>
            </label>
          </div>

          {isProcessing && (
            <div className="text-center py-4 text-slate-500">
              <Loader2 className="animate-spin h-6 w-6 mx-auto mb-2" /> Reading and matching…
            </div>
          )}

          {rows.length > 0 && !result && (
            <>
              <div className="flex flex-wrap gap-2 text-xs">
                {Object.entries(STATUS_META).map(([key, meta]) => (
                  counts[key] ? (
                    <span key={key} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-semibold ${meta.cls}`}>
                      <meta.icon size={12} /> {counts[key]} {meta.label}
                    </span>
                  ) : null
                ))}
              </div>

              <div className="bg-slate-50 rounded-lg border max-h-64 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-slate-500 border-b sticky top-0 bg-slate-50">
                    <tr>
                      <th className="py-1.5 px-2">Status</th>
                      <th className="py-1.5 px-2">Ext ID</th>
                      <th className="py-1.5 px-2">Name</th>
                      <th className="py-1.5 px-2">Class</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {rows.slice(0, 100).map((r, i) => {
                      const meta = STATUS_META[r._status];
                      return (
                        <tr key={i}>
                          <td className={`py-1.5 px-2 font-medium ${meta.cls}`}>
                            <span className="inline-flex items-center gap-1"><meta.icon size={11} /> {meta.label}</span>
                          </td>
                          <td className="py-1.5 px-2 text-slate-500">{r.external_student_id || '—'}</td>
                          <td className="py-1.5 px-2 font-medium">{r.hebrew_name || `${r.first_name || ''} ${r.last_name || ''}`.trim() || '—'}</td>
                          <td className="py-1.5 px-2">{r._className || '—'}</td>
                        </tr>
                      );
                    })}
                    {rows.length > 100 && (
                      <tr><td colSpan="4" className="py-2 text-center text-slate-400 italic">…and {rows.length - 100} more rows</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {result && (
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                <Check size={16} /> Import finished
              </div>
              <p className="text-sm text-slate-600">
                {result.created} created · {result.updated} updated · {result.skipped} skipped
              </p>
              {result.errors.length > 0 && (
                <div className="text-sm text-red-600">
                  <p className="font-semibold flex items-center gap-1"><AlertCircle size={14} /> Errors</p>
                  <ul className="list-disc ms-5 mt-1">{result.errors.map((err, i) => <li key={i}>{err}</li>)}</ul>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { reset(); onClose(); }}>{result ? 'Close' : 'Cancel'}</Button>
            {!result && (
              <Button onClick={handleImport} disabled={isUploading || importableCount === 0}>
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Import {importableCount > 0 ? `(${importableCount})` : ''}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportStudentsModal;
