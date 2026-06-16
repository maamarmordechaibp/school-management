import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useStudentProfile } from '@/contexts/StudentProfileContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Phone, PhoneCall, Voicemail, ListTree, Plus, Trash2, Pencil, Save, X,
  Upload, ChevronRight, Home, User, RefreshCw, MailCheck, Settings2,
} from 'lucide-react';
import {
  listExtensions, saveExtension, deleteExtension,
  listDevices, saveDevice, deleteDevice,
  listMenus, listOptions, saveMenu, deleteMenu, saveOption, deleteOption,
  listVoicemails, markVoicemailRead, deleteVoicemail,
  listInboundCalls, uploadAudio,
} from '@/lib/phoneService';

const PRINCIPAL_ROLES = ['admin', 'principal', 'principal_hebrew', 'principal_english'];
const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '*', '#'];
const ACTION_TYPES = [
  { value: 'extension', label: 'Ring an extension (person)' },
  { value: 'submenu', label: 'Open a submenu' },
  { value: 'message', label: 'Play a message' },
  { value: 'voicemail', label: 'Send to voicemail' },
  { value: 'forward', label: 'Forward to a phone number' },
  { value: 'hangup', label: 'Hang up' },
];
const VOICES = ['Polly.Joanna', 'Polly.Matthew', 'Polly.Carmen', 'Polly.Salli', 'alice'];
const LANGS = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'he-IL', label: 'Hebrew' },
  { value: 'yi', label: 'Yiddish' },
  { value: 'es-US', label: 'Spanish (US)' },
];

const TABS = [
  { id: 'ivr', label: 'IVR Builder', icon: ListTree },
  { id: 'extensions', label: 'Extensions', icon: Phone },
  { id: 'devices', label: 'Devices', icon: Settings2 },
  { id: 'voicemails', label: 'Voicemails', icon: Voicemail },
  { id: 'activity', label: 'Call Activity', icon: PhoneCall },
];

const sel =
  'flex h-10 w-full items-center rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/40';

const PhoneSystemView = ({ role }) => {
  const [tab, setTab] = useState('ivr');
  const isAdmin = PRINCIPAL_ROLES.includes(role);

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-slate-500">
        <Phone className="h-10 w-10 mx-auto mb-3 text-slate-300" />
        <p className="font-medium">The phone system can only be managed by the principal.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
          <Phone className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Phone System</h1>
          <p className="text-sm text-slate-500">Extensions, IVR menus, devices & voicemail</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-200 mb-5 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                tab === t.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'ivr' && <IvrBuilderTab />}
      {tab === 'extensions' && <ExtensionsTab />}
      {tab === 'devices' && <DevicesTab />}
      {tab === 'voicemails' && <VoicemailsTab />}
      {tab === 'activity' && <CallActivityTab />}
    </div>
  );
};

/* ============================ Extensions ============================ */
const blankExt = () => ({
  ext_number: '',
  label: '',
  staff_member_id: '',
  app_user_id: '',
  sip_endpoint: '',
  forward_number: '',
  ring_timeout: 25,
  voicemail_enabled: true,
  voicemail_greeting_text: '',
  is_active: true,
});

