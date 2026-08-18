import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Tag as TagIcon, Plus, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import TagBadge from '@/components/tags/TagBadge';
import {
  fetchTags,
  fetchStudentTags,
  assignTag,
  removeTag,
} from '@/lib/tagService';

/**
 * Inline editor: shows a student's tags and lets an administrator add/remove
 * them from the managed catalog. Read-only when `canEdit` is false.
 */
const StudentTagEditor = ({ studentId, canEdit = true, className = '' }) => {
  const { profile } = useAuth();
  const { isRTL } = useLanguage();
  const [assigned, setAssigned] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    const [mine, all] = await Promise.all([
      fetchStudentTags(studentId),
      fetchTags({ activeOnly: true }),
    ]);
    setAssigned(mine);
    setCatalog(all);
    setLoading(false);
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const assignedIds = new Set(assigned.map((t) => t.id));

  const toggle = async (tag) => {
    setBusy(true);
    if (assignedIds.has(tag.id)) {
      const ok = await removeTag(studentId, tag.id);
      if (ok) setAssigned((prev) => prev.filter((t) => t.id !== tag.id));
    } else {
      const ok = await assignTag(studentId, tag.id, profile?.id);
      if (ok) setAssigned((prev) => [...prev, tag]);
    }
    setBusy(false);
  };

  const handleRemove = async (tag) => {
    const ok = await removeTag(studentId, tag.id);
    if (ok) setAssigned((prev) => prev.filter((t) => t.id !== tag.id));
  };

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin text-slate-300" />;
  }

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`} ref={ref}>
      {assigned.map((tag) => (
        <TagBadge key={tag.id} tag={tag} onRemove={canEdit ? handleRemove : undefined} />
      ))}
      {assigned.length === 0 && !canEdit && (
        <span className="text-xs text-slate-400">{isRTL ? 'אין תוויות' : 'No tags'}</span>
      )}

      {canEdit && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-xs text-slate-500 hover:border-slate-400 hover:text-slate-700 transition-colors"
          >
            <Plus size={12} /> {isRTL ? 'תווית' : 'Tag'}
          </button>

          {open && (
            <div
              className={`absolute z-50 mt-1 w-56 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden ${isRTL ? 'start-0' : 'end-0'}`}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <div className="px-3 py-2 border-b bg-slate-50 flex items-center gap-2 text-xs font-semibold text-slate-600">
                <TagIcon size={13} /> {isRTL ? 'בחר תוויות' : 'Assign tags'}
              </div>
              <div className="max-h-64 overflow-y-auto py-1">
                {catalog.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-slate-400">
                    {isRTL ? 'אין תוויות. הוסף ב"הגדרות".' : 'No tags. Add some in Settings.'}
                  </div>
                ) : (
                  catalog.map((tag) => {
                    const active = assignedIds.has(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        disabled={busy}
                        onClick={() => toggle(tag)}
                        className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-start hover:bg-slate-50 disabled:opacity-50"
                      >
                        <TagBadge tag={tag} />
                        {active && <Check size={14} className="text-primary flex-shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentTagEditor;
