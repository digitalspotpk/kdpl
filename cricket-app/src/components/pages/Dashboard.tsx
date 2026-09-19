// ═══════════════════════════════════════════════════════════════
// KDPL DASHBOARD — HOME PAGE
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { TrophyIcon, RadioIcon, CalendarIcon, UsersIcon, BarChartIcon, ZapIcon, AwardIcon, ChevronRightIcon, FacebookIcon, WhatsAppIcon, ImageIcon } from '../ui/Icons';
import type { KDPLStore } from '../../store/useKDPLStore';
import AdSlotRenderer from '../ui/AdSlotRenderer';
import TournamentPosterModal from '../modals/TournamentPosterModal';
import TournamentsListPage from './TournamentsListPage';

interface DashboardProps { store: KDPLStore; }

export default function Dashboard({ store }: DashboardProps) {
  const { state, navigate } = store;
  const { tournament, teams, players, fixtures, venues, liveMatch, adSlots, supportWhatsapp, isAdmin } = state;
  const [showPoster, setShowPoster] = useState(false);

  const completedMatches = fixtures.filter(f => f.status === 'completed').length;
  const scheduledMatches = fixtures.filter(f => f.status === 'scheduled').length;
  const liveFixture = fixtures.find(f => f.status === 'live');
  const sorted = [...teams].sort((a, b) => b.points - a.points || b.nrr - a.nrr);
  const topBatter = [...players].sort((a, b) => b.runs - a.runs)[0];
  const topBowler = [...players].sort((a, b) => b.wickets - a.wickets)[0];
  const mvp = [...players].sort((a, b) => b.mvpScore - a.mvpScore)[0];

  const getTeam = (id: string) => teams.find(t => t.id === id);

  const quickActions = [
    { label: 'Live Score', icon: RadioIcon, page: 'live', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
    { label: 'Fixtures', icon: CalendarIcon, page: 'fixtures', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'Series', icon: TrophyIcon, page: 'series', color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
    { label: 'Teams', icon: UsersIcon, page: 'teams', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
    { label: 'Points Table', icon: BarChartIcon, page: 'standings', color: 'text-kdpl-neon', bg: 'bg-kdpl-neon/10 border-kdpl-neon/20' },
    { label: 'Analytics', icon: AwardIcon, page: 'analytics', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
    { label: 'Players', icon: ZapIcon, page: 'players', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  ];

  if (!tournament) {
    return <TournamentsListPage store={store} />;
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-2">
      {/* Register / Join CTA — for guests */}
      {!isAdmin && (
        <button onClick={() => navigate('setup')}
          className="flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-kdpl-neon/15 to-kdpl-green/15 border border-kdpl-neon/30 p-4 text-left active:scale-[0.99] transition-all">
          <div>
            <div className="text-kdpl-text font-oswald font-bold text-sm">Join This Tournament 🏏</div>
            <div className="text-kdpl-muted text-xs mt-0.5">Register as a player</div>
          </div>
          <ChevronRightIcon size={18} className="text-kdpl-neon flex-shrink-0" />
        </button>
      )}

      {/* Floating WhatsApp Support Button */}
      {supportWhatsapp && (
        <a
          href={`https://wa.me/${supportWhatsapp.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp Support"
          className="absolute bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-[#25D366] shadow-lg shadow-black/40 flex items-center justify-center active:scale-95 transition-all"
        >
          <WhatsAppIcon size={28} className="text-white" />
        </a>
      )}

      {/* Ad slot: Dashboard Top */}
      <AdSlotRenderer slot={adSlots.find(a => a.position === 'dashboard-top')} />

      {/* Generate tournament promo poster — on demand, never saved on host */}
      {tournament && (
        <button onClick={() => setShowPoster(true)}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-purple-500/15 to-kdpl-neon/15 border border-purple-500/30 text-kdpl-text text-sm font-oswald font-semibold active:scale-[0.99] transition-all">
          <ImageIcon size={16} className="text-purple-400" /> Generate Tournament Poster 🎨
        </button>
      )}

      {/* Live Match Banner */}
      {liveFixture && liveMatch && (
        <div
          className="rounded-2xl bg-gradient-to-r from-red-900/60 to-kdpl-card border border-red-500/40 p-4 cursor-pointer active:scale-98 transition-all"
          onClick={() => navigate('live')}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 font-bold text-xs tracking-widest">LIVE NOW</span>
            </div>
            <span className="text-kdpl-neon text-xs">Watch →</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <div className="flex justify-center mb-1">
                {getTeam(liveMatch.innings1.teamId)?.logoImageUrl ? (
                  <img src={getTeam(liveMatch.innings1.teamId)!.logoImageUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <span className="text-3xl">{getTeam(liveMatch.innings1.teamId)?.logo || '🏏'}</span>
                )}
              </div>
              <div className="text-kdpl-text font-oswald font-bold text-sm">{getTeam(liveMatch.innings1.teamId)?.shortName}</div>
              <div className="text-kdpl-neon font-bold text-xl font-oswald">
                {liveMatch.innings1.runs}/{liveMatch.innings1.wickets}
              </div>
              <div className="text-kdpl-muted text-xs">({liveMatch.innings1.overs}.{liveMatch.innings1.balls} ov)</div>
            </div>
            <div className="flex flex-col items-center px-3">
              <span className="text-kdpl-muted text-xs font-bold">VS</span>
              {liveMatch.currentInnings === 2 && (
                <span className="text-yellow-400 text-[10px] mt-1">Target: {liveMatch.innings1.runs + 1}</span>
              )}
            </div>
            <div className="text-center flex-1">
              <div className="flex justify-center mb-1">
                {getTeam(liveMatch.innings2.teamId)?.logoImageUrl ? (
                  <img src={getTeam(liveMatch.innings2.teamId)!.logoImageUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <span className="text-3xl">{getTeam(liveMatch.innings2.teamId)?.logo || '🏏'}</span>
                )}
              </div>
              <div className="text-kdpl-text font-oswald font-bold text-sm">{getTeam(liveMatch.innings2.teamId)?.shortName}</div>
              {liveMatch.currentInnings === 2 ? (
                <>
                  <div className="text-kdpl-neon font-bold text-xl font-oswald">
                    {liveMatch.innings2.runs}/{liveMatch.innings2.wickets}
                  </div>
                  <div className="text-kdpl-muted text-xs">({liveMatch.innings2.overs}.{liveMatch.innings2.balls} ov)</div>
                </>
              ) : (
                <div className="text-kdpl-muted text-sm">Yet to bat</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tournament Hero Card */}
      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-kdpl-green/30 to-kdpl-card border border-kdpl-green/30">
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-kdpl-neon text-xs font-bold tracking-widest mb-1 uppercase">
                {tournament?.status === 'active' ? '🟢 ONGOING' : tournament?.status === 'upcoming' ? '🔵 UPCOMING' : '🏆 COMPLETED'}
              </div>
              <h2 className="text-kdpl-text font-oswald font-bold text-lg leading-tight">
                {tournament?.name || 'KD Premier League'}
              </h2>
              <p className="text-kdpl-muted text-xs mt-1">
                {tournament?.format} · {tournament?.overs} Overs · {tournament?.teamCount} Teams
              </p>
            </div>
            <TrophyIcon size={40} className="text-kdpl-neon/40" />
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: 'Matches Played', value: completedMatches, icon: '✅' },
              { label: 'Upcoming', value: scheduledMatches, icon: '📅' },
              { label: 'Teams', value: teams.length, icon: '🏏' },
            ].map(stat => (
              <div key={stat.label} className="bg-kdpl-darker/50 rounded-xl p-2.5 text-center">
                <div className="text-lg">{stat.icon}</div>
                <div className="text-kdpl-neon font-oswald font-bold text-xl">{stat.value}</div>
                <div className="text-kdpl-muted text-[10px] leading-tight">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h3 className="text-kdpl-text font-oswald font-semibold text-sm mb-2 uppercase tracking-wide">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-2">
          {quickActions.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.page}
                onClick={() => navigate(action.page)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all active:scale-95 ${action.bg}`}
              >
                <Icon size={22} className={action.color} />
                <span className="text-kdpl-text text-[11px] font-medium">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Ad slot mid */}
      <AdSlotRenderer slot={adSlots.find(a => a.position === 'dashboard-mid')} />

      {/* Tournament Custom Rules — public */}
      {tournament?.customRules && tournament.customRules.length > 0 && (
        <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4">
          <h3 className="text-kdpl-text font-oswald font-semibold text-sm uppercase tracking-wide mb-3">📋 Tournament Rules</h3>
          <div className="flex flex-col gap-2">
            {tournament.customRules.map((rule, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-kdpl-neon text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}.</span>
                <span className="text-kdpl-text/85 text-xs leading-relaxed">{rule}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Organizer, Committee & Broadcasters — public */}
      {tournament && ((tournament.officials?.length || 0) > 0 || (tournament.broadcasters?.length || 0) > 0) && (
        <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4">
          <h3 className="text-kdpl-text font-oswald font-semibold text-sm uppercase tracking-wide mb-3">👥 Organized By</h3>
          <div className="flex flex-col gap-2">
            {(tournament.officials || []).map(o => (
              <div key={o.id} className="flex items-center justify-between">
                <div>
                  <span className="text-kdpl-text text-xs font-semibold">{o.name}</span>
                  <span className="text-kdpl-muted text-[10px] ml-1.5">· {o.role}</span>
                </div>
                {o.whatsapp && (
                  <a href={`https://wa.me/${o.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-green-400 text-[10px]">📱 {o.whatsapp}</a>
                )}
              </div>
            ))}
          </div>
          {(tournament.broadcasters?.length || 0) > 0 && (
            <>
              <div className="text-kdpl-muted text-[10px] font-semibold uppercase tracking-wide mt-3 mb-2">📹 Live Broadcasters</div>
              <div className="flex flex-col gap-2">
                {tournament.broadcasters.map(b => (
                  <div key={b.id} className="flex items-center justify-between">
                    <span className="text-kdpl-text text-xs font-semibold">{b.name}</span>
                    {b.whatsapp && (
                      <a href={`https://wa.me/${b.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-green-400 text-[10px]">📱 {b.whatsapp}</a>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Mini Points Table */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-kdpl-text font-oswald font-semibold text-sm uppercase tracking-wide">Points Table</h3>
          <button onClick={() => navigate('standings')} className="text-kdpl-neon text-xs flex items-center gap-1">
            Full Table <ChevronRightIcon size={12} />
          </button>
        </div>
        <div className="rounded-xl border border-kdpl-border bg-kdpl-card overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-0 text-[10px] text-kdpl-muted font-semibold px-3 py-2 border-b border-kdpl-border uppercase">
            <span className="w-5">#</span>
            <span>Team</span>
            <span className="w-8 text-center">Pts</span>
            <span className="w-12 text-center">NRR</span>
            <span className="w-10 text-center">Form</span>
          </div>
          {sorted.slice(0, 4).map((team, i) => (
            <div key={team.id} className={`grid grid-cols-[auto_1fr_auto_auto_auto] gap-0 items-center px-3 py-2.5 ${i < sorted.length - 1 ? 'border-b border-kdpl-border/50' : ''}`}>
              <span className={`w-5 text-xs font-bold ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-kdpl-muted'}`}>{i+1}</span>
              <div className="flex items-center gap-2">
                <span className="text-base">{team.logo}</span>
                <span className="text-kdpl-text text-xs font-medium">{team.shortName}</span>
              </div>
              <span className="w-8 text-center text-kdpl-neon font-bold text-sm font-oswald">{team.points}</span>
              <span className={`w-12 text-center text-xs font-mono ${team.nrr >= 0 ? 'text-kdpl-neon' : 'text-red-400'}`}>
                {team.nrr >= 0 ? '+' : ''}{team.nrr.toFixed(2)}
              </span>
              <div className="w-10 flex justify-center gap-0.5">
                {[...Array(Math.min(team.wins, 2))].map((_, j) => (
                  <span key={j} className="w-3 h-3 rounded-sm bg-kdpl-neon/80 text-[8px] flex items-center justify-center text-kdpl-darker font-bold">W</span>
                ))}
                {[...Array(Math.min(team.losses, 2))].map((_, j) => (
                  <span key={j} className="w-3 h-3 rounded-sm bg-red-500/80 text-[8px] flex items-center justify-center text-white font-bold">L</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MVP Highlights */}
      <div>
        <h3 className="text-kdpl-text font-oswald font-semibold text-sm uppercase tracking-wide mb-2">Top Performers</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Orange Cap', player: topBatter, stat: `${topBatter?.runs} Runs`, icon: '🏏', color: 'from-orange-500/20' },
            { label: 'Purple Cap', player: topBowler, stat: `${topBowler?.wickets} Wkts`, icon: '🎳', color: 'from-purple-500/20' },
            { label: 'MVP', player: mvp, stat: `${mvp?.mvpScore} Pts`, icon: '⭐', color: 'from-yellow-500/20' },
          ].map(item => (
            <div key={item.label} className={`rounded-xl bg-gradient-to-b ${item.color} to-kdpl-card border border-kdpl-border p-2.5 text-center cursor-pointer hover:border-kdpl-neon/40 transition-all`}
              onClick={() => navigate('analytics')}>
              <div className="text-xl mb-1">{item.icon}</div>
              <div className="text-[10px] text-kdpl-muted mb-0.5">{item.label}</div>
              <div className="text-kdpl-text text-xs font-semibold truncate">{item.player?.name || '—'}</div>
              <div className="text-kdpl-neon text-xs font-bold font-oswald">{item.stat}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Facebook Live CTA */}
      <div
        className="rounded-2xl bg-gradient-to-r from-blue-900/40 to-kdpl-card border border-blue-500/30 p-3 flex items-center gap-3 cursor-pointer active:scale-98 transition-all"
        onClick={() => navigate('facebook-live')}
      >
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
          <FacebookIcon size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-kdpl-text text-sm font-semibold">Facebook Live</div>
          <div className="text-kdpl-muted text-xs">Watch matches live on Facebook</div>
        </div>
        <ChevronRightIcon size={16} className="text-kdpl-muted flex-shrink-0" />
      </div>

      {/* Recent Matches */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-kdpl-text font-oswald font-semibold text-sm uppercase tracking-wide">Recent Results</h3>
          <button onClick={() => navigate('fixtures')} className="text-kdpl-neon text-xs flex items-center gap-1">
            All <ChevronRightIcon size={12} />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {fixtures.filter(f => f.status === 'completed').slice(-3).reverse().map(f => {
            const ta = getTeam(f.teamAId);
            const tb = getTeam(f.teamBId);
            const winner = f.result ? getTeam(f.result.winnerId) : null;
            return (
              <div key={f.id} className="rounded-xl bg-kdpl-card border border-kdpl-border p-3">
                <div className="flex items-center justify-between text-[10px] text-kdpl-muted mb-2">
                  <span>Match #{f.matchNumber} · Round {f.round}</span>
                  <span>{f.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-base">{ta?.logo}</span>
                    <span className={`text-xs font-semibold ${f.result?.winnerId === f.teamAId ? 'text-kdpl-neon' : 'text-kdpl-muted'}`}>{ta?.shortName}</span>
                    <span className="text-kdpl-neon font-bold text-sm font-oswald">{f.result?.teamAScore}</span>
                  </div>
                  <div className="px-2 text-kdpl-muted text-xs">vs</div>
                  <div className="flex items-center gap-1.5 flex-1 justify-end">
                    <span className="text-kdpl-neon font-bold text-sm font-oswald">{f.result?.teamBScore}</span>
                    <span className={`text-xs font-semibold ${f.result?.winnerId === f.teamBId ? 'text-kdpl-neon' : 'text-kdpl-muted'}`}>{tb?.shortName}</span>
                    <span className="text-base">{tb?.logo}</span>
                  </div>
                </div>
                {winner && (
                  <div className="mt-1.5 text-[10px] text-kdpl-muted text-center">
                    {winner.name} won by {f.result?.margin}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming matches */}
      <div className="pb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-kdpl-text font-oswald font-semibold text-sm uppercase tracking-wide">Upcoming</h3>
        </div>
        <div className="flex flex-col gap-2">
          {fixtures.filter(f => f.status === 'scheduled').slice(0, 3).map(f => {
            const ta = getTeam(f.teamAId);
            const tb = getTeam(f.teamBId);
            return (
              <div key={f.id} className="rounded-xl bg-kdpl-card border border-kdpl-border/60 p-3 flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-lg">{ta?.logo}</span>
                  <span className="text-kdpl-text text-xs font-semibold">{ta?.shortName}</span>
                  <span className="text-kdpl-muted text-xs font-bold">vs</span>
                  <span className="text-kdpl-text text-xs font-semibold">{tb?.shortName}</span>
                  <span className="text-lg">{tb?.logo}</span>
                </div>
                <div className="text-right">
                  <div className="text-kdpl-muted text-[10px]">{f.date}</div>
                  <div className="text-kdpl-text text-[10px] font-medium">{f.time} · {f.slot}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showPoster && tournament && (
        <TournamentPosterModal
          tournament={tournament}
          teams={teams}
          venues={venues}
          supportWhatsapp={supportWhatsapp}
          onClose={() => setShowPoster(false)}
        />
      )}
    </div>
  );
}