const ExtensionsTab = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [staff, setStaff] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ext, st, us] = await Promise.all([
        listExtensions(),
        supabase.from('staff_members').select('id, full_name, hebrew_name, position').eq('is_active', true).order('full_name'),
        supabase.from('app_users').select('id, name, email, role').order('name'),
      ]);
      setRows(ext);
      setStaff(st.data || []);
      setUsers(us.data || []);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Could not load extensions', description: e.message });
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      const payload = { ...editing };
      payload.staff_member_id = payload.staff_member_id || null;
      payload.app_user_id = payload.app_user_id || null;
      payload.ring_timeout = parseInt(payload.ring_timeout, 10) || 25;
      if (!payload.ext_number || !payload.label) {
        toast({ variant: 'destructive', title: 'Extension number and label are required' });
        return;
      }
      await saveExtension(payload);
      toast({ title: 'Extension saved' });
      setEditing(null);
      load();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Save failed', description: e.message });
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this extension?')) return;
    try {
      await deleteExtension(id);
      load();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Delete failed', description: e.message });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-slate-500">{rows.length} extension(s)</p>
        <Button size="sm" onClick={() => setEditing(blankExt())}>
          <Plus className="h-4 w-4 mr-1" /> Add extension
        </Button>
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm">Loading…</p>
      ) : (
        <div className="grid gap-2">
          {rows.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="h-9 w-12 rounded bg-slate-100 flex items-center justify-center font-mono font-semibold text-slate-700">
                  {r.ext_number}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{r.label}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {r.app_users?.name ? `Rings ${r.app_users.name}` : 'No screen-pop user'}
                    {r.forward_number ? ` · ☎ ${r.forward_number}` : ''}
                    {r.sip_endpoint ? ` · SIP` : ''}
                  </p>
                </div>
                {!r.is_active && <Badge variant="secondary">Inactive</Badge>}
                {r.voicemail_enabled && <Voicemail className="h-4 w-4 text-slate-400" />}
                <Button variant="ghost" size="sm" onClick={() => setEditing(r)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => remove(r.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </CardContent>
            </Card>
          ))}
          {rows.length === 0 && <p className="text-slate-400 text-sm">No extensions yet.</p>}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit extension' : 'New extension'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Extension #</Label>
                <Input
                  value={editing.ext_number}
                  onChange={(e) => setEditing({ ...editing, ext_number: e.target.value })}
                  placeholder="101"
                />
              </div>
              <div>
                <Label>Label</Label>
                <Input
                  value={editing.label}
                  onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                  placeholder="Principal"
                />
              </div>
              <div className="col-span-2">
                <Label>Staff member (directory link)</Label>
                <select
                  className={sel}
                  value={editing.staff_member_id || ''}
                  onChange={(e) => setEditing({ ...editing, staff_member_id: e.target.value })}
                >
                  <option value="">— none —</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} {s.position ? `(${s.position})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <Label>Screen-pop user (whose screen opens the caller)</Label>
                <select
                  className={sel}
                  value={editing.app_user_id || ''}
                  onChange={(e) => setEditing({ ...editing, app_user_id: e.target.value })}
                >
                  <option value="">— none —</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email} {u.role ? `(${u.role})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>SIP endpoint (desk phone)</Label>
                <Input
                  value={editing.sip_endpoint || ''}
                  onChange={(e) => setEditing({ ...editing, sip_endpoint: e.target.value })}
                  placeholder="principal@space.sip.signalwire.com"
                />
              </div>
              <div>
                <Label>Forward number (cell/home)</Label>
                <Input
                  value={editing.forward_number || ''}
                  onChange={(e) => setEditing({ ...editing, forward_number: e.target.value })}
                  placeholder="845-555-1234"
                />
              </div>
              <div>
                <Label>Ring seconds</Label>
                <Input
                  type="number"
                  value={editing.ring_timeout}
                  onChange={(e) => setEditing({ ...editing, ring_timeout: e.target.value })}
                />
              </div>
              <div className="flex items-end gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!editing.voicemail_enabled}
                    onChange={(e) => setEditing({ ...editing, voicemail_enabled: e.target.checked })}
                  />
                  Voicemail
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!editing.is_active}
                    onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                  />
                  Active
                </label>
              </div>
              <div className="col-span-2">
                <Label>Voicemail greeting (text)</Label>
                <Textarea
                  rows={2}
                  value={editing.voicemail_greeting_text || ''}
                  onChange={(e) => setEditing({ ...editing, voicemail_greeting_text: e.target.value })}
                  placeholder="You've reached the principal's office. Please leave a message."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save}><Save className="h-4 w-4 mr-1" /> Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ============================ Devices ============================ */
