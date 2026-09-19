// ═══════════════════════════════════════════════════════════════
// KDPL SCORECARD — Match summary + export
// ═══════════════════════════════════════════════════════════════

import { useRef, useState } from 'react';
import { DownloadIcon, ShareIcon } from '../ui/Icons';
import type { KDPLStore } from '../../store/useKDPLStore';
import type { Fixture } from '../../types';
import AdSlotRenderer from '../ui/AdSlotRenderer';
import MatchSummaryPosterModal from '../modals/MatchSummaryPosterModal';
import { computePartnerships } from '../../utils/partnerships';

export default function ScorecardPage({ store }: { store: KDPLStore }) {
  const { state } = store;
  const { liveMatch, teams, players, fixtures, adSlots, tournament } = state;
  const cardRef = useRef<HTMLDivElement>(null);
  const [summaryFixture, setSummaryFixture] = useState<Fixture | null>(null);

  const completedFixtures = fixtures.filter(f => f.status === 'completed' && f.result);

  const getTeam = (id: string) => teams.find(t => t.id === id);
  const getPlayer = (id: string) => players.find(p => p.id === id);

  const handleShare = async (fixture: typeof completedFixtures[0]) => {
    const ta = getTeam(fixture.teamAId);
    const tb = getTeam(fixture.teamBId);
    const text = `🏏 ${ta?.name} ${fixture.result?.teamAScore} vs ${tb?.name} ${fixture.result?.teamBScore}\n${ta?.name} won by ${fixture.result?.margin}\n📊 KD Premier League`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'KDPL Match Result', text, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(text);
        alert('Result copied to clipboard!');
      }
    } catch (e) { console.warn(e); }
  };

  const printCard = () => window.print();

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-kdpl-text font-oswald font-bold text-xl">Scorecards</h2>
          <p className="text-kdpl-muted text-xs">{completedFixtures.length} completed matches</p>
        </div>
        <button onClick={printCard}
          className="flex items-center gap-1.5 px-3 py-2 bg-kdpl-card border border-kdpl-border rounded-xl text-kdpl-muted text-xs active:scale-95">
          <DownloadIcon size={14} /> Export
        </button>
      </div>

      <AdSlotRenderer slot={adSlots.find(a => a.position === 'scorecard-bottom')} />

      {/* Live Match Scorecard */}
      {liveMatch && (
        <div ref={cardRef} className="rounded-2xl bg-gradient-to-br from-kdpl-green/20 to-kdpl-card border border-kdpl-green/30 overflow-hidden">
          <div className="px-4 py-3 border-b border-kdpl-border bg-kdpl-darker/50">
            <div className="flex items-center justify-between">
              <span className="text-kdpl-neon font-oswald font-bold text-sm">
                {liveMatch.status === 'completed' ? 'MATCH SCORECARD' : 'LIVE MATCH SCORECARD'}
              </span>
              {liveMatch.status === 'completed' ? (
                <span className="text-kdpl-muted text-xs">COMPLETED</span>
              ) : (
                <span className="text-red-400 text-xs flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />LIVE</span>
              )}
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-center flex-1">
                <div className="text-3xl mb-1">{getTeam(liveMatch.innings1.teamId)?.logo}</div>
                <div className="text-kdpl-text font-oswald font-bold">{getTeam(liveMatch.innings1.teamId)?.name}</div>
                <div className="text-kdpl-neon font-oswald font-bold text-2xl">{liveMatch.innings1.runs}/{liveMatch.innings1.wickets}</div>
                <div className="text-kdpl-muted text-xs">({liveMatch.innings1.overs}.{liveMatch.innings1.balls} ov)</div>
              </div>
              <div className="text-kdpl-muted font-bold px-4">vs</div>
              <div className="text-center flex-1">
                <div className="text-3xl mb-1">{getTeam(liveMatch.innings2.teamId)?.logo}</div>
                <div className="text-kdpl-text font-oswald font-bold">{getTeam(liveMatch.innings2.teamId)?.name}</div>
                {liveMatch.currentInnings === 2 ? (
                  <>
                    <div className="text-kdpl-neon font-oswald font-bold text-2xl">{liveMatch.innings2.runs}/{liveMatch.innings2.wickets}</div>
                    <div className="text-kdpl-muted text-xs">({liveMatch.innings2.overs}.{liveMatch.innings2.balls} ov)</div>
                  </>
                ) : <div className="text-kdpl-muted text-sm">Yet to bat</div>}
              </div>
            </div>

            {/* Innings 1 batting */}
            <div className="mb-3">
              <div className="text-kdpl-muted text-xs font-semibold uppercase tracking-wide mb-2">{getTeam(liveMatch.innings1.teamId)?.name} Batting</div>
              <div className="rounded-xl overflow-hidden border border-kdpl-border">
                <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] text-[10px] text-kdpl-muted px-2 py-1.5 bg-kdpl-darker border-b border-kdpl-border gap-1 font-semibold uppercase">
                  <span>Batter</span><span className="w-8 text-center">R</span><span className="w-8 text-center">B</span>
                  <span className="w-6 text-center">4s</span><span className="w-6 text-center">6s</span><span className="w-10 text-center">SR</span>
                </div>
                {Object.entries(liveMatch.innings1.playerStats).map(([pid, stats]) => {
                  const p = getPlayer(pid);
                  return (
                    <div key={pid} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] items-center px-2 py-2 border-b border-kdpl-border/30 last:border-0 gap-1">
                      <div>
                        <div className="text-kdpl-text text-xs font-medium">{p?.name || '—'}</div>
                        {stats.isOut && <div className="text-kdpl-muted text-[10px]">{stats.wicketType}</div>}
                      </div>
                      <span className={`w-8 text-center font-bold text-xs ${!stats.isOut ? 'text-kdpl-neon' : 'text-kdpl-text'}`}>{stats.runs}{!stats.isOut ? '*' : ''}</span>
                      <span className="w-8 text-center text-kdpl-muted text-xs">{stats.balls}</span>
                      <span className="w-6 text-center text-kdpl-muted text-xs">{stats.fours}</span>
                      <span className="w-6 text-center text-kdpl-muted text-xs">{stats.sixes}</span>
                      <span className="w-10 text-center text-kdpl-muted text-xs">{stats.strikeRate?.toFixed(0) ?? 0}</span>
                    </div>
                  );
                })}
              </div>
              {liveMatch.innings1.fallOfWickets.length > 0 && (
                <div className="mt-2 text-[10px] text-kdpl-muted leading-relaxed">
                  <span className="font-semibold uppercase tracking-wide">Fall of Wickets: </span>
                  {liveMatch.innings1.fallOfWickets.map((fow, i) => (
                    <span key={i}>{fow.score}-{fow.wicket} ({getPlayer(fow.batsmanId)?.name || '—'}, {fow.over}){i < liveMatch.innings1.fallOfWickets.length - 1 ? ', ' : ''}</span>
                  ))}
                </div>
              )}
              {computePartnerships(liveMatch.innings1).length > 0 && (
                <div className="mt-2 text-[10px] text-kdpl-muted leading-relaxed">
                  <span className="font-semibold uppercase tracking-wide">Partnerships: </span>
                  {computePartnerships(liveMatch.innings1).map((pt, i) => (
                    <span key={i}>{getPlayer(pt.batter1Id)?.name || '—'}{pt.batter2Id ? ` & ${getPlayer(pt.batter2Id)?.name || '—'}` : ''}: {pt.runs} ({pt.balls}b){i < computePartnerships(liveMatch.innings1).length - 1 ? ', ' : ''}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Innings 1 bowling */}
            <div className={liveMatch.currentInnings === 2 || liveMatch.status === 'completed' ? 'mb-3' : ''}>
              <div className="text-kdpl-muted text-xs font-semibold uppercase tracking-wide mb-2">{getTeam(liveMatch.innings2.teamId)?.name} Bowling</div>
              <div className="rounded-xl overflow-hidden border border-kdpl-border">
                <div className="grid grid-cols-[1fr_auto_auto_auto_auto] text-[10px] text-kdpl-muted px-2 py-1.5 bg-kdpl-darker border-b border-kdpl-border gap-1 font-semibold uppercase">
                  <span>Bowler</span><span className="w-10 text-center">O</span><span className="w-8 text-center">R</span>
                  <span className="w-8 text-center">W</span><span className="w-10 text-center">Eco</span>
                </div>
                {Object.entries(liveMatch.innings1.bowlerStats).map(([pid, stats]) => {
                  const p = getPlayer(pid);
                  return (
                    <div key={pid} className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center px-2 py-2 border-b border-kdpl-border/30 last:border-0 gap-1">
                      <span className="text-kdpl-text text-xs font-medium">{p?.name || '—'}</span>
                      <span className="w-10 text-center text-kdpl-muted text-xs">{stats.overs}.{stats.balls}</span>
                      <span className="w-8 text-center text-kdpl-muted text-xs">{stats.runs}</span>
                      <span className="w-8 text-center text-red-400 font-bold text-xs">{stats.wickets}</span>
                      <span className="w-10 text-center text-kdpl-muted text-xs">{stats.economy?.toFixed(1) ?? 0}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Innings 2 batting + bowling — only once the 2nd innings has started */}
            {(liveMatch.currentInnings === 2 || liveMatch.status === 'completed') && Object.keys(liveMatch.innings2.playerStats).length > 0 && (
              <>
                <div className="mb-3">
                  <div className="text-kdpl-muted text-xs font-semibold uppercase tracking-wide mb-2">{getTeam(liveMatch.innings2.teamId)?.name} Batting</div>
                  <div className="rounded-xl overflow-hidden border border-kdpl-border">
                    <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] text-[10px] text-kdpl-muted px-2 py-1.5 bg-kdpl-darker border-b border-kdpl-border gap-1 font-semibold uppercase">
                      <span>Batter</span><span className="w-8 text-center">R</span><span className="w-8 text-center">B</span>
                      <span className="w-6 text-center">4s</span><span className="w-6 text-center">6s</span><span className="w-10 text-center">SR</span>
                    </div>
                    {Object.entries(liveMatch.innings2.playerStats).map(([pid, stats]) => {
                      const p = getPlayer(pid);
                      return (
                        <div key={pid} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] items-center px-2 py-2 border-b border-kdpl-border/30 last:border-0 gap-1">
                          <div>
                            <div className="text-kdpl-text text-xs font-medium">{p?.name || '—'}</div>
                            {stats.isOut && <div className="text-kdpl-muted text-[10px]">{stats.wicketType}</div>}
                          </div>
                          <span className={`w-8 text-center font-bold text-xs ${!stats.isOut ? 'text-kdpl-neon' : 'text-kdpl-text'}`}>{stats.runs}{!stats.isOut ? '*' : ''}</span>
                          <span className="w-8 text-center text-kdpl-muted text-xs">{stats.balls}</span>
                          <span className="w-6 text-center text-kdpl-muted text-xs">{stats.fours}</span>
                          <span className="w-6 text-center text-kdpl-muted text-xs">{stats.sixes}</span>
                          <span className="w-10 text-center text-kdpl-muted text-xs">{stats.strikeRate?.toFixed(0) ?? 0}</span>
                        </div>
                      );
                    })}
                  </div>
                  {liveMatch.innings2.fallOfWickets.length > 0 && (
                    <div className="mt-2 text-[10px] text-kdpl-muted leading-relaxed">
                      <span className="font-semibold uppercase tracking-wide">Fall of Wickets: </span>
                      {liveMatch.innings2.fallOfWickets.map((fow, i) => (
                        <span key={i}>{fow.score}-{fow.wicket} ({getPlayer(fow.batsmanId)?.name || '—'}, {fow.over}){i < liveMatch.innings2.fallOfWickets.length - 1 ? ', ' : ''}</span>
                      ))}
                    </div>
                  )}
                  {computePartnerships(liveMatch.innings2).length > 0 && (
                    <div className="mt-2 text-[10px] text-kdpl-muted leading-relaxed">
                      <span className="font-semibold uppercase tracking-wide">Partnerships: </span>
                      {computePartnerships(liveMatch.innings2).map((pt, i) => (
                        <span key={i}>{getPlayer(pt.batter1Id)?.name || '—'}{pt.batter2Id ? ` & ${getPlayer(pt.batter2Id)?.name || '—'}` : ''}: {pt.runs} ({pt.balls}b){i < computePartnerships(liveMatch.innings2).length - 1 ? ', ' : ''}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-kdpl-muted text-xs font-semibold uppercase tracking-wide mb-2">{getTeam(liveMatch.innings1.teamId)?.name} Bowling</div>
                  <div className="rounded-xl overflow-hidden border border-kdpl-border">
                    <div className="grid grid-cols-[1fr_auto_auto_auto_auto] text-[10px] text-kdpl-muted px-2 py-1.5 bg-kdpl-darker border-b border-kdpl-border gap-1 font-semibold uppercase">
                      <span>Bowler</span><span className="w-10 text-center">O</span><span className="w-8 text-center">R</span>
                      <span className="w-8 text-center">W</span><span className="w-10 text-center">Eco</span>
                    </div>
                    {Object.entries(liveMatch.innings2.bowlerStats).map(([pid, stats]) => {
                      const p = getPlayer(pid);
                      return (
                        <div key={pid} className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center px-2 py-2 border-b border-kdpl-border/30 last:border-0 gap-1">
                          <span className="text-kdpl-text text-xs font-medium">{p?.name || '—'}</span>
                          <span className="w-10 text-center text-kdpl-muted text-xs">{stats.overs}.{stats.balls}</span>
                          <span className="w-8 text-center text-kdpl-muted text-xs">{stats.runs}</span>
                          <span className="w-8 text-center text-red-400 font-bold text-xs">{stats.wickets}</span>
                          <span className="w-10 text-center text-kdpl-muted text-xs">{stats.economy?.toFixed(1) ?? 0}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Completed Match Scorecards */}
      {completedFixtures.map(fixture => {
        const ta = getTeam(fixture.teamAId);
        const tb = getTeam(fixture.teamBId);
        const winner = getTeam(fixture.result?.winnerId || '');
        const mom = getPlayer(fixture.result?.manOfMatch || '');
        return (
          <div key={fixture.id} className="rounded-2xl bg-kdpl-card border border-kdpl-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-kdpl-border bg-kdpl-darker/50">
              <span className="text-kdpl-text font-oswald font-semibold text-sm">Match #{fixture.matchNumber} · Round {fixture.round}</span>
              <div className="flex gap-2">
                <button onClick={() => setSummaryFixture(fixture)}
                  className="w-8 h-8 rounded-lg bg-kdpl-neon/10 border border-kdpl-neon/20 flex items-center justify-center text-kdpl-neon">
                  <DownloadIcon size={14} />
                </button>
                <button onClick={() => handleShare(fixture)}
                  className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <ShareIcon size={14} />
                </button>
              </div>
            </div>

            <div className="p-4">
              {/* Score */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-2xl">{ta?.logo}</span>
                  <div>
                    <div className={`text-sm font-oswald font-bold ${fixture.result?.winnerId === fixture.teamAId ? 'text-kdpl-neon' : 'text-kdpl-text'}`}>{ta?.shortName}</div>
                    <div className="text-kdpl-neon font-bold text-xl font-oswald">{fixture.result?.teamAScore}</div>
                    <div className="text-kdpl-muted text-[10px]">({fixture.result?.teamAOvers} ov)</div>
                  </div>
                </div>
                <div className="text-kdpl-muted text-sm font-bold px-3">vs</div>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <div className="text-right">
                    <div className={`text-sm font-oswald font-bold ${fixture.result?.winnerId === fixture.teamBId ? 'text-kdpl-neon' : 'text-kdpl-text'}`}>{tb?.shortName}</div>
                    <div className="text-kdpl-neon font-bold text-xl font-oswald">{fixture.result?.teamBScore}</div>
                    <div className="text-kdpl-muted text-[10px]">({fixture.result?.teamBOvers} ov)</div>
                  </div>
                  <span className="text-2xl">{tb?.logo}</span>
                </div>
              </div>

              {/* Result banner */}
              <div className="text-center py-2 bg-kdpl-neon/5 rounded-xl border border-kdpl-neon/20 mb-3">
                <span className="text-kdpl-neon font-semibold text-sm">🏆 {winner?.name} won by {fixture.result?.margin}</span>
              </div>

              {/* MOM */}
              {mom && (
                <div className="flex items-center gap-3 bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-2.5">
                  <span className="text-xl">⭐</span>
                  <div>
                    <div className="text-[10px] text-kdpl-muted uppercase tracking-wide">Man of the Match</div>
                    <div className="text-kdpl-text font-semibold text-sm">{mom.name}</div>
                    <div className="text-kdpl-muted text-[10px]">{mom.role}</div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 mt-2 text-[10px] text-kdpl-muted">
                <span>📅 {fixture.date}</span>
                <span>·</span>
                <span>⏱ {fixture.time}</span>
                <span>·</span>
                <span>🏟 {fixture.overs} Overs</span>
              </div>
            </div>
          </div>
        );
      })}

      {completedFixtures.length === 0 && !liveMatch && (
        <div className="text-center py-12 text-kdpl-muted">
          <p className="text-sm">No scorecards available yet</p>
        </div>
      )}

      {summaryFixture && (
        <MatchSummaryPosterModal
          fixture={summaryFixture}
          teamA={teams.find(t => t.id === summaryFixture.teamAId)}
          teamB={teams.find(t => t.id === summaryFixture.teamBId)}
          mom={players.find(p => p.id === summaryFixture.result?.manOfMatch)}
          tournament={tournament}
          onClose={() => setSummaryFixture(null)}
        />
      )}
    </div>
  );
}
