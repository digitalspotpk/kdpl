// ═══════════════════════════════════════════════════════════════
// KDPL LIVE SCORER — Ball-by-ball admin panel
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { ArrowLeftIcon } from '../ui/Icons';
import type { KDPLStore } from '../../store/useKDPLStore';
import type { BallEvent, WicketType } from '../../types';
import { genId } from '../../utils/id';

const WICKET_TYPES: WicketType[] = ['Bowled', 'Caught', 'LBW', 'Run-Out', 'Stumped', 'Hit-Wicket', 'Obstructing'];
const EXTRA_TYPES = ['Wide', 'No-Ball', 'Leg-Bye', 'Bye'] as const;

const COMMENTARY: Record<string, string[]> = {
  '0': ['Dot ball! Good line and length', 'Defended back to the bowler', 'Beaten outside off stump!', 'Good defensive shot'],
  '1': ['Quick single taken', 'Pushed to mid-on for one', 'Worked through square leg'],
  '2': ['Two runs! Good running between the wickets', 'Driven to the gap for two'],
  '3': ['Three runs! Excellent running', 'Good placement, three taken'],
  '4': ['FOUR! Timed to perfection!', 'FOUR! Beautiful drive through covers!', 'FOUR! Pulled through mid-wicket!', 'FOUR! Cut shot to the boundary!'],
  '6': ['SIX! Over long-on!', 'SIX! Massive hit into the stands!', 'SIX! Flat bat, over extra cover!', 'SIX! Into the crowd!'],
  'W': ['WICKET! Brilliant delivery!', 'WICKET! Big breakthrough!', 'OUT! The fielder holds on!'],
  'Wd': ['Wide! Down leg side', 'Wide! Bowler strays outside off'],
  'Nb': ['No Ball! Front foot overstep', 'Free hit coming up!'],
};

