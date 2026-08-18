import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, CheckCheck, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudentProfile } from '@/contexts/StudentProfileContext';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/notificationService';

const PRIORITY_DOT = {
  high: 'bg-red-500',
  normal: 'bg-blue-500',
  low: 'bg-slate-300',
};

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  return `${d}d`;
}

/**
 * In-app notification bell + dropdown (Phase 7).
 * Shows an unread badge, lists recent notifications, and deep-links to the
 * related student or Dashboard view. Email notifications are unaffected.
 */
const NotificationBell = ({ onNavigate }) => {
  const { profile } = useAuth();
  const { isRTL } = useLanguage();
  const { open: openStudent } = useStudentProfile();
  const userId = profile?.id;

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const refreshCount = useCallback(async () => {
    if (!userId) return;
    setUnread(await fetchUnreadCount(userId));
  }, [userId]);

  const loadList = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const data = await fetchNotifications(userId);
    setItems(data);
    setLoading(false);
  }, [userId]);

  // Poll unread count periodically.
  useEffect(() => {
    if (!userId) return;
    refreshCount();
    const t = setInterval(refreshCount, 60000);
    return () => clearInterval(t);
  }, [userId, refreshCount]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) loadList();
  };

  const handleOpenItem = async (n) => {
    if (!n.is_read) {
      await markNotificationRead(n.id);
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      refreshCount();
    }
    setOpen(false);
    if (n.related_student_id) {
      openStudent(n.related_student_id);
    } else if (n.link_type && onNavigate) {
      onNavigate(n.link_type);
    }
  };

  const handleMarkAll = async () => {
    await markAllNotificationsRead(userId);
    setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
    setUnread(0);
  };

  if (!userId) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={toggle}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative inline-flex items-center justify-center h-9 w-9 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Bell size={20} strokeWidth={1.75} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -end-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-[18px] text-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-2 w-[340px] max-w-[92vw] rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden ${isRTL ? 'start-0' : 'end-0'}`}
          style={isRTL ? { insetInlineStart: 0 } : { insetInlineEnd: 0 }}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
            <span className="font-semibold text-slate-800 text-sm">
              {isRTL ? 'התראות' : 'Notifications'}
            </span>
            {items.some((i) => !i.is_read) && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <CheckCheck size={14} /> {isRTL ? 'סמן הכל כנקרא' : 'Mark all read'}
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-slate-400">
                {isRTL ? 'אין התראות' : 'No notifications'}
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleOpenItem(n)}
                      className={`w-full text-start px-4 py-3 flex gap-3 hover:bg-slate-50 transition-colors ${n.is_read ? '' : 'bg-blue-50/40'}`}
                    >
                      <span className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${n.is_read ? 'bg-transparent' : (PRIORITY_DOT[n.priority] || PRIORITY_DOT.normal)}`} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className={`text-sm truncate ${n.is_read ? 'text-slate-600' : 'font-semibold text-slate-900'}`}>
                            {n.title}
                          </span>
                          <span className="text-[11px] text-slate-400 flex-shrink-0">{timeAgo(n.created_at)}</span>
                        </span>
                        {n.body && (
                          <span className="block text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</span>
                        )}
                      </span>
                      {!n.is_read && <Check size={14} className="text-slate-300 flex-shrink-0 mt-1" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
