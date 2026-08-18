import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Trash2, Save, X, Tag as TagIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import TagBadge from '@/components/tags/TagBadge';
import { fetchTags, createTag, updateTag, deleteTag } from '@/lib/tagService';

const PALETTE = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#0EA5E9', '#64748B'];

/**
 * Full CRUD manager for the administrator-managed tag catalog (Phase 3).
 */
const TagManager = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ name: '', color: PALETTE[3], description: '' });
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editDraft, setEditDraft] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setTags(await fetchTags());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!draft.name.trim()) {
      toast({ variant: 'destructive', title: 'Name required', description: 'Enter a tag name.' });
      return;
    }
    setSaving(true);
    const { error } = await createTag({ ...draft, createdBy: profile?.id });
    setSaving(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Could not create tag', description: error.message?.includes('uq_tags_name') ? 'A tag with that name already exists.' : error.message });
      return;
    }
    setDraft({ name: '', color: PALETTE[3], description: '' });
    toast({ title: 'Tag created' });
    load();
  };

  const startEdit = (tag) => {
    setEditId(tag.id);
    setEditDraft({ name: tag.name, color: tag.color, description: tag.description || '', is_active: tag.is_active });
  };

  const saveEdit = async () => {
    const ok = await updateTag(editId, {
      name: editDraft.name.trim(),
      color: editDraft.color,
      description: editDraft.description || null,
      is_active: editDraft.is_active,
    });
    if (ok) {
      toast({ title: 'Tag updated' });
      setEditId(null);
      load();
    } else {
      toast({ variant: 'destructive', title: 'Update failed' });
    }
  };

  const handleDelete = async (tag) => {
    if (!window.confirm(`Delete the tag "${tag.name}"? It will be removed from all students.`)) return;
    const ok = await deleteTag(tag.id);
    if (ok) {
      toast({ title: 'Tag deleted' });
      load();
    } else {
      toast({ variant: 'destructive', title: 'Delete failed' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Create */}
      <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
        <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Plus size={16} /> New Tag
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            placeholder="Tag name (e.g. Needs Follow-Up)"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
          <Input
            placeholder="Description (optional)"
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          />
        </div>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-xs text-slate-500 me-1">Color:</span>
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setDraft((d) => ({ ...d, color: c }))}
              className={`h-6 w-6 rounded-full border-2 transition-transform ${draft.color === c ? 'border-slate-800 scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
              aria-label={`Color ${c}`}
            />
          ))}
          <div className="ms-auto flex items-center gap-2">
            {draft.name && <TagBadge tag={draft} />}
            <Button size="sm" onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus size={14} className="me-1" /> Add</>}
            </Button>
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-slate-300" /></div>
      ) : tags.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">
          <TagIcon className="mx-auto mb-2 opacity-40" /> No tags yet. Create one above.
        </div>
      ) : (
        <div className="space-y-2">
          {tags.map((tag) => (
            <div key={tag.id} className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2">
              {editId === tag.id ? (
                <>
                  <Input
                    className="max-w-[180px]"
                    value={editDraft.name}
                    onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                  />
                  <div className="flex items-center gap-1">
                    {PALETTE.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditDraft((d) => ({ ...d, color: c }))}
                        className={`h-5 w-5 rounded-full border-2 ${editDraft.color === c ? 'border-slate-800' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                        aria-label={`Color ${c}`}
                      />
                    ))}
                  </div>
                  <Input
                    className="flex-1"
                    placeholder="Description"
                    value={editDraft.description}
                    onChange={(e) => setEditDraft((d) => ({ ...d, description: e.target.value }))}
                  />
                  <label className="flex items-center gap-1 text-xs text-slate-500">
                    <input
                      type="checkbox"
                      checked={editDraft.is_active}
                      onChange={(e) => setEditDraft((d) => ({ ...d, is_active: e.target.checked }))}
                    />
                    Active
                  </label>
                  <Button size="sm" variant="ghost" onClick={saveEdit}><Save size={15} /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditId(null)}><X size={15} /></Button>
                </>
              ) : (
                <>
                  <TagBadge tag={tag} />
                  {!tag.is_active && <span className="text-[11px] text-slate-400">(inactive)</span>}
                  <span className="text-sm text-slate-500 truncate flex-1">{tag.description}</span>
                  <Button size="sm" variant="ghost" onClick={() => startEdit(tag)}>Edit</Button>
                  <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(tag)}>
                    <Trash2 size={15} />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagManager;
