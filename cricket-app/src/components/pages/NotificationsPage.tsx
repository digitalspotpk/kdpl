// ═══════════════════════════════════════════════════════════════
// KDPL NOTIFICATIONS CENTER
// ═══════════════════════════════════════════════════════════════

import { BellIcon, CheckIcon, TrashIcon, SendIcon } from '../ui/Icons';
import { useState } from 'react';
import type { KDPLStore } from '../../store/useKDPLStore';
import { genId } from '../../utils/id';
import type { Notification, NotificationType } from '../../types';

const TYPE_ICONS: Record<NotificationType, string> = {
  'match-start': '🏏', 'toss-result': '🪙', 'wicket-alert': '🔴', 'score-update': '📊',
  'registration-approved': '✅', 'system-announcement': '📢', 'boundary': '🏅', 'milestone': '🌟',
};

export default function NotificationsPage({ store }: { store: KDPLStore }) {
  const { state, markNotifRead, markAllRead, clearNotifications, addNotification } = store;
  const { notifications, isAdmin } = state;
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcast, setBroadcast] = useState({ title: '', body: '', type: 'system-announcement' as NotificationType });

  const unread = notifications.filter(n => !n.read).length;

  const groupByDate = () => {
    const groups: Record<string, Notification[]> = {};
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    notifications.forEach(n => {
      const d = new Date(n.timestamp).toDateString();
      const key = d === today ? 'Today' : d === yesterday ? 'Yesterday' : 'Earlier';
      if (!groups[key]) groups[key] = [];
      groups[key].push(n);
    });
    return groups;
  };

  const handleBroadcast = () => {
    if (!broadcast.title.trim()) return;
    const notif: Notification = {
      id: genId('n'),
      type: broadcast.type,
      title: broadcast.title,
      body: broadcast.body,
      read: false,
      timestamp: Date.now(),
    };
    addNotification(notif);
    setBroadcast({ title: '', body: '', type: 'system-announcement' });
    setShowBroadcast(false);
  };

  const groups = groupByDate();

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <BellIcon size={24} className="text-kdpl-text" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">{unread}</span>
            )}
          </div>
          <div>
            <h2 className="text-kdpl-text font-oswald font-bold text-xl">Notifications</h2>
            <p className="text-kdpl-muted text-xs">{unread} unread · {notifications.length} total</p>
          </div>
        </div>
        <div className="flex gap-2">
          {unread > 0 && (
            <button onClick={markAllRead}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-kdpl-card border border-kdpl-border rounded-xl text-kdpl-muted text-xs">
              <CheckIcon size={12} /> All Read
            </button>
          )}
          <button onClick={clearNotifications}
            className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <TrashIcon size={14} />
          </button>
        </div>
      </div>

      {/* Admin Broadcast */}
      {isAdmin && (
        <div>
          <button onClick={() => setShowBroadcast(!showBroadcast)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-kdpl-card border border-kdpl-border text-kdpl-text text-sm font-semibold">
            <div className="flex items-center gap-2">
              <SendIcon size={16} className="text-kdpl-neon" />
              Broadcast Notification
            </div>
            <span className="text-kdpl-muted text-xs">{showBroadcast ? '▲' : '▼'}</span>
          </button>

          {showBroadcast && (
            <div className="rounded-xl bg-kdpl-card border border-kdpl-border p-4 mt-2">
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-kdpl-muted text-xs mb-1 block">Type</label>
                  <select value={broadcast.type} onChange={e => setBroadcast(b => ({...b, type: e.target.value as NotificationType}))}
                    className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2 text-kdpl-text text-sm outline-none">
                    <option value="system-announcement">📢 System Announcement</option>
                    <option value="match-start">🏏 Match Start</option>
                    <option value="score-update">📊 Score Update</option>
                    <option value="milestone">🌟 Milestone</option>
                  </select>
                </div>
                <div>
                  <label className="text-kdpl-muted text-xs mb-1 block">Title *</label>
                  <input value={broadcast.title} onChange={e => setBroadcast(b => ({...b, title: e.target.value}))}
                    className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2 text-kdpl-text text-sm focus:border-kdpl-neon outline-none"
                    placeholder="Notification title" />
                </div>
                <div>
                  <label className="text-kdpl-muted text-xs mb-1 block">Message</label>
                  <textarea value={broadcast.body} onChange={e => setBroadcast(b => ({...b, body: e.target.value}))}
                    className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2 text-kdpl-text text-sm focus:border-kdpl-neon outline-none resize-none"
                    rows={3} placeholder="Notification message..." />
                </div>
                <button onClick={handleBroadcast}
                  className="w-full py-2.5 bg-kdpl-neon text-kdpl-darker rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                  <SendIcon size={16} /> Send Notification
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notification Groups */}
      {Object.entries(groups).map(([group, notifs]) => (
        <div key={group}>
          <div className="text-kdpl-muted text-xs font-semibold uppercase tracking-widest mb-2">{group}</div>
          <div className="flex flex-col gap-2">
            {notifs.map(notif => (
              <div key={notif.id}
                className={`rounded-xl border p-3 cursor-pointer transition-all ${!notif.read ? 'bg-kdpl-card border-kdpl-border' : 'bg-kdpl-card/50 border-kdpl-border/50 opacity-60'}`}
                onClick={() => markNotifRead(notif.id)}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-kdpl-darker border border-kdpl-border flex items-center justify-center text-xl flex-shrink-0">
                    {TYPE_ICONS[notif.type] || '🔔'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-kdpl-text text-sm font-semibold truncate">{notif.title}</div>
                      {!notif.read && <div className="w-2 h-2 rounded-full bg-kdpl-neon flex-shrink-0" />}
                    </div>
                    {notif.body && <p className="text-kdpl-muted text-xs mt-0.5 leading-relaxed">{notif.body}</p>}
                    <div className="text-kdpl-muted text-[10px] mt-1">
                      {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <div className="w-16 h-16 rounded-2xl bg-kdpl-card border border-kdpl-border flex items-center justify-center">
            <BellIcon size={28} className="text-kdpl-muted" />
          </div>
          <div className="text-center">
            <h3 className="text-kdpl-text font-oswald font-bold text-lg mb-1">No Notifications</h3>
            <p className="text-kdpl-muted text-sm">You're all caught up!</p>
          </div>
        </div>
      )}

      {/* Notification Preference Legend */}
      <div className="rounded-xl bg-kdpl-card border border-kdpl-border p-3">
        <div className="text-kdpl-muted text-xs font-semibold uppercase tracking-wide mb-2">Notification Types</div>
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(TYPE_ICONS).map(([type, icon]) => (
            <div key={type} className="flex items-center gap-2 text-[10px] text-kdpl-muted">
              <span className="text-base">{icon}</span>
              <span className="capitalize">{type.replace(/-/g, ' ')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