const blankDevice = () => ({
  label: '', device_type: 'yealink', sip_username: '', mac_address: '',
  extension_id: '', status: 'unknown', notes: '', is_active: true,
});

const DevicesTab = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [exts, setExts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, e] = await Promise.all([listDevices(), listExtensions()]);
      setRows(d);
      setExts(e);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Could not load devices', description: err.message });
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      const payload = { ...editing, extension_id: editing.extension_id || null };
      if (!payload.label) {
        toast({ variant: 'destructive', title: 'Label is required' });
        return;
      }
      await saveDevice(payload);
      toast({ title: 'Device saved' });
      setEditing(null);
      load();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Save failed', description: e.message });
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this device?')) return;
    try { await deleteDevice(id); load(); }
    catch (e) { toast({ variant: 'destructive', title: 'Delete failed', description: e.message }); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-slate-500">{rows.length} device(s)</p>
        <Button size="sm" onClick={() => setEditing(blankDevice())}>
          <Plus className="h-4 w-4 mr-1" /> Add device
        </Button>
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm">Loading…</p>
      ) : (
        <div className="grid gap-2">
          {rows.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <Settings2 className="h-5 w-5 text-slate-400" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{r.label}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {r.device_type}
                    {r.phone_extensions?.ext_number ? ` · ext ${r.phone_extensions.ext_number}` : ''}
                    {r.mac_address ? ` · ${r.mac_address}` : ''}
                  </p>
                </div>
                <Badge variant={r.status === 'registered' ? 'default' : 'secondary'}>{r.status}</Badge>
                <Button variant="ghost" size="sm" onClick={() => setEditing(r)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </CardContent>
            </Card>
          ))}
          {rows.length === 0 && <p className="text-slate-400 text-sm">No devices yet.</p>}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit device' : 'New device'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Label</Label>
                <Input value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} placeholder="Front desk Yealink T54W" />
              </div>
              <div>
                <Label>Type</Label>
                <select className={sel} value={editing.device_type} onChange={(e) => setEditing({ ...editing, device_type: e.target.value })}>
                  <option value="yealink">Yealink</option>
                  <option value="sip">Generic SIP</option>
                  <option value="ata">ATA / analog adapter</option>
                  <option value="softphone">Softphone</option>
                </select>
              </div>
              <div>
                <Label>Linked extension</Label>
                <select className={sel} value={editing.extension_id || ''} onChange={(e) => setEditing({ ...editing, extension_id: e.target.value })}>
                  <option value="">— none —</option>
                  {exts.map((x) => <option key={x.id} value={x.id}>{x.ext_number} · {x.label}</option>)}
                </select>
              </div>
              <div>
                <Label>SIP username</Label>
                <Input value={editing.sip_username || ''} onChange={(e) => setEditing({ ...editing, sip_username: e.target.value })} />
              </div>
              <div>
                <Label>MAC address</Label>
                <Input value={editing.mac_address || ''} onChange={(e) => setEditing({ ...editing, mac_address: e.target.value })} placeholder="80:5e:..." />
              </div>
              <div className="col-span-2">
                <Label>Notes</Label>
                <Textarea rows={2} value={editing.notes || ''} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
              </div>
              <p className="col-span-2 text-xs text-slate-400">
                SIP passwords are stored in SignalWire, never here.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save}><Save className="h-4 w-4 mr-1" /> Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ============================ IVR Builder ============================ */
