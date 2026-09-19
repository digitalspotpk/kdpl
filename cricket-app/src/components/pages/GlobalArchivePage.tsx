// ═══════════════════════════════════════════════════════════════
// KDPL GLOBAL ARCHIVE — Match history & worldwide leaderboards
// ═══════════════════════════════════════════════════════════════

import { GlobeIcon } from '../ui/Icons';
import type { KDPLStore } from '../../store/useKDPLStore';

export default function GlobalArchivePage({ store }: { store: KDPLStore }) {
  const { state } = store;
  const { fixtures, teams, players } = state;
  const completed = fixtures.filter(f => f.status === 'completed' && f.result);

  const getTeam = (id: string) => teams.find(t => t.id === id);
  const topBatter = [...players].sort((a, b) => b.runs - a.runs).slice(0, 5);
  const topBowler = [...players].sort((a, b) => b.wickets - a.wickets).slice(0, 5);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-kdpl-neon/10 border border-kdpl-neon/30 flex items-center justify-center">
          <GlobeIcon size={20} className="text-kdpl-neon" />
        </div>
        <div>
          <h2 className="text-kdpl-text font-oswald font-bold text-xl">Global Archive</h2>
          <p className="text-kdpl-muted text-xs">Match history & leaderboards</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total Matches', value: completed.length, icon: '🏏' },
          { label: 'Total Runs', value: players.reduce((s, p) => s + p.runs, 0), icon: '📊' },
          { label: 'Total Wickets', value: players.reduce((s, p) => s + p.wickets, 0), icon: '🎳' },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl bg-kdpl-card border border-kdpl-border p-3 text-center">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-kdpl-neon font-oswald font-bold text-xl">{stat.value}</div>
            <div className="text-kdpl-muted text-[10px] leading-tight">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Top Batters */}
      <div className="rounded-2xl bg-kdpl-card border border-kdpl-border overflow-hidden">
        <div className="px-4 py-3 border-b border-kdpl-border bg-orange-500/10">
          <div className="text-kdpl-text font-oswald font-bold text-sm">🏏 Top Run Scorers — All Time</div>
        </div>
        <div className="flex flex-col">
          {topBatter.map((p, i) => {
            const team = getTeam(p.teamId);
            return (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3 border-b border-kdpl-border/40 last:border-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-400 text-kdpl-darker' : i === 1 ? 'bg-gray-300 text-kdpl-darker' : i === 2 ? 'bg-amber-600 text-white' : 'bg-kdpl-border text-kdpl-muted'}`}>{i + 1}</div>
                <div className="flex-1">
                  <div className="text-kdpl-text text-xs font-semibold">{p.name}</div>
                  <div className="text-kdpl-muted text-[10px]">{team?.logo} {team?.shortName}</div>
                </div>
                <div className="text-right">
                  <div className="text-orange-400 font-oswald font-bold text-lg">{p.runs}</div>
                  <div className="text-kdpl-muted text-[10px]">{p.matches} matches</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Bowlers */}
      <div className="rounded-2xl bg-kdpl-card border border-kdpl-border overflow-hidden">
        <div className="px-4 py-3 border-b border-kdpl-border bg-purple-500/10">
          <div className="text-kdpl-text font-oswald font-bold text-sm">🎳 Top Wicket Takers — All Time</div>
        </div>
        <div className="flex flex-col">
          {topBowler.map((p, i) => {
            const team = getTeam(p.teamId);
            return (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3 border-b border-kdpl-border/40 last:border-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-400 text-kdpl-darker' : i === 1 ? 'bg-gray-300 text-kdpl-darker' : i === 2 ? 'bg-amber-600 text-white' : 'bg-kdpl-border text-kdpl-muted'}`}>{i + 1}</div>
                <div className="flex-1">
                  <div className="text-kdpl-text text-xs font-semibold">{p.name}</div>
                  <div className="text-kdpl-muted text-[10px]">{team?.logo} {team?.shortName}</div>
                </div>
                <div className="text-right">
                  <div className="text-purple-400 font-oswald font-bold text-lg">{p.wickets}</div>
                  <div className="text-kdpl-muted text-[10px]">eco: {p.oversBowled > 0 ? (p.runsConceded / p.oversBowled).toFixed(2) : '—'}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Match History */}
      <div>
        <h3 className="text-kdpl-text font-oswald font-semibold text-sm uppercase tracking-wide mb-2">Match History ({completed.length})</h3>
        <div className="flex flex-col gap-2">
          {completed.slice().reverse().map(f => {
            const ta = getTeam(f.teamAId);
            const tb = getTeam(f.teamBId);
            const winner = getTeam(f.result?.winnerId || '');
            return (
              <div key={f.id} className="rounded-xl bg-kdpl-card border border-kdpl-border p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-kdpl-muted text-[10px]">M#{f.matchNumber} · {f.date} · {f.overs} Ov</span>
                  <span className="text-kdpl-neon text-[10px]">✅ Completed</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{ta?.logo}</span>
                    <span className={`text-xs font-oswald font-bold ${f.result?.winnerId === f.teamAId ? 'text-kdpl-neon' : 'text-kdpl-text'}`}>{ta?.shortName}</span>
                    <span className="text-kdpl-neon font-bold text-sm font-oswald">{f.result?.teamAScore}</span>
                  </div>
                  <span className="text-kdpl-muted text-xs">vs</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-kdpl-neon font-bold text-sm font-oswald">{f.result?.teamBScore}</span>
                    <span className={`text-xs font-oswald font-bold ${f.result?.winnerId === f.teamBId ? 'text-kdpl-neon' : 'text-kdpl-text'}`}>{tb?.shortName}</span>
                    <span className="text-base">{tb?.logo}</span>
                  </div>
                </div>
                <div className="text-[10px] text-kdpl-muted text-center mt-1">{winner?.name} won by {f.result?.margin}</div>
              </div>
            );
          })}
          {completed.length === 0 && (
            <div className="text-center py-8 text-kdpl-muted text-sm">No completed matches yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
