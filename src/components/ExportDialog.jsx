import React, { useMemo, useState } from 'react';
import { FileText, FileSpreadsheet, Check, Printer } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { sortRows, exportExcel, printPDF } from '@/lib/exportUtils';

/**
 * ExportDialog — a shared, reusable export/print dialog for every list page.
 *
 * The user chooses:
 *   1. Format — PDF (print / save as PDF) or Excel (.xlsx).
 *   2. Which fields/columns to include (checkbox list; everything selectable).
 *   3. How to sort the list.
 *   4. Optionally group the list (e.g. by class, by grade).
 *   5. A document title.
 *
 * It always exports the ROWS THE PAGE PASSES IN — i.e. the currently filtered /
 * searched result set — so exports match exactly what's on screen.
 *
 * Props:
 *   open, onOpenChange
 *   title            default document title (string)
 *   filename         base file name (no extension)
 *   rows             already-filtered data array
 *   columns          [{ key, label, accessor?(row), default?:boolean }]
 *   sortOptions      [{ key, label, accessor?(row) }]  (optional; defaults to columns)
 *   groupOptions     [{ key, label, accessor?(row) }]  (optional grouping choices)
 *   subtitle         optional line under the title (e.g. active filter summary)
 */
const ExportDialog = ({
  open,
  onOpenChange,
  title = 'Export',
  filename = 'export',
  rows = [],
  columns = [],
  sortOptions = null,
  groupOptions = [],
  subtitle = '',
}) => {
  const { t, isRTL } = useLanguage();

  const [format, setFormat] = useState('pdf');
  const [docTitle, setDocTitle] = useState(title);
  const [selected, setSelected] = useState(() =>
    columns.filter((c) => c.default !== false).map((c) => c.key)
  );
  const [sortKey, setSortKey] = useState('');
  const [groupKey, setGroupKey] = useState('none');

  // Keep local state in sync when the dialog is (re)opened with new config.
  React.useEffect(() => {
    if (open) {
      setDocTitle(title);
      setSelected(columns.filter((c) => c.default !== false).map((c) => c.key));
      setSortKey('');
      setGroupKey('none');
      setFormat('pdf');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const effectiveSortOptions = useMemo(
    () => sortOptions || columns.map((c) => ({ key: c.key, label: c.label, accessor: c.accessor })),
    [sortOptions, columns]
  );

  const toggle = (key) =>
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );

  const allSelected = selected.length === columns.length;
  const selectAll = () =>
    setSelected(allSelected ? [] : columns.map((c) => c.key));

  const handleExport = () => {
    // Preserve the page's column order, keep only chosen fields.
    const chosen = columns.filter((c) => selected.includes(c.key));
    if (chosen.length === 0) return;

    const sortOption = effectiveSortOptions.find((s) => s.key === sortKey) || null;
    const groupOption =
      groupKey !== 'none' ? groupOptions.find((g) => g.key === groupKey) || null : null;

    const ordered = sortRows(rows, sortOption);

    if (format === 'excel') {
      exportExcel({ title: docTitle, columns: chosen, rows: ordered, groupBy: groupOption, filename });
    } else {
      printPDF({ title: docTitle, columns: chosen, rows: ordered, groupBy: groupOption, isRTL, subtitle });
    }
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gradient text-xl">{t('export.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Format */}
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {t('export.format')}
            </Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                type="button"
                onClick={() => setFormat('pdf')}
                className={`flex items-center gap-3 h-14 px-4 rounded-xl border-2 transition-all ${
                  format === 'pdf'
                    ? 'border-primary bg-primary/10 text-primary shadow-glow'
                    : 'border-white/60 bg-white/50 text-slate-600 hover:bg-white/80'
                }`}
              >
                <FileText size={22} />
                <span className="font-semibold">{t('export.pdf')}</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat('excel')}
                className={`flex items-center gap-3 h-14 px-4 rounded-xl border-2 transition-all ${
                  format === 'excel'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-card'
                    : 'border-white/60 bg-white/50 text-slate-600 hover:bg-white/80'
                }`}
              >
                <FileSpreadsheet size={22} />
                <span className="font-semibold">{t('export.excel')}</span>
              </button>
            </div>
          </div>

          {/* Document title */}
          <div className="space-y-1.5">
            <Label htmlFor="export-title" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {t('export.documentTitle')}
            </Label>
            <Input id="export-title" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} className="h-11" />
          </div>

          {/* Fields */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {t('export.fields')}
              </Label>
              <button
                type="button"
                onClick={selectAll}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {allSelected ? t('export.clearAll') : t('export.selectAll')}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pe-1">
              {columns.map((c) => {
                const checked = selected.includes(c.key);
                return (
                  <label
                    key={c.key}
                    className={`flex items-center gap-2.5 h-11 px-3 rounded-xl border cursor-pointer transition-all ${
                      checked
                        ? 'border-primary/40 bg-primary/10'
                        : 'border-white/60 bg-white/50 hover:bg-white/80'
                    }`}
                  >
                    <span
                      className={`h-5 w-5 rounded-md flex items-center justify-center flex-shrink-0 ${
                        checked ? 'bg-brand-gradient text-white' : 'bg-white border border-slate-300'
                      }`}
                    >
                      {checked && <Check size={14} strokeWidth={3} />}
                    </span>
                    <input type="checkbox" checked={checked} onChange={() => toggle(c.key)} className="sr-only" />
                    <span className="text-sm font-medium text-slate-700 truncate">{c.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Sort + group */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {t('export.sortBy')}
              </Label>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                className="w-full h-11 px-3 border border-white/60 rounded-xl bg-white/60 backdrop-blur-md text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">{t('export.defaultOrder')}</option>
                {effectiveSortOptions.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>

            {groupOptions.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {t('export.groupBy')}
                </Label>
                <select
                  value={groupKey}
                  onChange={(e) => setGroupKey(e.target.value)}
                  className="w-full h-11 px-3 border border-white/60 rounded-xl bg-white/60 backdrop-blur-md text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="none">{t('export.noGrouping')}</option>
                  {groupOptions.map((g) => (
                    <option key={g.key} value={g.key}>{g.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <p className="text-sm text-slate-500">
            {t('export.willExport')}{' '}
            <span className="font-bold text-slate-800">{rows.length}</span>{' '}
            {t('export.records')}
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange?.(false)} className="h-11">
            {t('export.cancel')}
          </Button>
          <Button onClick={handleExport} disabled={selected.length === 0} className="h-11">
            {format === 'pdf' ? <Printer className="me-2 h-4 w-4" /> : <FileSpreadsheet className="me-2 h-4 w-4" />}
            {format === 'pdf' ? t('export.exportPdf') : t('export.exportExcel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
