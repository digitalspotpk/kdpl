// ═══════════════════════════════════════════════════════════════
// KDPL LIVE SCORE PAGE — Real-time scoreboard
// ═══════════════════════════════════════════════════════════════

import { ActivityIcon, RadioIcon } from '../ui/Icons';
import type { KDPLStore } from '../../store/useKDPLStore';
import AdSlotRenderer from '../ui/AdSlotRenderer';

export default function LiveScorePage({ store }: { store: KDPLStore }) {
  const { state, navigate } = store;
  const { liveMatch, teams, players, adSlots } = state;

  if (!liveMatch || liveMatch.status !== 'live') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
        <div className="w-20 h-20 rounded-2xl bg-kdpl-card border border-kdpl-border flex items-center justify-center">
          <RadioIcon size={36} className="text-kdpl-muted" />
        </div>
        <div className="text-center">
          <h3 className="text-kdpl-text font-oswald font-bold text-xl mb-2">No Live Match</h3>
          <p className="text-kdpl-muted text-sm">Live scores will appear here when a match starts</p>
        </div>
        <button onClick={() => navigate('fixtures')}
          className="px-6 py-3 bg-kdpl-neon text-kdpl-darker rounded-xl font-bold text-sm">
          View Fixtures
        </button>
      </div>
    );
  }

  const innings = liveMatch.currentInnings === 1 ? liveMatch.innings1 : liveMatch.innings2;

  const battingTeam = teams.find(t => t.id === innings.teamId);
  const fieldingTeamId = liveMatch.teamAId === innings.teamId ? liveMatch.teamBId : liveMatch.teamAId;
  const fieldingTeam = teams.find(t => t.id === fieldingTeamId);
  const batter1 = players.find(p => p.id === innings.currentBatter1);
  const batter2 = players.find(p => p.id === innings.currentBatter2);
  const bowler = players.find(p => p.id === innings.currentBowler);
  const batter1Stats = innings.playerStats[innings.currentBatter1];
  const batter2Stats = innings.playerStats[innings.currentBatter2];
  const bowlerStats = innings.bowlerStats[innings.currentBowler];

  const target = liveMatch.currentInnings === 2 ? liveMatch.innings1.runs + 1 : null;
  const crr = (innings.overs + innings.balls / 6) > 0 ? (innings.runs / (innings.overs + innings.balls / 6)).toFixed(2) : '0.00';
  const oversRemaining = liveMatch.overs - innings.overs - innings.balls / 6;
  const runsNeeded = target ? target - innings.runs : null;
  const rrr = (runsNeeded && oversRemaining > 0) ? (runsNeeded / oversRemaining).toFixed(2) : null;

  const currentOverBalls = innings.ballEvents.slice(-6);

  const getBallStyle = (ball: typeof innings.ballEvents[0]) => {
    if (ball.isWicket) return 'bg-red-500 text-white';
    if (ball.runs === 6) return 'bg-kdpl-neon text-kdpl-darker';
    if (ball.runs === 4) return 'bg-blue-500 text-white';
    if (ball.extraType) return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40';
    if (ball.runs === 0) return 'bg-kdpl-border text-kdpl-muted';
    return 'bg-kdpl-card text-kdpl-text border border-kdpl-border';
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Match Header */}
      <div className="rounded-2xl bg-gradient-to-br from-kdpl-card to-kdpl-darker border border-kdpl-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-kdpl-border bg-red-500/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 text-xs font-bold tracking-widest">LIVE</span>
          </div>
          <span className="text-kdpl-muted text-xs">{liveMatch.overs} Overs · Innings {liveMatch.currentInnings}</span>
        </div>

        {/* Score Hero */}
        <div className="p-4 text-center">
          <div className="text-kdpl-muted text-xs mb-1">{battingTeam?.name} batting</div>
          <div className="text-5xl font-oswald font-bold text-kdpl-text">
            {innings.runs}<span className="text-3xl text-kdpl-muted">/{innings.wickets}</span>
          </div>
          <div className="text-kdpl-muted text-sm mt-1">
            ({innings.overs}.{innings.balls} ov) · CRR: <span className="text-kdpl-neon">{crr}</span>
          </div>

          {target && (
            <div className="mt-2 text-sm">
              <span className="text-kdpl-muted">Target: </span>
              <span className="text-yellow-400 font-bold">{target}</span>
              <span className="text-kdpl-muted mx-2">·</span>
              <span className="text-kdpl-muted">Need: </span>
              <span className="text-red-400 font-bold">{runsNeeded}</span>
              {rrr && <><span className="text-kdpl-muted mx-2">·</span><span className="text-kdpl-muted">RRR: </span><span className="text-red-400 font-bold">{rrr}</span></>}
            </div>
          )}
        </div>

        {/* Teams bar */}
        <div className="flex border-t border-kdpl-border">
          <div className="flex-1 flex items-center gap-2 px-3 py-2">
            <span className="text-xl">{teams.find(t => t.id === liveMatch.innings1.teamId)?.logo}</span>
            <div>
              <div className="text-kdpl-text text-xs font-semibold">{teams.find(t => t.id === liveMatch.innings1.teamId)?.shortName}</div>
              <div className="text-kdpl-neon text-sm font-bold font-oswald">{liveMatch.innings1.runs}/{liveMatch.innings1.wickets}</div>
            </div>
          </div>
          <div className="w-px bg-kdpl-border" />
          <div className="flex-1 flex items-center justify-end gap-2 px-3 py-2">
            <div className="text-right">
              <div className="text-kdpl-text text-xs font-semibold">{teams.find(t => t.id === liveMatch.innings2.teamId)?.shortName}</div>
              {liveMatch.currentInnings === 2 ? (
                <div className="text-kdpl-neon text-sm font-bold font-oswald">{liveMatch.innings2.runs}/{liveMatch.innings2.wickets}</div>
              ) : (
                <div className="text-kdpl-muted text-[10px]">Yet to bat</div>
              )}
            </div>
            <span className="text-xl">{teams.find(t => t.id === liveMatch.innings2.teamId)?.logo}</span>
          </div>
        </div>
      </div>

      {/* Current Over dots */}
      <div className="rounded-xl bg-kdpl-card border border-kdpl-border p-3">
        <div className="text-kdpl-muted text-xs mb-2 font-semibold uppercase tracking-wide">This Over</div>
        <div className="flex items-center gap-2">
          {currentOverBalls.map((ball, i) => (
            <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getBallStyle(ball)}`}>
              {ball.isWicket ? 'W' : ball.extraType ? ball.extraType[0] : ball.runs}
            </div>
          ))}
          {[...Array(Math.max(0, 6 - currentOverBalls.length))].map((_, i) => (
            <div key={i} className="w-8 h-8 rounded-full border-2 border-kdpl-border border-dashed" />
          ))}
        </div>
      </div>

      {/* Batters */}
      <div className="rounded-xl bg-kdpl-card border border-kdpl-border overflow-hidden">
        <div className="px-3 py-2 border-b border-kdpl-border">
          <span className="text-kdpl-muted text-xs font-semibold uppercase tracking-wide">Batting</span>
        </div>
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] text-[10px] text-kdpl-muted px-3 py-1.5 border-b border-kdpl-border/50 gap-2">
          <span />
          <span>Batter</span>
          <span className="text-center w-8">R</span>
          <span className="text-center w-8">B</span>
          <span className="text-center w-8">4s</span>
          <span className="text-center w-8">SR</span>
        </div>
        {[{ player: batter1, stats: batter1Stats, isStriker: true }, { player: batter2, stats: batter2Stats, isStriker: false }].map(({ player, stats, isStriker }) => (
          <div key={player?.id || isStriker.toString()} className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center px-3 py-2.5 gap-2 border-b border-kdpl-border/30 last:border-0">
            <span className="text-kdpl-neon text-xs">{isStriker ? '●' : ' '}</span>
            <span className="text-kdpl-text text-xs font-medium">{player?.name || '—'}</span>
            <span className="text-kdpl-text font-bold text-xs text-center w-8">{stats?.runs ?? 0}</span>
            <span className="text-kdpl-muted text-xs text-center w-8">{stats?.balls ?? 0}</span>
            <span className="text-kdpl-muted text-xs text-center w-8">{stats?.fours ?? 0}</span>
            <span className="text-kdpl-muted text-xs text-center w-8">{stats?.strikeRate?.toFixed(0) ?? 0}</span>
          </div>
        ))}
      </div>

      {/* Bowler */}
      <div className="rounded-xl bg-kdpl-card border border-kdpl-border overflow-hidden">
        <div className="px-3 py-2 border-b border-kdpl-border">
          <span className="text-kdpl-muted text-xs font-semibold uppercase tracking-wide">Bowling — {fieldingTeam?.name}</span>
        </div>
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center px-3 py-2.5 gap-2 text-xs">
          <span className="text-kdpl-text font-medium">{bowler?.name || '—'}</span>
          <span className="text-kdpl-muted">{(bowlerStats?.overs ?? 0)}.{(bowlerStats?.balls ?? 0)} ov</span>
          <span className="text-kdpl-muted">{bowlerStats?.runs ?? 0} runs</span>
          <span className="text-red-400 font-bold">{bowlerStats?.wickets ?? 0} wkts</span>
          <span className="text-kdpl-muted">{bowlerStats?.economy?.toFixed(1) ?? '0.0'} eco</span>
        </div>
      </div>

      {/* Partnership */}
      {innings.partnerships.length > 0 && (
        <div className="rounded-xl bg-kdpl-card border border-kdpl-border p-3">
          <div className="text-kdpl-muted text-xs font-semibold uppercase tracking-wide mb-2">Partnership</div>
          <div className="flex items-center gap-3">
            <div className="text-kdpl-neon font-oswald font-bold text-2xl">{innings.partnerships[innings.partnerships.length - 1].runs}</div>
            <div className="flex-1">
              <div className="h-2 bg-kdpl-darker rounded-full overflow-hidden">
                <div className="h-full bg-kdpl-neon rounded-full transition-all" style={{ width: `${Math.min(100, innings.partnerships[innings.partnerships.length - 1].runs)}%` }} />
              </div>
            </div>
            <div className="text-kdpl-muted text-xs">{innings.partnerships[innings.partnerships.length - 1].balls} balls</div>
          </div>
        </div>
      )}

      {/* Fall of Wickets */}
      {innings.fallOfWickets.length > 0 && (
        <div className="rounded-xl bg-kdpl-card border border-kdpl-border p-3">
          <div className="text-kdpl-muted text-xs font-semibold uppercase tracking-wide mb-2">Fall of Wickets</div>
          <div className="flex flex-wrap gap-1.5">
            {innings.fallOfWickets.map((fow, i) => (
              <span key={i} className="text-xs bg-kdpl-darker border border-kdpl-border rounded-lg px-2 py-1 text-kdpl-muted">
                <span className="text-red-400">{fow.score}/{fow.wicket}</span> ({players.find(p => p.id === fow.batsmanId)?.name}, {fow.over} ov)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Commentary */}
      <div className="rounded-xl bg-kdpl-card border border-kdpl-border overflow-hidden">
        <div className="px-3 py-2 border-b border-kdpl-border">
          <span className="text-kdpl-muted text-xs font-semibold uppercase tracking-wide flex items-center gap-2">
            <ActivityIcon size={12} /> Live Commentary
          </span>
        </div>
        <div className="flex flex-col">
          {[...innings.ballEvents].reverse().slice(0, 10).map((ball, i) => (
            <div key={i} className={`flex items-start gap-3 px-3 py-2.5 border-b border-kdpl-border/30 last:border-0 ${ball.isWicket ? 'bg-red-500/5' : ball.runs === 4 || ball.runs === 6 ? 'bg-kdpl-neon/5' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${getBallStyle(ball)}`}>
                {ball.isWicket ? 'W' : ball.extraType ? ball.extraType[0] : ball.runs}
              </div>
              <div className="text-kdpl-muted text-xs leading-relaxed">{ball.commentary}</div>
            </div>
          ))}
          {innings.ballEvents.length === 0 && (
            <div className="text-center py-6 text-kdpl-muted text-xs">
              Commentary will appear ball by ball
            </div>
          )}
        </div>
      </div>

      <AdSlotRenderer slot={adSlots.find(a => a.position === 'live-sidebar')} />

      {/* Admin action */}
      {state.isAdmin && (
        <button onClick={() => navigate('scorer')}
          className="w-full py-3 bg-red-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-98">
          <RadioIcon size={16} /> Open Scorer Panel
        </button>
      )}
    </div>
  );
}
