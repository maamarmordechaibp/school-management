import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Upload, FileText, Image as ImageIcon, File, Download, Trash2, Loader2, FolderOpen } from 'lucide-react';

const BUCKET = 'student-documents';

export const DOC_FOLDERS = [
  { value: 'evaluations', label: 'Evaluations' },
  { value: 'reports', label: 'Report Cards' },
  { value: 'medical', label: 'Medical' },
  { value: 'plans', label: 'Plans / IEP' },
  { value: 'correspondence', label: 'Correspondence' },
  { value: 'forms', label: 'Forms' },
  { value: 'other', label: 'Other' },
];

const folderLabel = (v) => DOC_FOLDERS.find(f => f.value === v)?.label || 'Other';

const fileIcon = (type) => {
  if (!type) return File;
  if (type.startsWith('image/')) return ImageIcon;
  if (type === 'application/pdf') return FileText;
  return File;
};

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const StudentDocuments = ({ studentId, currentUser }) => {
  const { toast } = useToast();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadFolder, setUploadFolder] = useState('evaluations');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (studentId) loadDocs();
  }, [studentId]);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('student_documents')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setDocs(data || []);
    } catch (e) {
      console.error('Error loading documents:', e);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load documents.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const safeName = file.name.replace(/[^\w.\-]+/g, '_');
        const path = `${studentId}/${uploadFolder}/${Date.now()}_${safeName}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || undefined,
        });
        if (upErr) throw upErr;

        const { error: dbErr } = await supabase.from('student_documents').insert([{
          student_id: studentId,
          folder: uploadFolder,
          file_name: file.name,
          file_path: path,
          file_type: file.type || null,
          file_size: file.size || null,
          uploaded_by: currentUser?.id || null,
          uploaded_by_name: currentUser?.name || currentUser?.first_name || currentUser?.email || null,
        }]);
        if (dbErr) throw dbErr;
      }
      toast({ title: 'Uploaded', description: `${files.length} file(s) added to ${folderLabel(uploadFolder)}.` });
      loadDocs();
    } catch (err) {
      console.error('Upload failed:', err);
      toast({ variant: 'destructive', title: 'Upload failed', description: err.message || 'Could not upload file.' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openDoc = async (doc) => {
    try {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(doc.file_path, 3600);
      if (error) throw error;
      window.open(data.signedUrl, '_blank', 'noopener');
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not open the file.' });
    }
  };

  const deleteDoc = async (doc) => {
    if (!window.confirm(`Delete "${doc.file_name}"? This cannot be undone.`)) return;
    try {
      await supabase.storage.from(BUCKET).remove([doc.file_path]);
      const { error } = await supabase.from('student_documents').delete().eq('id', doc.id);
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Document removed.' });
      setDocs(prev => prev.filter(d => d.id !== doc.id));
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the document.' });
    }
  };

  const grouped = DOC_FOLDERS.map(f => ({
    ...f,
    items: docs.filter(d => (d.folder || 'other') === f.value),
  }));

  return (
    <div className="space-y-6">
      {/* Upload bar */}
      <div className="flex flex-wrap items-end gap-3 p-4 bg-slate-50 border rounded-lg">
        <div className="grid gap-1">
          <label className="text-xs font-medium text-slate-500">Folder</label>
          <Select value={uploadFolder} onValueChange={setUploadFolder}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DOC_FOLDERS.map(f => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt"
          className="hidden"
          onChange={handleUpload}
        />
        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center gap-2">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? 'Uploading…' : 'Upload document'}
        </Button>
        <p className="text-xs text-slate-400">PDF, images, Word, Excel — files are stored per student and organized by folder.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
      ) : docs.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-lg p-10 text-center text-slate-400">
          No documents uploaded yet.
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.filter(g => g.items.length > 0).map(group => (
            <div key={group.value}>
              <h4 className="flex items-center gap-2 font-semibold text-slate-700 mb-2">
                <FolderOpen className="h-4 w-4 text-amber-500" /> {group.label}
                <span className="text-xs text-slate-400 font-normal">({group.items.length})</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.items.map(doc => {
                  const Icon = fileIcon(doc.file_type);
                  return (
                    <div key={doc.id} className="border rounded-lg p-3 flex items-start gap-3 bg-white hover:shadow-sm transition-shadow">
                      <div className="p-2 bg-slate-100 rounded-lg"><Icon className="h-5 w-5 text-slate-500" /></div>
                      <div className="min-w-0 flex-1">
                        <button onClick={() => openDoc(doc)} className="text-sm font-medium text-blue-600 hover:underline truncate block text-left w-full" title={doc.file_name}>
                          {doc.file_name}
                        </button>
                        <p className="text-xs text-slate-400">
                          {formatSize(doc.file_size)}{doc.uploaded_by_name ? ` • ${doc.uploaded_by_name}` : ''}
                        </p>
                        <p className="text-xs text-slate-400">{new Date(doc.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDoc(doc)} title="Open / download">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-red-600" onClick={() => deleteDoc(doc)} title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentDocuments;