const IvrBuilderTab = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [menus, setMenus] = useState([]);
  const [exts, setExts] = useState([]);
  const [path, setPath] = useState([]); // breadcrumb of menu ids
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingGreeting, setSavingGreeting] = useState(false);
  const [editingOption, setEditingOption] = useState(null);
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const currentMenu = useMemo(() => {
    const id = path[path.length - 1];
    return menus.find((m) => m.id === id) || null;
  }, [menus, path]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, e] = await Promise.all([listMenus(), listExtensions()]);
      setMenus(m);
      setExts(e);
      if (path.length === 0) {
        const root = m.find((x) => x.is_root) || m[0];
        if (root) setPath([root.id]);
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Could not load IVR', description: err.message });
    }
    setLoading(false);
  }, [toast, path.length]);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadOptions = useCallback(async (menuId) => {
    if (!menuId) { setOptions([]); return; }
    try { setOptions(await listOptions(menuId)); }
    catch (e) { toast({ variant: 'destructive', title: 'Could not load options', description: e.message }); }
  }, [toast]);

  useEffect(() => {
    if (currentMenu) loadOptions(currentMenu.id);
  }, [currentMenu, loadOptions]);

  const updateMenuField = (patch) => {
    setMenus((prev) => prev.map((m) => (m.id === currentMenu.id ? { ...m, ...patch } : m)));
  };

  const saveGreeting = async () => {
    setSavingGreeting(true);
    try {
      const { id, name, is_root, greeting_audio_url, greeting_text, greeting_voice, greeting_language, invalid_retries, timeout_sec, is_active } = currentMenu;
      await saveMenu({ id, name, is_root, greeting_audio_url, greeting_text, greeting_voice, greeting_language, invalid_retries, timeout_sec, is_active, updated_by: user?.id || null });
      toast({ title: 'Menu saved' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Save failed', description: e.message });
    }
    setSavingGreeting(false);
  };

  const onUploadGreeting = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadAudio(file, 'ivr');
      updateMenuField({ greeting_audio_url: url });
      toast({ title: 'Audio uploaded', description: 'Remember to Save the menu.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Upload failed', description: err.message });
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const addMenu = async (asRoot = false) => {
    try {
      const created = await saveMenu({
        name: asRoot ? 'Main Menu' : `Submenu ${menus.length}`,
        is_root: asRoot,
        greeting_text: 'Please make a selection.',
        greeting_voice: 'Polly.Joanna',
        greeting_language: 'en-US',
        invalid_retries: 3,
        timeout_sec: 6,
        is_active: true,
        updated_by: user?.id || null,
      });
      await load();
      return created;
    } catch (e) {
      toast({ variant: 'destructive', title: 'Could not create menu', description: e.message });
      return null;
    }
  };

  const removeMenu = async () => {
    if (!currentMenu || currentMenu.is_root) {
      toast({ variant: 'destructive', title: 'Cannot delete the main menu' });
      return;
    }
    if (!window.confirm('Delete this submenu and its options?')) return;
    try {
      await deleteMenu(currentMenu.id);
      setPath((p) => p.slice(0, -1));
      await load();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Delete failed', description: e.message });
    }
  };

  const openSubmenu = (menuId) => setPath((p) => [...p, menuId]);
  const goToCrumb = (idx) => setPath((p) => p.slice(0, idx + 1));

  const saveOpt = async (opt) => {
    try {
      const payload = {
        ...opt,
        menu_id: currentMenu.id,
        target_extension_id: opt.action_type === 'extension' ? (opt.target_extension_id || null) : null,
        target_submenu_id: opt.action_type === 'submenu' ? (opt.target_submenu_id || null) : null,
      };
      await saveOption(payload);
      setEditingOption(null);
      loadOptions(currentMenu.id);
      toast({ title: 'Option saved' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Save failed', description: e.message });
    }
  };

  const removeOpt = async (id) => {
    if (!window.confirm('Remove this key?')) return;
    try { await deleteOption(id); loadOptions(currentMenu.id); }
    catch (e) { toast({ variant: 'destructive', title: 'Delete failed', description: e.message }); }
  };

  if (loading) return <p className="text-slate-400 text-sm">Loading…</p>;

  if (!currentMenu) {
    return (
      <div className="text-center py-10">
        <ListTree className="h-10 w-10 mx-auto mb-3 text-slate-300" />
        <p className="text-slate-500 mb-3">No IVR menu yet.</p>
        <Button onClick={() => addMenu(true)}><Plus className="h-4 w-4 mr-1" /> Create main menu</Button>
      </div>
    );
  }

  const usedDigits = new Set(options.map((o) => o.digit));

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm mb-4 flex-wrap">
        {path.map((id, idx) => {
          const m = menus.find((x) => x.id === id);
          if (!m) return null;
          return (
            <React.Fragment key={id}>
              {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
              <button
                onClick={() => goToCrumb(idx)}
                className={`flex items-center gap-1 px-2 py-1 rounded ${idx === path.length - 1 ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {idx === 0 && <Home className="h-3.5 w-3.5" />}
                {m.name}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Greeting editor */}
      <Card className="mb-5">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Input
                className="font-semibold max-w-xs"
                value={currentMenu.name}
                onChange={(e) => updateMenuField({ name: e.target.value })}
              />
              {currentMenu.is_root && <Badge>Main</Badge>}
            </div>
            {!currentMenu.is_root && (
              <Button variant="ghost" size="sm" onClick={removeMenu}>
                <Trash2 className="h-4 w-4 text-red-500 mr-1" /> Delete menu
              </Button>
            )}
          </div>

          <div>
            <Label>Greeting message (spoken)</Label>
            <Textarea
              rows={2}
              value={currentMenu.greeting_text || ''}
              onChange={(e) => updateMenuField({ greeting_text: e.target.value })}
              placeholder="Thank you for calling. Press 1 for the office, press 2 for…"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <Label>Voice</Label>
              <select className={sel} value={currentMenu.greeting_voice} onChange={(e) => updateMenuField({ greeting_voice: e.target.value })}>
                {VOICES.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <Label>Language</Label>
              <select className={sel} value={currentMenu.greeting_language} onChange={(e) => updateMenuField({ greeting_language: e.target.value })}>
                {LANGS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <div>
              <Label>Retries</Label>
              <Input type="number" value={currentMenu.invalid_retries} onChange={(e) => updateMenuField({ invalid_retries: parseInt(e.target.value, 10) || 3 })} />
            </div>
            <div>
              <Label>Input wait (s)</Label>
              <Input type="number" value={currentMenu.timeout_sec} onChange={(e) => updateMenuField({ timeout_sec: parseInt(e.target.value, 10) || 6 })} />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={onUploadGreeting} />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Upload className="h-4 w-4 mr-1" /> {uploading ? 'Uploading…' : 'Upload recording'}
            </Button>
            {currentMenu.greeting_audio_url && (
              <>
                <audio controls src={currentMenu.greeting_audio_url} className="h-8" />
                <Button variant="ghost" size="sm" onClick={() => updateMenuField({ greeting_audio_url: null })}>
                  <X className="h-4 w-4 mr-1" /> Remove audio
                </Button>
              </>
            )}
            <span className="text-xs text-slate-400">Uploaded audio plays instead of the spoken text.</span>
            <Button className="ml-auto" size="sm" onClick={saveGreeting} disabled={savingGreeting}>
              <Save className="h-4 w-4 mr-1" /> {savingGreeting ? 'Saving…' : 'Save menu'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Keys */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-slate-700">Keypad options</h3>
        <Button size="sm" variant="outline" onClick={() => setEditingOption({ digit: DIGITS.find((d) => !usedDigits.has(d)) || '1', action_type: 'extension', label: '', sort_order: options.length })}>
          <Plus className="h-4 w-4 mr-1" /> Add key
        </Button>
      </div>

      <div className="grid gap-2">
        {options.map((o) => (
          <Card key={o.id}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">{o.digit}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 truncate">{o.label || ACTION_TYPES.find((a) => a.value === o.action_type)?.label}</p>
                <p className="text-xs text-slate-500 truncate">{describeOption(o, exts, menus)}</p>
              </div>
              {o.action_type === 'submenu' && o.target_submenu_id && (
                <Button variant="ghost" size="sm" onClick={() => openSubmenu(o.target_submenu_id)}>
                  Open <ChevronRight className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setEditingOption(o)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => removeOpt(o.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
            </CardContent>
          </Card>
        ))}
        {options.length === 0 && <p className="text-slate-400 text-sm">No keys configured. Add one to route callers.</p>}
      </div>

      <OptionEditor
        option={editingOption}
        onClose={() => setEditingOption(null)}
        onSave={saveOpt}
        exts={exts}
        menus={menus}
        usedDigits={usedDigits}
        onCreateSubmenu={addMenu}
      />
    </div>
  );
};

const describeOption = (o, exts, menus) => {
  switch (o.action_type) {
    case 'extension': {
      const x = exts.find((e) => e.id === o.target_extension_id);
      return x ? `Rings ext ${x.ext_number} · ${x.label}` : 'No extension selected';
    }
    case 'submenu': {
      const m = menus.find((mm) => mm.id === o.target_submenu_id);
      return m ? `Opens submenu “${m.name}”` : 'No submenu selected';
    }
    case 'message': return `Plays a message`;
    case 'voicemail': return `Sends to voicemail`;
    case 'forward': return `Forwards to ${o.forward_number || '—'}`;
    case 'hangup': return `Ends the call`;
    default: return '';
  }
};

const OptionEditor = ({ option, onClose, onSave, exts, menus, usedDigits, onCreateSubmenu }) => {
  const [draft, setDraft] = useState(option);
  const [creating, setCreating] = useState(false);
  useEffect(() => setDraft(option), [option]);
  if (!draft) return null;

  const availableDigits = DIGITS.filter((d) => !usedDigits.has(d) || d === option?.digit);
  const subMenus = menus.filter((m) => !m.is_root);

  const createAndLink = async () => {
    setCreating(true);
    const m = await onCreateSubmenu(false);
    setCreating(false);
    if (m) setDraft({ ...draft, target_submenu_id: m.id });
  };

  return (
    <Dialog open={!!option} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{option?.id ? `Edit key ${option.digit}` : 'Add key'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>When caller presses</Label>
              <select className={sel} value={draft.digit} onChange={(e) => setDraft({ ...draft, digit: e.target.value })}>
                {availableDigits.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <Label>Action</Label>
              <select className={sel} value={draft.action_type} onChange={(e) => setDraft({ ...draft, action_type: e.target.value })}>
                {ACTION_TYPES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <Label>Label (optional)</Label>
            <Input value={draft.label || ''} onChange={(e) => setDraft({ ...draft, label: e.target.value })} placeholder="e.g. Principal's office" />
          </div>

          {draft.action_type === 'extension' && (
            <div>
              <Label>Extension</Label>
              <select className={sel} value={draft.target_extension_id || ''} onChange={(e) => setDraft({ ...draft, target_extension_id: e.target.value })}>
                <option value="">— choose —</option>
                {exts.map((x) => <option key={x.id} value={x.id}>{x.ext_number} · {x.label}</option>)}
              </select>
            </div>
          )}

          {draft.action_type === 'submenu' && (
            <div>
              <Label>Submenu</Label>
              <div className="flex gap-2">
                <select className={sel} value={draft.target_submenu_id || ''} onChange={(e) => setDraft({ ...draft, target_submenu_id: e.target.value })}>
                  <option value="">— choose —</option>
                  {subMenus.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <Button variant="outline" size="sm" onClick={createAndLink} disabled={creating}>
                  <Plus className="h-4 w-4 mr-1" /> New
                </Button>
              </div>
            </div>
          )}

          {draft.action_type === 'message' && (
            <div>
              <Label>Message to speak</Label>
              <Textarea rows={3} value={draft.message_text || ''} onChange={(e) => setDraft({ ...draft, message_text: e.target.value })} placeholder="Our office hours are 9 to 4…" />
            </div>
          )}

          {draft.action_type === 'forward' && (
            <div>
              <Label>Forward to number</Label>
              <Input value={draft.forward_number || ''} onChange={(e) => setDraft({ ...draft, forward_number: e.target.value })} placeholder="845-555-1234" />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(draft)}><Save className="h-4 w-4 mr-1" /> Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ============================ Voicemails ============================ */
const VoicemailsTab = () => {
  const { toast } = useToast();
  const { open: openStudent } = useStudentProfile();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await listVoicemails()); }
    catch (e) { toast({ variant: 'destructive', title: 'Could not load voicemails', description: e.message }); }
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const toggleRead = async (vm) => {
    try { await markVoicemailRead(vm.id, !vm.is_read); load(); }
    catch (e) { toast({ variant: 'destructive', title: 'Update failed', description: e.message }); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this voicemail?')) return;
    try { await deleteVoicemail(id); load(); }
    catch (e) { toast({ variant: 'destructive', title: 'Delete failed', description: e.message }); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-slate-500">{rows.length} voicemail(s)</p>
        <Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
      </div>
      {loading ? (
        <p className="text-slate-400 text-sm">Loading…</p>
      ) : (
        <div className="grid gap-2">
          {rows.map((vm) => (
            <Card key={vm.id} className={vm.is_read ? '' : 'border-blue-300 bg-blue-50/40'}>
              <CardContent className="p-3 flex items-center gap-3 flex-wrap">
                <Voicemail className={`h-5 w-5 ${vm.is_read ? 'text-slate-300' : 'text-blue-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">
                    {vm.matched_name || vm.caller_number || 'Unknown'}
                    {vm.phone_extensions?.label ? ` → ${vm.phone_extensions.label}` : ''}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(vm.created_at).toLocaleString()} {vm.duration_sec ? `· ${vm.duration_sec}s` : ''}
                  </p>
                </div>
                {vm.recording_url && <audio controls src={vm.recording_url} className="h-8" />}
                {vm.matched_type === 'parent' && vm.matched_id && (
                  <Button variant="ghost" size="sm" onClick={() => openStudent(vm.matched_id)}>
                    <User className="h-4 w-4 mr-1" /> Open
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => toggleRead(vm)} title={vm.is_read ? 'Mark unread' : 'Mark read'}>
                  <MailCheck className={`h-4 w-4 ${vm.is_read ? 'text-slate-300' : 'text-blue-500'}`} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => remove(vm.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </CardContent>
            </Card>
          ))}
          {rows.length === 0 && <p className="text-slate-400 text-sm">No voicemails.</p>}
        </div>
      )}
    </div>
  );
};

/* ============================ Call Activity ============================ */
const CallActivityTab = () => {
  const { toast } = useToast();
  const { open: openStudent } = useStudentProfile();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await listInboundCalls(150)); }
    catch (e) { toast({ variant: 'destructive', title: 'Could not load activity', description: e.message }); }
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const statusColor = (s) => ({
    answered: 'default', missed: 'destructive', voicemail: 'secondary', ringing: 'secondary',
  }[s] || 'secondary');

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-slate-500">Recent inbound calls</p>
        <Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
      </div>
      {loading ? (
        <p className="text-slate-400 text-sm">Loading…</p>
      ) : (
        <div className="grid gap-2">
          {rows.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-3 flex items-center gap-3 flex-wrap">
                <PhoneCall className="h-5 w-5 text-slate-400" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">
                    {c.matched_name || c.caller_number || 'Unknown'}
                    {c.phone_extensions?.label ? ` → ${c.phone_extensions.label}` : ''}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(c.created_at).toLocaleString()} · {c.caller_number || 'no caller ID'}
                  </p>
                </div>
                <Badge variant={statusColor(c.status)}>{c.status}</Badge>
                {c.matched_type === 'parent' && c.matched_id && (
                  <Button variant="ghost" size="sm" onClick={() => openStudent(c.matched_id)}>
                    <User className="h-4 w-4 mr-1" /> Open
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
          {rows.length === 0 && <p className="text-slate-400 text-sm">No inbound calls logged yet.</p>}
        </div>
      )}
    </div>
  );
};

export default PhoneSystemView;
