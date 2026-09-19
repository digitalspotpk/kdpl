// ═══════════════════════════════════════════════════════════════
// KDPL TOURNAMENTS LIST — Public directory of every tournament
// Tapping a tournament opens its own dashboard (teams/matches/etc).
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { TrophyIcon, UsersIcon, CalendarIcon, ChevronRightIcon, PlusIcon, TrashIcon, EditPenIcon } from '../ui/Icons';
import type { KDPLStore } from '../../store/useKDPLStore';

export default function TournamentsListPage({ store }: { store: KDPLStore }) {
  const { state, switchTournament, navigate, deleteTournament } = store;
  const { tournaments, allTeams, allFixtures, authUid, isSuperAdmin } = state;
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [confirmText, setConfirmText] = useState('');

  const openTournament = (id: string) => {
    switchTournament(id);
    navigate('dashboard');
  };

  const editTournament = (id: string) => {
    switchTournament(id);
    navigate('tournament-config');
  };

  const handleDelete = () => {
    if (!confirmDelete || confirmText.trim() !== confirmDelete.name) return;
    deleteTournament(confirmDelete.id);
    setConfirmDelete(null);
    setConfirmText('');
  };

  const statusPill = (status: string) =>
    status === 'active' ? 'bg-green-500/15 text-green-400 border-green-500/30'
    : status === 'completed' ? 'bg-kdpl-border text-kdpl-muted border-kdpl-border'
    : 'bg-blue-500/15 text-blue-400 border-blue-500/30';

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-kdpl-text font-oswald font-bold text-xl flex items-center gap-2">
            <TrophyIcon size={20} className="text-kdpl-neon" /> All Tournaments
          </h2>
          <p className="text-kdpl-muted text-xs">Open any tournament to see its full record</p>
        </div>
      </div>

      <button onClick={() => navigate(authUid ? 'create-tournament' : 'organizer-auth')}
        className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-kdpl-neon text-kdpl-darker font-oswald font-bold text-sm shadow-lg shadow-kdpl-neon/20">
        <PlusIcon size={16} /> {authUid ? 'Create New Tournament' : 'Become an Organizer to Create a Tournament'}
      </button>

      {tournaments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
          <div className="text-4xl mb-1">🏏</div>
          <h3 className="text-kdpl-text font-oswald font-bold">No Tournaments Yet</h3>
          <p className="text-kdpl-muted text-sm max-w-xs">Be the first to create a tournament!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tournaments.map((t) => {
            const teamCount = allTeams.filter((tm) => tm.tournamentId === t.id).length;
            const fixtureCount = allFixtures.filter((f) => f.tournamentId === t.id).length;
            const canManage = isSuperAdmin || (!!authUid && t.organizerUid === authUid);
            return (
              <div key={t.id}
                className="flex items-center gap-3 rounded-2xl bg-kdpl-card border border-kdpl-border p-4 text-left active:scale-[0.99] transition-all">
                <button onClick={() => openTournament(t.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                  <div className="w-12 h-12 rounded-xl bg-kdpl-neon/10 border border-kdpl-neon/30 flex items-center justify-center flex-shrink-0 text-xl">
                    🏆
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-kdpl-text font-oswald font-bold text-sm truncate">{t.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full border capitalize flex-shrink-0 ${statusPill(t.status)}`}>{t.status}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-kdpl-muted text-[11px]">
                      <span className="flex items-center gap-1"><UsersIcon size={11} /> {teamCount} teams</span>
                      <span className="flex items-center gap-1"><CalendarIcon size={11} /> {fixtureCount} matches</span>
                    </div>
                    {t.organizer && <div className="text-kdpl-muted text-[10px] mt-0.5">by {t.organizer}</div>}
                  </div>
                </button>
                {canManage ? (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => editTournament(t.id)}
                      className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <EditPenIcon size={12} />
                    </button>
                    <button onClick={() => { setConfirmDelete({ id: t.id, name: t.name }); setConfirmText(''); }}
                      className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                      <TrashIcon size={12} />
                    </button>
                  </div>
                ) : (
                  <ChevronRightIcon size={18} className="text-kdpl-muted flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-kdpl-card border border-red-500/30 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-4">
            <h3 className="text-red-400 text-sm font-bold mb-2">⚠️ Delete "{confirmDelete.name}"?</h3>
            <p className="text-kdpl-muted text-xs mb-3">
              This permanently deletes the tournament and everything in it — teams, players, venues, fixtures, series and any live match data. This cannot be undone.
            </p>
            <label className="text-kdpl-muted text-xs mb-1 block">
              Type <span className="text-kdpl-text font-semibold">{confirmDelete.name}</span> to confirm:
            </label>
            <input value={confirmText} onChange={e => setConfirmText(e.target.value)}
              className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm outline-none mb-3" />
            <div className="flex gap-2">
              <button onClick={() => { setConfirmDelete(null); setConfirmText(''); }}
                className="flex-1 py-3 rounded-xl border border-kdpl-border text-kdpl-muted text-sm">Cancel</button>
              <button onClick={handleDelete} disabled={confirmText.trim() !== confirmDelete.name}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-bold disabled:opacity-40">
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
