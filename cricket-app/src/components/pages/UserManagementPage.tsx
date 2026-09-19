// ═══════════════════════════════════════════════════════════════
// KDPL USER MANAGEMENT — Admin panel for user approvals
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { UsersIcon, CheckIcon, XIcon, SearchIcon } from '../ui/Icons';
import type { KDPLStore } from '../../store/useKDPLStore';
import type { UserProfile, Role } from '../../types';

const SAMPLE_USERS: UserProfile[] = [];

const LS_KEY = 'kdpl_users';
const CLOUD_DOC = doc(db, 'kdpl', 'data');
function getSavedUsers(): UserProfile[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || JSON.stringify(SAMPLE_USERS)); } catch { return SAMPLE_USERS; }
}
function saveUsers(users: UserProfile[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(users));
  setDoc(CLOUD_DOC, { users }, { merge: true }).catch(e => console.warn('Cloud sync failed', e));
}

export default function UserManagementPage({ store }: { store: KDPLStore }) {
  const { state, approveOrganizer, rejectOrganizer, removeOrganizer } = store;
  const { isSuperAdmin, organizers } = state;
  const [users, setUsers] = useState<UserProfile[]>(getSavedUsers());
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [tab, setTab] = useState<'players' | 'organizers'>('players');

  // Cloud sync — pick up registrations/approvals made from other devices
  useEffect(() => {
    const unsub = onSnapshot(CLOUD_DOC, snap => {
      const data = snap.data();
      if (data?.users !== undefined) {
        setUsers(data.users as UserProfile[]);
        localStorage.setItem(LS_KEY, JSON.stringify(data.users));
      }
    }, e => console.warn('Cloud sync unavailable:', e.message));
    return () => unsub();
  }, []);

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center gap-2">
        <div className="text-4xl mb-2">🛡️</div>
        <h3 className="text-kdpl-text font-oswald font-bold text-xl">Super Admin Access Required</h3>
        <p className="text-kdpl-muted text-sm max-w-xs">Only the Super Admin can approve/reject user registrations. Sign in with Firebase Auth.</p>
      </div>
    );
  }

  const updateUser = (uid: string, changes: Partial<UserProfile>) => {
    const updated = users.map(u => u.uid === uid ? { ...u, ...changes } : u);
    setUsers(updated); saveUsers(updated);
  };

  const approveUser = (uid: string) => updateUser(uid, { status: 'approved' });
  const rejectUser = (uid: string) => updateUser(uid, { status: 'rejected' });
  const banUser = (uid: string, ban: boolean) => updateUser(uid, { status: ban ? 'banned' : 'approved' });
  const changeRole = (uid: string, role: Role) => updateUser(uid, { role });

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || u.status === filter;
    return matchSearch && matchFilter;
  });

  const pendingCount = users.filter(u => u.status === 'pending').length;
  const pendingOrganizerCount = organizers.filter(o => o.status === 'pending').length;

  const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    approved: 'bg-green-500/20 text-green-400 border-green-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    banned: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  const ROLE_STYLES: Record<string, string> = {
    SUPER_ADMIN: 'text-red-400', ADMIN: 'text-kdpl-neon', CAPTAIN: 'text-blue-400',
    USER: 'text-kdpl-muted', GUEST: 'text-kdpl-muted',
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-kdpl-text font-oswald font-bold text-xl">User Management</h2>
          <p className="text-kdpl-muted text-xs">
            {tab === 'players' ? `${users.length} total users · ${pendingCount} pending` : `${organizers.length} organizer accounts · ${pendingOrganizerCount} pending`}
          </p>
        </div>
        {((tab === 'players' && pendingCount > 0) || (tab === 'organizers' && pendingOrganizerCount > 0)) && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-yellow-400 text-xs font-bold">{tab === 'players' ? pendingCount : pendingOrganizerCount} Pending</span>
          </div>
        )}
      </div>

      {/* Tab toggle */}
      <div className="flex bg-kdpl-darker border border-kdpl-border rounded-xl p-1">
        <button onClick={() => setTab('players')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all relative ${tab === 'players' ? 'bg-kdpl-neon text-kdpl-darker' : 'text-kdpl-muted'}`}>
          Players / Users
        </button>
        <button onClick={() => setTab('organizers')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all relative ${tab === 'organizers' ? 'bg-kdpl-neon text-kdpl-darker' : 'text-kdpl-muted'}`}>
          Organizers
          {pendingOrganizerCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">{pendingOrganizerCount}</span>
          )}
        </button>
      </div>

      {tab === 'organizers' ? (
        <div className="flex flex-col gap-3">
          {organizers.length === 0 && (
            <div className="text-center py-10 text-kdpl-muted">
              <UsersIcon size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No organizer accounts yet</p>
            </div>
          )}
          {organizers.map(org => (
            <div key={org.uid} className={`rounded-2xl bg-kdpl-card border overflow-hidden p-4 ${org.status === 'pending' ? 'border-yellow-500/40' : 'border-kdpl-border'}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-kdpl-text font-semibold text-sm">{org.name}</div>
                  <div className="text-kdpl-muted text-xs">{org.email}</div>
                  <div className="text-kdpl-muted text-[10px] mt-0.5">Registered {new Date(org.createdAt).toLocaleDateString()}</div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[org.status] || ''}`}>
                  {org.status.toUpperCase()}
                </span>
              </div>
              <div className="flex gap-2">
                {org.status !== 'approved' && (
                  <button onClick={() => approveOrganizer(org.uid)}
                    className="flex-1 py-2 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold flex items-center justify-center gap-1">
                    <CheckIcon size={12} /> Approve
                  </button>
                )}
                {org.status !== 'rejected' && (
                  <button onClick={() => rejectOrganizer(org.uid)}
                    className="flex-1 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold flex items-center justify-center gap-1">
                    <XIcon size={12} /> Reject
                  </button>
                )}
                <button onClick={() => removeOrganizer(org.uid)}
                  className="px-3 py-2 rounded-xl bg-kdpl-card border border-kdpl-border text-kdpl-muted text-xs font-medium">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>

      {/* Search + filter */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-kdpl-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-kdpl-card border border-kdpl-border rounded-xl pl-9 pr-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none"
            placeholder="Search users..." />
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`flex-1 py-1.5 rounded-full text-xs font-medium capitalize border transition-all ${filter === s ? 'bg-kdpl-neon text-kdpl-darker border-kdpl-neon' : 'bg-kdpl-card text-kdpl-muted border-kdpl-border'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Pending Alert Banner */}
      {filter === 'all' && pendingCount > 0 && (
        <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-3 flex items-center gap-3">
          <span className="text-2xl">⏳</span>
          <div className="flex-1">
            <div className="text-yellow-400 font-semibold text-sm">{pendingCount} Registration{pendingCount > 1 ? 's' : ''} Awaiting Approval</div>
            <div className="text-yellow-400/70 text-xs">Review and approve or reject below</div>
          </div>
          <button onClick={() => setFilter('pending')} className="text-xs text-yellow-400 underline">View</button>
        </div>
      )}

      {/* Users List */}
      <div className="flex flex-col gap-3">
        {filtered.map(user => (
          <div key={user.uid} className={`rounded-2xl bg-kdpl-card border overflow-hidden ${user.status === 'pending' ? 'border-yellow-500/40' : 'border-kdpl-border'}`}>
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-kdpl-darker border border-kdpl-border flex items-center justify-center">
                    <span className="text-xl">
                      {user.preferredRole === 'Batsman' ? '🏏' : user.preferredRole === 'Bowler' ? '🎳' : user.preferredRole === 'Wicket-Keeper' ? '🧤' : user.preferredRole === 'All-Rounder' ? '🌟' : '👤'}
                    </span>
                  </div>
                  <div>
                    <div className="text-kdpl-text font-semibold text-sm">{user.name}</div>
                    <div className="text-kdpl-muted text-xs">{user.email}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-bold ${ROLE_STYLES[user.role]}`}>{user.role}</span>
                      <span className="text-kdpl-border">·</span>
                      <span className="text-kdpl-muted text-[10px]">{user.city}</span>
                      <span className="text-kdpl-border">·</span>
                      <span className="text-kdpl-muted text-[10px]">{user.preferredRole}</span>
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[user.status] || ''}`}>
                  {user.status.toUpperCase()}
                </span>
              </div>

              {/* Meta */}
              <div className="flex gap-3 text-[10px] text-kdpl-muted mb-3">
                <span>📱 {user.phone}</span>
                <span>·</span>
                <span>📅 {new Date(user.createdAt).toLocaleDateString()}</span>
                {user.lastLogin > 0 && <><span>·</span><span>Login: {new Date(user.lastLogin).toLocaleDateString()}</span></>}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {user.status === 'pending' && (
                  <>
                    <button onClick={() => approveUser(user.uid)}
                      className="flex-1 py-2 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold flex items-center justify-center gap-1">
                      <CheckIcon size={12} /> Approve
                    </button>
                    <button onClick={() => rejectUser(user.uid)}
                      className="flex-1 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold flex items-center justify-center gap-1">
                      <XIcon size={12} /> Reject
                    </button>
                  </>
                )}
                {user.status === 'approved' && (
                  <>
                    {isSuperAdmin && (
                      <select defaultValue={user.role} onChange={e => changeRole(user.uid, e.target.value as Role)}
                        className="flex-1 bg-kdpl-darker border border-kdpl-border rounded-xl px-2 py-2 text-kdpl-text text-xs outline-none">
                        {['GUEST', 'USER', 'CAPTAIN', 'ADMIN', 'SUPER_ADMIN'].map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    )}
                    <button onClick={() => banUser(user.uid, true)}
                      className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                      Ban
                    </button>
                  </>
                )}
                {(user.status === 'banned' || user.status === 'rejected') && (
                  <button onClick={() => approveUser(user.uid)}
                    className="flex-1 py-2 rounded-xl bg-kdpl-card border border-kdpl-border text-kdpl-muted text-xs">
                    Restore
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-kdpl-muted">
            <UsersIcon size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No users found</p>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
