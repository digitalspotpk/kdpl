// ═══════════════════════════════════════════════════════════════
// KDPL SQUAD ALLOCATION PAGE
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import type { KDPLStore } from '../../store/useKDPLStore';

const ROLE_COLORS: Record<string, string> = {
  Batsman: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Bowler: 'bg-red-500/20 text-red-400 border-red-500/30',
  'All-Rounder': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Wicket-Keeper': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

export default function SquadPage({ store }: { store: KDPLStore }) {
  const { state, updatePlayer } = store;
  const { teams, players, isAdmin } = state;
  const [selectedTeam, setSelectedTeam] = useState(teams[0]?.id || '');
  const [roleFilter, setRoleFilter] = useState('All');
  const [saved, setSaved] = useState(false);

  const team = teams.find(t => t.id === selectedTeam);
  const squadPlayers = players.filter(p => p.teamId === selectedTeam);
  const poolPlayers = players.filter(p => !p.teamId || p.teamId === '');
  const filteredPool = roleFilter === 'All' ? poolPlayers : poolPlayers.filter(p => p.role === roleFilter);

  const addToSquad = (playerId: string) => {
    if (!isAdmin || squadPlayers.length >= 15) return;
    const player = players.find(p => p.id === playerId);
    if (player) updatePlayer({ ...player, teamId: selectedTeam });
  };

  const removeFromSquad = (playerId: string) => {
    if (!isAdmin) return;
    const player = players.find(p => p.id === playerId);
    if (player) updatePlayer({ ...player, teamId: '' });
  };

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const roleBalance = {
    BAT: squadPlayers.filter(p => p.role === 'Batsman').length,
    BOWL: squadPlayers.filter(p => p.role === 'Bowler').length,
    AR: squadPlayers.filter(p => p.role === 'All-Rounder').length,
    WK: squadPlayers.filter(p => p.role === 'Wicket-Keeper').length,
  };

  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="text-4xl mb-4">🔒</div>
      <h3 className="text-kdpl-text font-oswald font-bold text-xl">Admin Access Required</h3>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h2 className="text-kdpl-text font-oswald font-bold text-xl">Squad Allocation</h2>
        <p className="text-kdpl-muted text-xs">Assign players to teams (max 15)</p>
      </div>

      {/* Team Selector */}
      <div>
        <label className="text-kdpl-muted text-xs mb-1 block">Select Team</label>
        <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)}
          className="w-full bg-kdpl-card border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm outline-none">
          {teams.map(t => <option key={t.id} value={t.id}>{t.logo} {t.name}</option>)}
        </select>
      </div>

      {/* Current Squad */}
      {team && (
        <div className="rounded-2xl bg-kdpl-card border border-kdpl-border overflow-hidden">
          <div className="px-4 py-3 border-b border-kdpl-border" style={{ backgroundColor: team.color + '15' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{team.logo}</span>
                <div className="text-kdpl-text font-oswald font-bold">{team.name} Squad</div>
              </div>
              <div className="text-kdpl-neon font-oswald font-bold">{squadPlayers.length}/15</div>
            </div>
            {/* Progress bar */}
            <div className="mt-2 h-1.5 bg-kdpl-darker/50 rounded-full overflow-hidden">
              <div className="h-full bg-kdpl-neon rounded-full" style={{ width: `${(squadPlayers.length / 15) * 100}%` }} />
            </div>
            {/* Role balance */}
            <div className="flex gap-2 mt-2">
              {Object.entries(roleBalance).map(([r, c]) => (
                <span key={r} className="text-[10px] font-bold px-1.5 py-0.5 bg-kdpl-darker rounded text-kdpl-muted">{r}:{c}</span>
              ))}
            </div>
          </div>
          <div className="p-3">
            {squadPlayers.length === 0 ? (
              <p className="text-kdpl-muted text-xs text-center py-4">No players assigned. Add from pool below.</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {squadPlayers.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-kdpl-darker/50">
                    <span className="text-kdpl-muted text-[10px] w-4">{i + 1}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${ROLE_COLORS[p.role]}`}>{p.role.slice(0, 2)}</span>
                    <span className="text-kdpl-text text-xs flex-1">{p.name}</span>
                    <button onClick={() => removeFromSquad(p.id)}
                      className="text-red-400 text-[10px] px-1.5 py-0.5 bg-red-500/10 rounded hover:bg-red-500/20">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {squadPlayers.length > 0 && (
            <div className="px-4 pb-4">
              <button onClick={handleSave}
                className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${saved ? 'bg-green-500 text-white' : 'bg-kdpl-neon text-kdpl-darker'}`}>
                {saved ? '✓ Squad Saved!' : 'Save Squad'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Player Pool */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-kdpl-text font-oswald font-semibold text-sm">Available Players ({poolPlayers.length})</h3>
        </div>
        <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
          {['All', 'Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border ${roleFilter === r ? 'bg-kdpl-neon text-kdpl-darker border-kdpl-neon' : 'bg-kdpl-card border-kdpl-border text-kdpl-muted'}`}>
              {r}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          {filteredPool.map(p => (
            <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 bg-kdpl-card border border-kdpl-border rounded-xl">
              <span className="text-xl">{p.role === 'Batsman' ? '🏏' : p.role === 'Bowler' ? '🎳' : p.role === 'Wicket-Keeper' ? '🧤' : '🌟'}</span>
              <div className="flex-1">
                <div className="text-kdpl-text text-xs font-medium">{p.name}</div>
                <div className="text-kdpl-muted text-[10px]">{p.battingStyle}</div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${ROLE_COLORS[p.role]}`}>{p.role}</span>
              <button onClick={() => addToSquad(p.id)}
                disabled={squadPlayers.length >= 15}
                className="px-2.5 py-1.5 bg-kdpl-neon/10 border border-kdpl-neon/30 text-kdpl-neon text-[10px] font-bold rounded-lg hover:bg-kdpl-neon/20 disabled:opacity-40 disabled:cursor-not-allowed">
                + Add
              </button>
            </div>
          ))}
          {filteredPool.length === 0 && (
            <p className="text-center text-kdpl-muted text-sm py-6">All players are assigned to teams</p>
          )}
        </div>
      </div>
    </div>
  );
}
