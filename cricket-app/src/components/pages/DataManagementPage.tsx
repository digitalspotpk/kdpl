// ═══════════════════════════════════════════════════════════════
// KDPL DATA MANAGEMENT — Super Admin control over ALL data, app-wide
// (Organizers manage their own tournament via Tournaments → Edit/Delete
//  or Tournament Config → Danger Zone. This page is the Super Admin's
//  equivalent, but across every organizer's tournament at once.)
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { ShieldIcon, TrashIcon, EditPenIcon, UsersIcon, CalendarIcon } from '../ui/Icons';
import type { KDPLStore } from '../../store/useKDPLStore';

export default function DataManagementPage({ store }: { store: KDPLStore }) {
  const { state, switchTournament, navigate, deleteTournament, wipeAllTournamentData } = store;
  const { tournaments, allTeams, allPlayers, allFixtures, allSeries, allLiveMatches, isSuperAdmin } = state;

  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [showWipeAll, setShowWipeAll] = useState(false);
  const [wipeText, setWipeText] = useState('');

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center gap-2">
        <div className="text-4xl mb-2">🛡️</div>
        <h3 className="text-kdpl-text font-oswald font-bold text-xl">Super Admin Access Required</h3>
        <p className="text-kdpl-muted text-sm max-w-xs">Only the Super Admin can manage data across every tournament on the app.</p>
      </div>
    );
  }

  const manageTournament = (id: string) => {
    switchTournament(id);
    navigate('tournament-config');
  };

  const handleDelete = () => {
    if (!confirmDelete || confirmText.trim() !== confirmDelete.name) return;
    deleteTournament(confirmDelete.id);
    setConfirmDelete(null);
    setConfirmText('');
  };

  const handleWipeAll = () => {
    if (wipeText.trim() !== 'DELETE EVERYTHING') return;
    wipeAllTournamentData();
    setShowWipeAll(false);
    setWipeText('');
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h2 className="text-kdpl-text font-oswald font-bold text-xl flex items-center gap-2">
          <ShieldIcon size={20} className="text-red-400" /> Data Management
        </h2>
        <p className="text-kdpl-muted text-xs">Every tournament on the app — edit or permanently delete any of them</p>
      </div>

      {/* App-wide totals */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Tournaments', value: tournaments.length },
          { label: 'Teams', value: allTeams.length },
          { label: 'Players', value: allPlayers.length },
          { label: 'Fixtures', value: allFixtures.length },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl bg-kdpl-card border border-kdpl-border p-2.5 text-center">
            <div className="text-kdpl-neon font-oswald font-bold text-lg">{stat.value}</div>
            <div className="text-kdpl-muted text-[9px] leading-tight">{stat.label}</div>
          </div>
        ))}
      </div>

      {tournaments.length === 0 && (
        <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-6 text-center">
          <p className="text-kdpl-muted text-sm">No tournaments on the app yet.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {tournaments.map(t => {
          const teamCount = allTeams.filter(tm => tm.tournamentId === t.id).length;
          const playerCount = allPlayers.filter(p => p.tournamentId === t.id).length;
          const fixtureCount = allFixtures.filter(f => f.tournamentId === t.id).length;
          const seriesCount = allSeries.filter(sr => sr.tournamentId === t.id).length;
          const liveCount = allLiveMatches.filter(lm => lm.tournamentId === t.id && lm.status === 'live').length;
          return (
            <div key={t.id} className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-kdpl-text font-semibold text-sm flex items-center gap-2">
                    🏆 {t.name}
                    {liveCount > 0 && <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">{liveCount} live</span>}
                  </div>
                  <div className="text-kdpl-muted text-[10px] mt-0.5">
                    Organizer: {t.organizer || t.organizerEmail || 'Unknown'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-kdpl-muted text-[11px] mb-3">
                <span className="flex items-center gap-1"><UsersIcon size={11} /> {teamCount} teams · {playerCount} players</span>
                <span className="flex items-center gap-1"><CalendarIcon size={11} /> {fixtureCount} fixtures{seriesCount > 0 ? ` · ${seriesCount} series` : ''}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => manageTournament(t.id)}
                  className="flex-1 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium flex items-center justify-center gap-1.5">
                  <EditPenIcon size={12} /> Manage
                </button>
                <button onClick={() => { setConfirmDelete({ id: t.id, name: t.name }); setConfirmText(''); }}
                  className="flex-1 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-center justify-center gap-1.5">
                  <TrashIcon size={12} /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Nuclear option */}
      <div className="rounded-2xl bg-red-500/5 border border-red-500/30 p-4 mt-2">
        <button onClick={() => setShowWipeAll(v => !v)} className="w-full flex items-center justify-between">
          <span className="text-red-400 text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
            <TrashIcon size={13} /> Wipe All Tournament Data
          </span>
          <span className="text-red-400 text-xs">{showWipeAll ? '−' : '+'}</span>
        </button>
        {showWipeAll && (
          <div className="mt-3">
            <p className="text-kdpl-muted text-xs mb-3">
              Deletes every tournament, team, player, venue, fixture, series and live match across the ENTIRE app — for every organizer, not just one. Organizer accounts, the Super Admin allowlist, ad slots, and Firebase config are kept. This cannot be undone.
            </p>
            <label className="text-kdpl-muted text-xs mb-1 block">
              Type <span className="text-kdpl-text font-semibold">DELETE EVERYTHING</span> to confirm:
            </label>
            <input value={wipeText} onChange={e => setWipeText(e.target.value)}
              className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm outline-none mb-3" />
            <button onClick={handleWipeAll} disabled={wipeText.trim() !== 'DELETE EVERYTHING'}
              className="w-full py-3 rounded-xl bg-red-500 text-white text-sm font-bold disabled:opacity-40">
              Wipe Everything Permanently
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