function genCommentary(runs: number, isWicket: boolean, extra: string): string {
  const key = isWicket ? 'W' : extra ? (extra === 'Wide' ? 'Wd' : 'Nb') : String(runs);
  const arr = COMMENTARY[key] || ['Ball played'];
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function ScorerPage({ store }: { store: KDPLStore }) {
  const {
    state, recordBall, undoBall, navigate,
    selectOpeners, selectNextBatter, selectNextBowler,
    endInningsManually, endMatchManually, clearLiveMatch,
  } = store;
  const { liveMatch, teams, players, isAdmin } = state;
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [wicketType, setWicketType] = useState<WicketType>('Bowled');
  const [fielderId, setFielderId] = useState('');
  const [runOutBatter, setRunOutBatter] = useState<'striker' | 'non-striker'>('striker');
  const [runOutRuns, setRunOutRuns] = useState(0);
  const [extraType, setExtraType] = useState<'' | 'Wide' | 'No-Ball' | 'Leg-Bye' | 'Bye'>('');
  const [extraRuns, setExtraRuns] = useState(1);
  const [showEndConfirm, setShowEndConfirm] = useState<'innings' | 'match' | 'reset' | null>(null);

  // Opener / next-batter / next-bowler picker local state
  const [pickStriker, setPickStriker] = useState('');
  const [pickNonStriker, setPickNonStriker] = useState('');
  const [pickBowler, setPickBowler] = useState('');

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h3 className="text-kdpl-text font-oswald font-bold text-xl mb-2">Admin Access Required</h3>
        <p className="text-kdpl-muted text-sm">Scorer panel is restricted to admins</p>
      </div>
    );
  }

  if (!liveMatch) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="text-4xl mb-4">🏏</div>
        <h3 className="text-kdpl-text font-oswald font-bold text-xl mb-2">No Active Match</h3>
        <p className="text-kdpl-muted text-sm mb-4">Start a match from the Toss page</p>
        <button onClick={() => navigate('toss')} className="px-6 py-3 bg-kdpl-neon text-kdpl-darker rounded-xl font-bold text-sm">
          Go to Toss
        </button>
      </div>
    );
  }

  // ── Match complete screen ─────────────────────────────────────────
  if (liveMatch.status === 'completed') {
    const teamAName = teams.find(t => t.id === liveMatch.teamAId);
    const teamBName = teams.find(t => t.id === liveMatch.teamBId);
    const inns1Team = teams.find(t => t.id === liveMatch.innings1.teamId);
    const inns2Team = teams.find(t => t.id === liveMatch.innings2.teamId);
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="rounded-2xl bg-gradient-to-br from-kdpl-card to-kdpl-darker border border-kdpl-neon/40 p-6 text-center">
          <div className="text-4xl mb-2">🏆</div>
          <h3 className="text-kdpl-text font-oswald font-bold text-xl mb-1">Match Complete</h3>
          <p className="text-kdpl-muted text-sm mb-4">{teamAName?.name} vs {teamBName?.name}</p>
          <div className="flex justify-center gap-6 mb-2">
            <div>
              <div className="text-kdpl-muted text-xs">{inns1Team?.shortName}</div>
              <div className="text-kdpl-text font-oswald font-bold text-lg">{liveMatch.innings1.runs}/{liveMatch.innings1.wickets}</div>
              <div className="text-kdpl-muted text-[10px]">({liveMatch.innings1.overs}.{liveMatch.innings1.balls} ov)</div>
            </div>
            <div>
              <div className="text-kdpl-muted text-xs">{inns2Team?.shortName}</div>
              <div className="text-kdpl-text font-oswald font-bold text-lg">{liveMatch.innings2.runs}/{liveMatch.innings2.wickets}</div>
              <div className="text-kdpl-muted text-[10px]">({liveMatch.innings2.overs}.{liveMatch.innings2.balls} ov)</div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('scorecard')} className="flex-1 py-3 rounded-xl bg-kdpl-card border border-kdpl-border text-kdpl-text text-sm font-semibold">
            View Scorecard
          </button>
          <button onClick={() => navigate('fixtures')} className="flex-1 py-3 rounded-xl bg-kdpl-neon text-kdpl-darker text-sm font-bold">
            Back to Fixtures
          </button>
        </div>
        <button onClick={undoBall} className="flex items-center justify-center gap-1.5 py-2.5 text-orange-400 text-xs font-medium">
          <ArrowLeftIcon size={13} /> Undo last ball (reopens the match)
        </button>
      </div>
    );
  }

  const innings = liveMatch.currentInnings === 1 ? liveMatch.innings1 : liveMatch.innings2;
  const battingTeam = teams.find(t => t.id === innings.teamId);
  const bowlingTeamId = liveMatch.teamAId === innings.teamId ? liveMatch.teamBId : liveMatch.teamAId;
  const bowlingTeam = teams.find(t => t.id === bowlingTeamId);

  // Correctly scoped to THIS match's two teams only (fixes bowler/batter mix-up in multi-team tournaments)
  // Banned players are excluded — they can't be selected for scoring.
  const battingSquad = players.filter(p => p.teamId === innings.teamId && !p.banned);
  const bowlingSquad = players.filter(p => p.teamId === bowlingTeamId && !p.banned);

  const batter1 = players.find(p => p.id === innings.currentBatter1);
  const batter2 = players.find(p => p.id === innings.currentBatter2);
  const bowler = players.find(p => p.id === innings.currentBowler);
  const batter1Stats = innings.playerStats[innings.currentBatter1];
  const batter2Stats = innings.playerStats[innings.currentBatter2];
  const bowlerStats = innings.bowlerStats[innings.currentBowler];

  const needsOpeners = !innings.currentBatter1 && !innings.currentBatter2 && !innings.currentBowler;
  const needsNewBatter = !innings.currentBatter1 && !!innings.currentBatter2;
  const needsNewBowler = !innings.currentBowler && !!innings.currentBatter1;

  // ── Opening players / new innings setup ─────────────────────────
  if (needsOpeners) {
    const availableNonStriker = battingSquad.filter(p => p.id !== pickStriker);
    const canStart = pickStriker && pickNonStriker && pickBowler && pickStriker !== pickNonStriker;
    return (
      <div className="flex flex-col gap-4 p-4">
        <h2 className="text-kdpl-text font-oswald font-bold text-lg">
          {liveMatch.currentInnings === 1 ? 'Start 1st Innings' : 'Start 2nd Innings'}
        </h2>
        <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4 text-center">
          <div className="text-kdpl-muted text-xs">{battingTeam?.name} batting</div>
          {liveMatch.currentInnings === 2 && (
            <div className="text-yellow-400 text-sm font-bold mt-1">Target: {liveMatch.innings1.runs + 1}</div>
          )}
        </div>
        <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4 flex flex-col gap-3">
          <div>
            <label className="text-kdpl-muted text-xs mb-1 block">Striker (on strike) — {battingTeam?.shortName}</label>
            <select value={pickStriker} onChange={e => setPickStriker(e.target.value)}
              className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm outline-none">
              <option value="">Select Striker</option>
              {battingSquad.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-kdpl-muted text-xs mb-1 block">Non-Striker — {battingTeam?.shortName}</label>
            <select value={pickNonStriker} onChange={e => setPickNonStriker(e.target.value)}
              className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm outline-none">
              <option value="">Select Non-Striker</option>
              {availableNonStriker.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-kdpl-muted text-xs mb-1 block">Opening Bowler — {bowlingTeam?.shortName}</label>
            <select value={pickBowler} onChange={e => setPickBowler(e.target.value)}
              className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm outline-none">
              <option value="">Select Bowler</option>
              {bowlingSquad.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
        <button
          disabled={!canStart}
          onClick={() => { selectOpeners(pickStriker, pickNonStriker, pickBowler); setPickStriker(''); setPickNonStriker(''); setPickBowler(''); }}
          className="w-full py-3.5 rounded-2xl bg-kdpl-neon text-kdpl-darker font-oswald font-bold text-base disabled:opacity-50">
          Start Innings 🏏
        </button>
      </div>
    );
  }

  // ── New batter required (previous one got out) ───────────────────
  if (needsNewBatter) {
    const dismissedIds = Object.entries(innings.playerStats).filter(([, st]) => st.isOut).map(([id]) => id);
    const eligible = battingSquad.filter(p => p.id !== innings.currentBatter2 && !dismissedIds.includes(p.id));
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 text-center">
          <div className="text-2xl mb-1">🏏</div>
          <h3 className="text-kdpl-text font-oswald font-bold">Wicket! Next Batter</h3>
          <p className="text-kdpl-muted text-xs mt-1">{battingTeam?.name}: {innings.runs}/{innings.wickets}</p>
        </div>
        <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4">
          <label className="text-kdpl-muted text-xs mb-1 block">New Batter — {battingTeam?.shortName}</label>
          <select value={pickStriker} onChange={e => setPickStriker(e.target.value)}
            className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm outline-none">
            <option value="">Select Batter</option>
            {eligible.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <button disabled={!pickStriker} onClick={() => { selectNextBatter(pickStriker); setPickStriker(''); }}
          className="w-full py-3.5 rounded-2xl bg-kdpl-neon text-kdpl-darker font-oswald font-bold text-base disabled:opacity-50">
          Send In Batter →
        </button>
      </div>
    );
  }

  // ── New bowler required (over just completed) ────────────────────
  if (needsNewBowler) {
    const eligible = bowlingSquad.filter(p => p.id !== liveMatch.lastOverBowlerId);
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="rounded-2xl bg-kdpl-neon/10 border border-kdpl-neon/30 p-4 text-center">
          <div className="text-2xl mb-1">🎳</div>
          <h3 className="text-kdpl-text font-oswald font-bold">Over Complete! Next Bowler</h3>
          <p className="text-kdpl-muted text-xs mt-1">{innings.overs}.0 overs bowled</p>
        </div>
        <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4">
          <label className="text-kdpl-muted text-xs mb-1 block">Next Bowler — {bowlingTeam?.shortName}</label>
          <select value={pickBowler} onChange={e => setPickBowler(e.target.value)}
            className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm outline-none">
            <option value="">Select Bowler</option>
            {eligible.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <p className="text-kdpl-muted text-[10px] mt-1.5">The previous over's bowler can't bowl consecutive overs.</p>
        </div>
        <button disabled={!pickBowler} onClick={() => { selectNextBowler(pickBowler); setPickBowler(''); }}
          className="w-full py-3.5 rounded-2xl bg-kdpl-neon text-kdpl-darker font-oswald font-bold text-base disabled:opacity-50">
          Confirm Bowler →
        </button>
      </div>
    );
  }

  const handleBall = (runs: number, isWicket = false) => {
    const isRunOut = isWicket && wicketType === 'Run-Out';
    const ball: BallEvent = {
      id: genId('b'),
      ball: innings.balls + 1,
      over: innings.overs,
      runs: isWicket ? (isRunOut ? runOutRuns : 0) : runs,
      extras: extraType ? extraRuns : 0,
      extraType: extraType || '',
      isWicket,
      wicketType: isWicket ? wicketType : '',
      batsmanId: innings.currentBatter1,
      bowlerId: innings.currentBowler,
      fielderId: isWicket ? fielderId : '',
      runOutBatsmanId: isRunOut ? (runOutBatter === 'striker' ? innings.currentBatter1 : innings.currentBatter2) : undefined,
      commentary: genCommentary(runs, isWicket, extraType),
      timestamp: Date.now(),
    };
    recordBall(ball);
    setExtraType('');
    setShowWicketModal(false);
    setRunOutBatter('striker');
    setRunOutRuns(0);
    if (navigator.vibrate) navigator.vibrate(isWicket ? [100, 50, 100] : runs >= 4 ? [50] : [10]);
  };

  const getBallBg = (b: BallEvent) => {
    if (b.isWicket) return 'bg-red-500 text-white';
    if (b.runs === 6) return 'bg-kdpl-neon text-kdpl-darker';
    if (b.runs === 4) return 'bg-blue-500 text-white';
    if (b.extraType) return 'bg-yellow-500 text-kdpl-darker';
    return b.runs === 0 ? 'bg-kdpl-border text-kdpl-muted' : 'bg-kdpl-card border border-kdpl-border text-kdpl-text';
  };

  const currentOverBalls = innings.ballEvents.slice(-6);

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto w-full">
      {/* Scorer Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-kdpl-text font-oswald font-bold text-lg truncate">Live Scorer</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
            <span className="text-red-400 text-xs font-bold">INNINGS {liveMatch.currentInnings} · SCORING LIVE</span>
            {liveMatch.freeHit && (
              <span className="text-yellow-300 text-[10px] font-bold bg-yellow-500/20 border border-yellow-500/40 px-1.5 py-0.5 rounded-full">🎯 FREE HIT</span>
            )}
          </div>
        </div>
        <button onClick={undoBall}
          className="flex items-center gap-1.5 px-3 py-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl text-xs font-medium active:scale-95 flex-shrink-0">
          <ArrowLeftIcon size={14} /> Undo
        </button>
      </div>

      {/* Score Display */}
      <div className="rounded-2xl bg-gradient-to-br from-kdpl-card to-kdpl-darker border border-kdpl-border p-4 text-center">
        <div className="text-kdpl-muted text-xs mb-1 truncate">{battingTeam?.name} — Innings {liveMatch.currentInnings}</div>
        <div className="text-4xl sm:text-5xl font-oswald font-bold text-kdpl-text">
          {innings.runs}<span className="text-2xl sm:text-3xl text-kdpl-muted">/{innings.wickets}</span>
        </div>
        <div className="text-kdpl-muted text-sm mt-1">({innings.overs}.{innings.balls} / {liveMatch.overs} overs)</div>
        {liveMatch.currentInnings === 2 && (
          <div className="mt-2 text-xs sm:text-sm">
            <span className="text-yellow-400 font-bold">Target: {liveMatch.innings1.runs + 1}</span>
            <span className="text-kdpl-muted mx-2">·</span>
            <span className="text-kdpl-muted">Need: <span className="text-red-400 font-bold">{Math.max(0, liveMatch.innings1.runs + 1 - innings.runs)}</span></span>
          </div>
        )}

        {/* This over */}
        <div className="flex justify-center gap-1.5 sm:gap-2 mt-3 flex-wrap">
          {currentOverBalls.map((b, i) => (
            <div key={i} className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-bold flex-shrink-0 ${getBallBg(b)}`}>
              {b.isWicket ? 'W' : b.extraType ? b.extraType[0] : b.runs}
            </div>
          ))}
          {[...Array(Math.max(0, 6 - currentOverBalls.length))].map((_, i) => (
            <div key={i} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-dashed border-kdpl-border/50 flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* Batters & Bowler */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-kdpl-card border border-kdpl-border p-3 min-w-0">
          <div className="text-kdpl-muted text-[10px] uppercase tracking-wide mb-1.5">On Strike ●</div>
          <div className="text-kdpl-text text-xs font-semibold truncate">{batter1?.name || '—'}</div>
          <div className="text-kdpl-neon font-oswald font-bold text-lg">{batter1Stats?.runs ?? 0}*</div>
          <div className="text-kdpl-muted text-[10px]">{batter1Stats?.balls ?? 0}b · {batter1Stats?.fours ?? 0}x4 · {batter1Stats?.sixes ?? 0}x6</div>
        </div>
        <div className="rounded-xl bg-kdpl-card border border-kdpl-border p-3 min-w-0">
          <div className="text-kdpl-muted text-[10px] uppercase tracking-wide mb-1.5">Non-Striker</div>
          <div className="text-kdpl-text text-xs font-semibold truncate">{batter2?.name || '—'}</div>
          <div className="text-kdpl-neon font-oswald font-bold text-lg">{batter2Stats?.runs ?? 0}</div>
          <div className="text-kdpl-muted text-[10px]">{batter2Stats?.balls ?? 0}b</div>
        </div>
      </div>
      <div className="rounded-xl bg-kdpl-card border border-kdpl-border p-3">
        <div className="text-kdpl-muted text-[10px] uppercase tracking-wide mb-1">Current Bowler</div>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="text-kdpl-text text-xs font-semibold truncate">{bowler?.name || '—'}</div>
          <div className="flex gap-2 sm:gap-3 text-[11px] sm:text-xs text-kdpl-muted flex-wrap">
            <span>{bowlerStats?.overs ?? 0}.{bowlerStats?.balls ?? 0} ov</span>
            <span className="text-red-400 font-bold">{bowlerStats?.wickets ?? 0}w</span>
            <span>{bowlerStats?.runs ?? 0}r</span>
            <span>{bowlerStats?.economy?.toFixed(1) ?? '0.0'} eco</span>
          </div>
        </div>
      </div>

      {/* Extra type selector */}
      <div>
        <div className="text-kdpl-muted text-xs mb-2 font-semibold uppercase tracking-wide">Extras (optional)</div>
        <div className="flex gap-2 flex-wrap">
          {EXTRA_TYPES.map(e => (
            <button key={e} onClick={() => setExtraType(extraType === e ? '' : e)}
              className={`px-3 py-1.5 rounded-lg text-xs border font-medium transition-all ${extraType === e ? 'bg-yellow-500 text-kdpl-darker border-yellow-500' : 'bg-kdpl-card border-kdpl-border text-kdpl-muted hover:text-kdpl-text'}`}>
              {e}
            </button>
          ))}
          {extraType && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-kdpl-muted text-xs">+</span>
              {[0,1,2,3,4].map(r => (
                <button key={r} onClick={() => setExtraRuns(r)}
                  className={`w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 ${extraRuns === r ? 'bg-yellow-500 text-kdpl-darker' : 'bg-kdpl-card border border-kdpl-border text-kdpl-muted'}`}>
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Run Buttons */}
      <div>
        <div className="text-kdpl-muted text-xs mb-2 font-semibold uppercase tracking-wide">Runs Scored</div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[0,1,2,3,4,6].map(runs => (
            <button
              key={runs}
              onClick={() => handleBall(runs)}
              className={`h-14 rounded-2xl text-xl font-bold font-oswald transition-all active:scale-90
                ${runs === 4 ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                : runs === 6 ? 'bg-kdpl-neon text-kdpl-darker shadow-lg shadow-kdpl-neon/30'
                : runs === 0 ? 'bg-kdpl-card border border-kdpl-border text-kdpl-muted'
                : 'bg-kdpl-card border border-kdpl-border text-kdpl-text hover:border-kdpl-neon/50'}`}
            >
              {runs}
            </button>
          ))}
        </div>
      </div>

      {/* Wicket Button */}
      <button
        onClick={() => setShowWicketModal(true)}
        className="w-full h-14 rounded-2xl bg-red-500/20 border-2 border-red-500/50 text-red-400 font-oswald font-bold text-xl active:scale-98 hover:bg-red-500/30 transition-all">
        🔴 WICKET
      </button>

      {/* Last ball commentary */}
      {innings.ballEvents.length > 0 && (
        <div className="rounded-xl bg-kdpl-card/50 border border-kdpl-border/50 p-3">
          <div className="text-kdpl-muted text-[10px] uppercase tracking-wide mb-1">Last Ball</div>
          <div className="text-kdpl-text text-xs">{innings.ballEvents[innings.ballEvents.length - 1].commentary}</div>
        </div>
      )}

      {/* Manual overrides */}
      <div className="flex gap-2">
        <button onClick={() => setShowEndConfirm('innings')}
          className="flex-1 py-2.5 rounded-xl bg-kdpl-card border border-kdpl-border text-kdpl-muted text-xs font-medium">
          End Innings Early
        </button>
        <button onClick={() => setShowEndConfirm('match')}
          className="flex-1 py-2.5 rounded-xl bg-kdpl-card border border-kdpl-border text-kdpl-muted text-xs font-medium">
          End Match
        </button>
        <button onClick={() => setShowEndConfirm('reset')}
          className="px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
          Reset
        </button>
      </div>

      {/* End confirm dialog */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-kdpl-card border border-kdpl-border rounded-2xl p-5">
            <h3 className="text-kdpl-text font-oswald font-bold text-base mb-2">
              {showEndConfirm === 'innings' ? 'End Innings Now?' : showEndConfirm === 'match' ? 'End Match Now?' : 'Reset This Match?'}
            </h3>
            <p className="text-kdpl-muted text-xs mb-4">
              {showEndConfirm === 'innings'
                ? (liveMatch.currentInnings === 1 ? 'This moves straight to the 2nd innings.' : 'This ends the match using the current score.')
                : showEndConfirm === 'match'
                ? 'This immediately finalizes the match result with the current score.'
                : 'This wipes all scoring for this match and sends the fixture back to "Scheduled" so you can start over from the toss. This cannot be undone.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowEndConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-kdpl-border text-kdpl-muted text-sm">Cancel</button>
              <button
                onClick={() => {
                  if (showEndConfirm === 'innings') endInningsManually();
                  else if (showEndConfirm === 'match') endMatchManually();
                  else { clearLiveMatch(); navigate('fixtures'); }
                  setShowEndConfirm(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wicket Modal */}
      {showWicketModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-kdpl-card border border-kdpl-border rounded-t-3xl sm:rounded-3xl p-5 max-h-[85vh] overflow-y-auto kdpl-scroll">
            <div className="w-10 h-1 bg-kdpl-border rounded-full mx-auto mb-4 sm:hidden" />
            <h3 className="text-kdpl-text font-oswald font-bold text-lg mb-4">Wicket Details</h3>
            <div className="mb-4">
              <div className="text-kdpl-muted text-xs mb-2">Dismissal Type</div>
              <div className="grid grid-cols-2 gap-2">
                {WICKET_TYPES.map(wt => (
                  <button key={wt} onClick={() => setWicketType(wt)}
                    className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-medium transition-all border ${wicketType === wt ? 'bg-red-500 text-white border-red-500' : 'bg-kdpl-darker border-kdpl-border text-kdpl-muted hover:text-kdpl-text'}`}>
                    {wt}
                  </button>
                ))}
              </div>
            </div>
            {(wicketType === 'Caught' || wicketType === 'Run-Out' || wicketType === 'Stumped') && (
              <div className="mb-4">
                <div className="text-kdpl-muted text-xs mb-2">Fielder — {bowlingTeam?.shortName}</div>
                <select value={fielderId} onChange={e => setFielderId(e.target.value)}
                  className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2 text-kdpl-text text-sm outline-none">
                  <option value="">Select Fielder</option>
                  {bowlingSquad.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
            {wicketType === 'Run-Out' && (
              <>
                <div className="mb-4">
                  <div className="text-kdpl-muted text-xs mb-2">Who was run out?</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setRunOutBatter('striker')}
                      className={`py-2 px-2 rounded-xl text-xs font-medium border ${runOutBatter === 'striker' ? 'bg-red-500 text-white border-red-500' : 'bg-kdpl-darker border-kdpl-border text-kdpl-muted'}`}>
                      {batter1?.name || 'Striker'} (striker)
                    </button>
                    <button onClick={() => setRunOutBatter('non-striker')}
                      className={`py-2 px-2 rounded-xl text-xs font-medium border ${runOutBatter === 'non-striker' ? 'bg-red-500 text-white border-red-500' : 'bg-kdpl-darker border-kdpl-border text-kdpl-muted'}`}>
                      {batter2?.name || 'Non-striker'}
                    </button>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-kdpl-muted text-xs mb-2">Runs completed before the run-out</div>
                  <div className="flex gap-2">
                    {[0, 1, 2, 3].map(r => (
                      <button key={r} onClick={() => setRunOutRuns(r)}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold border ${runOutRuns === r ? 'bg-kdpl-neon text-kdpl-darker border-kdpl-neon' : 'bg-kdpl-darker border-kdpl-border text-kdpl-muted'}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div className="flex gap-3 sticky bottom-0 bg-kdpl-card pt-2">
              <button onClick={() => { setShowWicketModal(false); setRunOutBatter('striker'); setRunOutRuns(0); }}
                className="flex-1 py-3 rounded-xl border border-kdpl-border text-kdpl-muted text-sm">Cancel</button>
              <button onClick={() => handleBall(0, true)}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-sm">
                Confirm Wicket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
