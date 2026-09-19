// ═══════════════════════════════════════════════════════════════
// KDPL STANDINGS — NRR Points Table + H2H Matrix
// ═══════════════════════════════════════════════════════════════


import type { KDPLStore } from '../../store/useKDPLStore';
import AdSlotRenderer from '../ui/AdSlotRenderer';

export default function StandingsPage({ store }: { store: KDPLStore }) {
  const { state } = store;
  const { teams, fixtures, adSlots } = state;

  const sorted = [...teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.nrr !== a.nrr) return b.nrr - a.nrr;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.name.localeCompare(b.name);
  });

  // H2H Matrix
  const h2h: Record<string, Record<string, { w: number; l: number; t: number }>> = {};
  teams.forEach(t => { h2h[t.id] = {}; teams.forEach(o => { if (o.id !== t.id) h2h[t.id][o.id] = { w: 0, l: 0, t: 0 }; }); });
  fixtures.filter(f => f.status === 'completed' && f.result).forEach(f => {
    const { winnerId, loserTeamId } = f.result!;
    if (h2h[winnerId]?.[loserTeamId]) h2h[winnerId][loserTeamId].w++;
    if (h2h[loserTeamId]?.[winnerId]) h2h[loserTeamId][winnerId].l++;
  });

  const POSITION_STYLES = ['text-yellow-400', 'text-gray-300', 'text-amber-600', 'text-kdpl-muted'];

  return (
    <div className="flex flex-col gap-4 p-4">
      <AdSlotRenderer slot={adSlots.find(a => a.position === 'standings-top')} />

      <div>
        <h2 className="text-kdpl-text font-oswald font-bold text-xl">Points Table</h2>
        <p className="text-kdpl-muted text-xs">NRR-based standings</p>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl bg-kdpl-card border border-kdpl-border overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-1 px-3 py-2.5 bg-kdpl-darker border-b border-kdpl-border text-[10px] text-kdpl-muted font-bold uppercase tracking-wide">
          <span className="w-5">#</span>
          <span>Team</span>
          <span className="w-7 text-center">M</span>
          <span className="w-7 text-center">W</span>
          <span className="w-7 text-center">L</span>
          <span className="w-10 text-center">NRR</span>
          <span className="w-8 text-center">Pts</span>
        </div>

        {sorted.map((team, i) => (
          <div key={team.id}
            className={`grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-1 items-center px-3 py-3 border-b border-kdpl-border/40 last:border-0 ${i === 0 ? 'bg-yellow-400/5' : ''}`}>
            <div className={`w-5 text-xs font-bold ${POSITION_STYLES[i] || 'text-kdpl-muted'}`}>{i + 1}</div>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-base"
                style={{ backgroundColor: team.color + '20', border: `1px solid ${team.color}40` }}>
                {team.logo}
              </div>
              <div>
                <div className="text-kdpl-text text-xs font-semibold">{team.name}</div>
                <div className="text-kdpl-muted text-[10px]">{team.city}</div>
              </div>
            </div>

            <span className="w-7 text-center text-kdpl-muted text-xs">{team.matchesPlayed}</span>
            <span className="w-7 text-center text-green-400 text-xs font-semibold">{team.wins}</span>
            <span className="w-7 text-center text-red-400 text-xs font-semibold">{team.losses}</span>
            <span className={`w-10 text-center text-xs font-mono font-semibold ${team.nrr >= 0 ? 'text-kdpl-neon' : 'text-red-400'}`}>
              {team.nrr >= 0 ? '+' : ''}{team.nrr.toFixed(3)}
            </span>
            <div className="w-8 h-8 rounded-lg bg-kdpl-neon/10 border border-kdpl-neon/30 flex items-center justify-center">
              <span className="text-kdpl-neon font-oswald font-bold text-sm">{team.points}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-[10px] text-kdpl-muted">
        <span>M=Played</span><span>W=Won</span><span>L=Lost</span><span>NRR=Net Run Rate</span><span>Pts=Points</span>
      </div>

      {/* Qualification Zone */}
      <div className="rounded-xl bg-kdpl-card border border-kdpl-border p-3">
        <div className="text-kdpl-muted text-xs font-semibold uppercase tracking-wide mb-2">Points System</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { label: 'Win', pts: '+2', color: 'text-kdpl-neon' },
            { label: 'Loss', pts: '0', color: 'text-red-400' },
            { label: 'Tie / N/R', pts: '+1', color: 'text-yellow-400' },
            { label: 'Qualification', pts: 'Top 2', color: 'text-blue-400' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between bg-kdpl-darker/50 rounded-lg px-2 py-1.5">
              <span className="text-kdpl-muted">{item.label}</span>
              <span className={`font-bold font-oswald ${item.color}`}>{item.pts}</span>
            </div>
          ))}
        </div>
      </div>

      {/* H2H Matrix */}
      {teams.length > 1 && (
        <div>
          <h3 className="text-kdpl-text font-oswald font-semibold text-sm uppercase tracking-wide mb-2">Head-to-Head</h3>
          <div className="rounded-xl bg-kdpl-card border border-kdpl-border overflow-hidden">
            {/* Matrix header */}
            <div className="flex border-b border-kdpl-border">
              <div className="w-16 flex-shrink-0 p-2 border-r border-kdpl-border text-[10px] text-kdpl-muted text-center">vs</div>
              {sorted.map(t => (
                <div key={t.id} className="flex-1 p-2 text-center border-r border-kdpl-border last:border-0">
                  <span className="text-xs">{t.logo}</span>
                </div>
              ))}
            </div>
            {sorted.map(rowTeam => (
              <div key={rowTeam.id} className="flex border-b border-kdpl-border/50 last:border-0">
                <div className="w-16 flex-shrink-0 p-2 border-r border-kdpl-border flex items-center gap-1">
                  <span className="text-xs">{rowTeam.logo}</span>
                  <span className="text-[10px] text-kdpl-muted">{rowTeam.shortName}</span>
                </div>
                {sorted.map(colTeam => {
                  if (rowTeam.id === colTeam.id) {
                    return <div key={colTeam.id} className="flex-1 p-2 bg-kdpl-darker/30 border-r border-kdpl-border/30 last:border-0" />;
                  }
                  const record = h2h[rowTeam.id]?.[colTeam.id];
                  return (
                    <div key={colTeam.id} className="flex-1 p-2 text-center border-r border-kdpl-border/30 last:border-0">
                      {record && (record.w > 0 || record.l > 0) ? (
                        <span className={`text-[10px] font-bold ${record.w > record.l ? 'text-kdpl-neon' : 'text-red-400'}`}>
                          {record.w}W/{record.l}L
                        </span>
                      ) : <span className="text-kdpl-border text-[10px]">—</span>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form Guide */}
      <div>
        <h3 className="text-kdpl-text font-oswald font-semibold text-sm uppercase tracking-wide mb-2">Form Guide (Last 5)</h3>
        <div className="flex flex-col gap-2">
          {sorted.map(team => {
            const teamFixtures = fixtures.filter(f => (f.teamAId === team.id || f.teamBId === team.id) && f.status === 'completed')
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 5);
            return (
              <div key={team.id} className="flex items-center gap-3 rounded-xl bg-kdpl-card border border-kdpl-border px-3 py-2.5">
                <div className="flex items-center gap-2 w-20 flex-shrink-0">
                  <span className="text-lg">{team.logo}</span>
                  <span className="text-kdpl-text text-xs font-medium">{team.shortName}</span>
                </div>
                <div className="flex gap-1">
                  {teamFixtures.map((f, i) => {
                    const won = f.result?.winnerId === team.id;
                    const tied = !f.result?.winnerId;
                    return (
                      <span key={i} className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${won ? 'bg-kdpl-neon text-kdpl-darker' : tied ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                        {won ? 'W' : tied ? 'T' : 'L'}
                      </span>
                    );
                  })}
                  {teamFixtures.length === 0 && <span className="text-kdpl-muted text-xs">No results yet</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
