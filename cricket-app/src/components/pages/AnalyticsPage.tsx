// ═══════════════════════════════════════════════════════════════
// KDPL ANALYTICS — Orange Cap, Purple Cap, MVP Rankings
// ═══════════════════════════════════════════════════════════════


import type { KDPLStore } from '../../store/useKDPLStore';
import type { Player } from '../../types';

export default function AnalyticsPage({ store }: { store: KDPLStore }) {
  const { state } = store;
  const { players, teams } = state;

  const getTeam = (id: string) => teams.find(t => t.id === id);

  // Orange Cap — Top run scorers
  const batters = [...players].filter(p => p.matches > 0).sort((a, b) => {
    if (b.runs !== a.runs) return b.runs - a.runs;
    const srA = a.balls > 0 ? (a.runs / a.balls) * 100 : 0;
    const srB = b.balls > 0 ? (b.runs / b.balls) * 100 : 0;
    return srB - srA;
  });

  // Purple Cap — Top wicket takers
  const bowlers = [...players].filter(p => p.wickets > 0 || p.oversBowled > 0).sort((a, b) => {
    if (b.wickets !== a.wickets) return b.wickets - a.wickets;
    const ecoA = a.oversBowled > 0 ? a.runsConceded / a.oversBowled : 99;
    const ecoB = b.oversBowled > 0 ? b.runsConceded / b.oversBowled : 99;
    return ecoA - ecoB;
  });

  // Best Fielder — most dismissals (catches + stumpings)
  const fielders = [...players].filter(p => (p.catches + p.stumpings) > 0)
    .sort((a, b) => (b.catches + b.stumpings) - (a.catches + a.stumpings));

  // MVP Ranking
  const mvpRanked = [...players].map(p => ({
    ...p,
    mvpScore: p.runs * 1 + p.wickets * 20 + p.fours * 2 + p.sixes * 3 + p.catches * 10 + p.fifties * 10 + p.hundreds * 25
  })).sort((a, b) => b.mvpScore - a.mvpScore);

  const getTier = (mvp: number) => {
    if (mvp >= 300) return { label: 'Gold', icon: '🥇', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30', glow: 'shadow-yellow-400/20' };
    if (mvp >= 150) return { label: 'Silver', icon: '🥈', color: 'text-gray-300', bg: 'bg-gray-300/10 border-gray-300/30', glow: 'shadow-gray-300/20' };
    return { label: 'Bronze', icon: '🥉', color: 'text-amber-600', bg: 'bg-amber-600/10 border-amber-600/30', glow: '' };
  };

  const maxRuns = batters[0]?.runs || 1;
  const maxWkts = bowlers[0]?.wickets || 1;
  const maxMvp = mvpRanked[0]?.mvpScore || 1;
  const maxFielding = fielders[0] ? (fielders[0].catches + fielders[0].stumpings) : 1;

  const PlayerRow = ({ player, stat, maxStat, unit, rank }: { player: Player; stat: number; maxStat: number; unit: string; rank: number }) => {
    const team = getTeam(player.teamId);
    const pct = Math.round((stat / maxStat) * 100);
    return (
      <div className="flex items-center gap-3 py-2.5 border-b border-kdpl-border/40 last:border-0">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${rank === 1 ? 'bg-yellow-400 text-kdpl-darker' : rank === 2 ? 'bg-gray-300 text-kdpl-darker' : rank === 3 ? 'bg-amber-600 text-white' : 'bg-kdpl-border text-kdpl-muted'}`}>
          {rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className="text-kdpl-text text-xs font-semibold">{player.name}</span>
              {team && <span className="text-[10px] text-kdpl-muted">{team.logo} {team.shortName}</span>}
            </div>
            <span className="text-kdpl-neon font-oswald font-bold text-sm">{stat} {unit}</span>
          </div>
          <div className="h-1.5 bg-kdpl-darker rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: rank === 1 ? '#00ff66' : rank === 2 ? '#94a3b8' : '#f59e0b' }} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h2 className="text-kdpl-text font-oswald font-bold text-xl">Analytics & Rankings</h2>
        <p className="text-kdpl-muted text-xs">Performance statistics & leaderboards</p>
      </div>

      {/* Player of the Tournament */}
      {mvpRanked[0] && (
        <div className="rounded-2xl bg-gradient-to-br from-yellow-500/15 via-kdpl-card to-kdpl-card border border-yellow-400/40 p-5 text-center shadow-lg shadow-yellow-500/10">
          <div className="text-4xl mb-1">🏆</div>
          <div className="text-yellow-400 text-[10px] font-bold uppercase tracking-widest mb-1">Player of the Tournament</div>
          <div className="text-kdpl-text font-oswald font-bold text-xl">{mvpRanked[0].name}</div>
          <div className="text-kdpl-muted text-xs mb-3">{getTeam(mvpRanked[0].teamId)?.logo} {getTeam(mvpRanked[0].teamId)?.name} · {mvpRanked[0].role}</div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Runs', value: mvpRanked[0].runs },
              { label: 'Wkts', value: mvpRanked[0].wickets },
              { label: 'Catches', value: mvpRanked[0].catches + mvpRanked[0].stumpings },
              { label: 'MVP Pts', value: mvpRanked[0].mvpScore },
            ].map(s => (
              <div key={s.label}>
                <div className="text-yellow-400 font-oswald font-bold text-lg">{s.value}</div>
                <div className="text-kdpl-muted text-[10px]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orange Cap */}
      <div className="rounded-2xl bg-kdpl-card border border-kdpl-border overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-kdpl-border bg-orange-500/10">
          <span className="text-2xl">🏏</span>
          <div>
            <div className="text-kdpl-text font-oswald font-bold text-sm">Orange Cap</div>
            <div className="text-kdpl-muted text-xs">Most Runs</div>
          </div>
        </div>
        <div className="px-4 py-2">
          {batters.slice(0, 8).map((p, i) => (
            <PlayerRow key={p.id} player={p} stat={p.runs} maxStat={maxRuns} unit="runs" rank={i + 1} />
          ))}
          {batters.length === 0 && <div className="py-6 text-center text-kdpl-muted text-sm">No batting data yet</div>}
        </div>

        {/* Orange Cap Stats Grid */}
        {batters[0] && (
          <div className="px-4 pb-4">
            <div className="rounded-xl bg-kdpl-darker/50 p-3 border border-kdpl-border/50">
              <div className="text-[10px] text-kdpl-muted mb-2 uppercase tracking-wide">Orange Cap Leader — {batters[0].name}</div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: 'Runs', value: batters[0].runs },
                  { label: 'Avg', value: batters[0].matches > 0 ? (batters[0].runs / batters[0].matches).toFixed(1) : 0 },
                  { label: 'SR', value: batters[0].balls > 0 ? ((batters[0].runs / batters[0].balls) * 100).toFixed(1) : 0 },
                  { label: 'HS', value: batters[0].highScore },
                ].map(s => (
                  <div key={s.label}>
                    <div className="text-orange-400 font-oswald font-bold text-lg">{s.value}</div>
                    <div className="text-kdpl-muted text-[10px]">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Purple Cap */}
      <div className="rounded-2xl bg-kdpl-card border border-kdpl-border overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-kdpl-border bg-purple-500/10">
          <span className="text-2xl">🎳</span>
          <div>
            <div className="text-kdpl-text font-oswald font-bold text-sm">Purple Cap</div>
            <div className="text-kdpl-muted text-xs">Most Wickets</div>
          </div>
        </div>
        <div className="px-4 py-2">
          {bowlers.slice(0, 8).map((p, i) => (
            <PlayerRow key={p.id} player={p} stat={p.wickets} maxStat={maxWkts} unit="wkts" rank={i + 1} />
          ))}
          {bowlers.length === 0 && <div className="py-6 text-center text-kdpl-muted text-sm">No bowling data yet</div>}
        </div>
        {bowlers[0] && (
          <div className="px-4 pb-4">
            <div className="rounded-xl bg-kdpl-darker/50 p-3 border border-kdpl-border/50">
              <div className="text-[10px] text-kdpl-muted mb-2 uppercase tracking-wide">Purple Cap Leader — {bowlers[0].name}</div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: 'Wickets', value: bowlers[0].wickets },
                  { label: 'Overs', value: bowlers[0].oversBowled.toFixed(1) },
                  { label: 'Eco', value: bowlers[0].oversBowled > 0 ? (bowlers[0].runsConceded / bowlers[0].oversBowled).toFixed(2) : '0.00' },
                  { label: 'Runs', value: bowlers[0].runsConceded },
                ].map(s => (
                  <div key={s.label}>
                    <div className="text-purple-400 font-oswald font-bold text-lg">{s.value}</div>
                    <div className="text-kdpl-muted text-[10px]">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Best Fielder */}
      <div className="rounded-2xl bg-kdpl-card border border-kdpl-border overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-kdpl-border bg-teal-500/10">
          <span className="text-2xl">🧤</span>
          <div>
            <div className="text-kdpl-text font-oswald font-bold text-sm">Best Fielder</div>
            <div className="text-kdpl-muted text-xs">Most Catches + Stumpings</div>
          </div>
        </div>
        <div className="px-4 py-2">
          {fielders.slice(0, 8).map((p, i) => (
            <PlayerRow key={p.id} player={p} stat={p.catches + p.stumpings} maxStat={maxFielding} unit="dismissals" rank={i + 1} />
          ))}
          {fielders.length === 0 && <div className="py-6 text-center text-kdpl-muted text-sm">No fielding data yet</div>}
        </div>
        {fielders[0] && (
          <div className="px-4 pb-4">
            <div className="rounded-xl bg-kdpl-darker/50 p-3 border border-kdpl-border/50">
              <div className="text-[10px] text-kdpl-muted mb-2 uppercase tracking-wide">Best Fielder — {fielders[0].name}</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Catches', value: fielders[0].catches },
                  { label: 'Stumpings', value: fielders[0].stumpings },
                  { label: 'Total', value: fielders[0].catches + fielders[0].stumpings },
                ].map(s => (
                  <div key={s.label}>
                    <div className="text-teal-400 font-oswald font-bold text-lg">{s.value}</div>
                    <div className="text-kdpl-muted text-[10px]">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MVP Rankings */}
      <div className="rounded-2xl bg-kdpl-card border border-kdpl-border overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-kdpl-border bg-yellow-500/10">
          <span className="text-2xl">⭐</span>
          <div>
            <div className="text-kdpl-text font-oswald font-bold text-sm">MVP Rankings</div>
            <div className="text-kdpl-muted text-xs">R×1 + W×20 + 4s×2 + 6s×3 + Ct×10 + 50×10 + 100×25</div>
          </div>
        </div>
        <div className="p-4 flex flex-col gap-3">
          {mvpRanked.slice(0, 10).map((player, i) => {
            const team = getTeam(player.teamId);
            const tier = getTier(player.mvpScore);
            const pct = Math.round((player.mvpScore / maxMvp) * 100);
            return (
              <div key={player.id} className={`rounded-xl border p-3 shadow-lg ${tier.bg} ${i === 0 ? `shadow-lg ${tier.glow}` : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{tier.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-kdpl-text text-sm font-semibold">{player.name}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${tier.bg} ${tier.color}`}>{tier.label}</span>
                      </div>
                      <div className="text-kdpl-muted text-[10px]">{player.role} · {team?.logo} {team?.shortName}</div>
                    </div>
                  </div>
                  <div className={`font-oswald font-bold text-xl ${tier.color}`}>{player.mvpScore}</div>
                </div>
                <div className="h-2 bg-kdpl-darker rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: i === 0 ? '#fbbf24' : i === 1 ? '#9ca3af' : i === 2 ? '#d97706' : '#00ff66' }} />
                </div>
                <div className="flex gap-3 mt-2 text-[10px] text-kdpl-muted">
                  <span>🏏 {player.runs}r</span>
                  <span>🎳 {player.wickets}w</span>
                  <span>4️⃣ {player.fours}</span>
                  <span>6️⃣ {player.sixes}</span>
                  <span>🤲 {player.catches}</span>
                </div>
              </div>
            );
          })}
          {mvpRanked.length === 0 && (
            <div className="py-6 text-center text-kdpl-muted text-sm">No player data available</div>
          )}
        </div>
      </div>

      {/* MVP Formula */}
      <div className="rounded-xl bg-kdpl-card border border-kdpl-border p-3">
        <div className="text-kdpl-muted text-xs font-semibold uppercase tracking-wide mb-2">MVP Formula</div>
        <div className="grid grid-cols-2 gap-1.5 text-[10px]">
          {[
            ['Run scored', '×1 pt'], ['Wicket taken', '×20 pts'], ['Four hit', '×2 pts'],
            ['Six hit', '×3 pts'], ['Catch taken', '×10 pts'], ['Fifty scored', '+10 pts'],
            ['Century scored', '+25 pts'], ['Stumping', '+10 pts'],
          ].map(([action, pts]) => (
            <div key={action} className="flex justify-between bg-kdpl-darker/50 rounded px-2 py-1">
              <span className="text-kdpl-muted">{action}</span>
              <span className="text-kdpl-neon font-bold">{pts}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
