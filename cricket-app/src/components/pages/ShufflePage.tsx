// ═══════════════════════════════════════════════════════════════
// KDPL AUTO-SHUFFLE — Fisher-Yates role-balanced distribution
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { ShuffleIcon } from '../ui/Icons';
import type { KDPLStore } from '../../store/useKDPLStore';

export default function ShufflePage({ store }: { store: KDPLStore }) {
  const { state, shufflePlayers } = store;
  const { players, teams, isAdmin } = state;
  const [done, setDone] = useState(false);

  const roleCounts = {
    Batsman: players.filter(p => p.role === 'Batsman').length,
    Bowler: players.filter(p => p.role === 'Bowler').length,
    'All-Rounder': players.filter(p => p.role === 'All-Rounder').length,
    'Wicket-Keeper': players.filter(p => p.role === 'Wicket-Keeper').length,
  };

  const teamAssignments = teams.map(team => ({
    team,
    players: players.filter(p => p.teamId === team.id),
  }));

  const handleShuffle = () => {
    shufflePlayers();
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h3 className="text-kdpl-text font-oswald font-bold text-xl">Admin Access Required</h3>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h2 className="text-kdpl-text font-oswald font-bold text-xl">Auto-Shuffle Engine</h2>
        <p className="text-kdpl-muted text-xs">Fisher-Yates role-balanced player distribution</p>
      </div>

      {/* Stats */}
      <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4">
        <div className="text-kdpl-muted text-xs font-semibold uppercase tracking-wide mb-3">Player Pool</div>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(roleCounts).map(([role, count]) => (
            <div key={role} className="text-center bg-kdpl-darker/50 rounded-xl p-2.5">
              <div className="text-kdpl-neon font-oswald font-bold text-xl">{count}</div>
              <div className="text-kdpl-muted text-[9px] leading-tight">{role}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-kdpl-border flex items-center justify-between text-xs text-kdpl-muted">
          <span>Total Players: <span className="text-kdpl-text font-semibold">{players.length}</span></span>
          <span>Teams: <span className="text-kdpl-text font-semibold">{teams.length}</span></span>
          <span>Per Team: <span className="text-kdpl-text font-semibold">~{teams.length > 0 ? Math.floor(players.length / teams.length) : 0}</span></span>
        </div>
      </div>

      {/* Algorithm explanation */}
      <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4">
        <div className="text-kdpl-muted text-xs font-semibold uppercase tracking-wide mb-3">🔀 Shuffle Algorithm</div>
        <div className="flex flex-col gap-2">
          {[
            { step: '1', desc: 'Separate players into role buckets (BAT, BOWL, AR, WK)' },
            { step: '2', desc: 'Apply Fisher-Yates shuffle to EACH bucket independently' },
            { step: '3', desc: 'Fill teams round-robin: Batsmen → All-Rounders → Bowlers → WKs' },
            { step: '4', desc: 'Every team gets balanced batting depth + bowling attack' },
          ].map(item => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-kdpl-neon/20 border border-kdpl-neon/30 flex items-center justify-center text-kdpl-neon text-xs font-bold flex-shrink-0">{item.step}</div>
              <p className="text-kdpl-muted text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Shuffle Button */}
      <button onClick={handleShuffle}
        className={`w-full py-4 rounded-2xl font-oswald font-bold text-xl transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg ${done ? 'bg-green-500 text-white shadow-green-500/30' : 'bg-kdpl-neon text-kdpl-darker shadow-kdpl-neon/30'}`}>
        <ShuffleIcon size={24} />
        {done ? '✓ Players Shuffled!' : 'SHUFFLE PLAYERS'}
      </button>

      {/* Current assignments */}
      <div>
        <h3 className="text-kdpl-text font-oswald font-semibold text-sm uppercase tracking-wide mb-2">Current Assignments</h3>
        <div className="flex flex-col gap-3">
          {teamAssignments.map(({ team, players: tp }) => (
            <div key={team.id} className="rounded-2xl bg-kdpl-card border border-kdpl-border overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-kdpl-border"
                style={{ backgroundColor: team.color + '15', borderBottomColor: team.color + '30' }}>
                <span className="text-xl">{team.logo}</span>
                <div className="flex-1">
                  <div className="text-kdpl-text font-oswald font-bold text-sm">{team.name}</div>
                  <div className="text-kdpl-muted text-[10px]">{tp.length} players assigned</div>
                </div>
                <div className="flex gap-1 text-[10px] font-bold">
                  {[
                    { r: 'B', color: 'text-blue-400', count: tp.filter(p => p.role === 'Batsman').length },
                    { r: 'AR', color: 'text-green-400', count: tp.filter(p => p.role === 'All-Rounder').length },
                    { r: 'BW', color: 'text-red-400', count: tp.filter(p => p.role === 'Bowler').length },
                    { r: 'WK', color: 'text-yellow-400', count: tp.filter(p => p.role === 'Wicket-Keeper').length },
                  ].map(item => (
                    <span key={item.r} className={`${item.color} px-1.5 py-0.5 bg-kdpl-darker rounded`}>{item.count}{item.r}</span>
                  ))}
                </div>
              </div>
              <div className="p-3">
                <div className="flex flex-wrap gap-1.5">
                  {tp.map(p => (
                    <div key={p.id} className={`px-2 py-1 rounded-lg text-[10px] font-medium border ${p.role === 'Batsman' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : p.role === 'Bowler' ? 'bg-red-500/10 text-red-400 border-red-500/20' : p.role === 'All-Rounder' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                      {p.name}
                    </div>
                  ))}
                  {tp.length === 0 && <span className="text-kdpl-muted text-xs italic">No players assigned</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
