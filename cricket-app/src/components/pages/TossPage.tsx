// ═══════════════════════════════════════════════════════════════
// KDPL TOSS ENGINE — 3D Coin flip with decision selector
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';

import type { KDPLStore } from '../../store/useKDPLStore';
import type { TossResult } from '../../types';
import { genId } from '../../utils/id';

const OVERS_PRESETS = [5, 6, 8, 10, 20, 50];

export default function TossPage({ store }: { store: KDPLStore }) {
  const { state, navigate, updateLiveMatch, updateFixture, setActiveFixture } = store;
  const { teams, fixtures, isAdmin, activeFixtureId, allLiveMatches } = state;

  // Only real, not-yet-started fixtures with both teams assigned can have a toss.
  // (Auto-generated knockout fixtures start as TBD-team placeholders until the
  // organizer assigns the actual qualifiers — those are excluded here.)
  const scheduledFixtures = fixtures.filter(f =>
    f.status === 'scheduled' && !f.teamAId.startsWith('TBD-') && !f.teamBId.startsWith('TBD-')
  );

  const preselected = scheduledFixtures.find(f => f.id === activeFixtureId) || null;
  const [selectedFixtureId, setSelectedFixtureId] = useState<string>(preselected?.id || '');
  const selectedFixture = scheduledFixtures.find(f => f.id === selectedFixtureId) || null;

  const [teamA, setTeamA] = useState(preselected?.teamAId || teams[0]?.id || '');
  const [teamB, setTeamB] = useState(preselected?.teamBId || teams[1]?.id || '');
  const [call, setCall] = useState<'Heads' | 'Tails'>('Heads');
  const [overs, setOvers] = useState(preselected?.overs || 10);
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<TossResult | null>(null);
  const [decision, setDecision] = useState<'Bat First' | 'Bowl First'>('Bat First');
  const [rotation, setRotation] = useState(0);

  const pickFixture = (id: string) => {
    setSelectedFixtureId(id);
    const f = scheduledFixtures.find(x => x.id === id);
    if (f) {
      setTeamA(f.teamAId);
      setTeamB(f.teamBId);
      setOvers(f.overs || 10);
    }
  };

  const tossHistory = fixtures.filter(f => f.toss).map(f => ({ ...f.toss!, matchId: f.id, matchNum: f.matchNumber }));

  // A live match already exists for this exact fixture (e.g. re-opened after
  // navigating away) — resume it instead of letting the organizer start a
  // duplicate that would silently orphan the first one.
  const existingLiveForFixture = selectedFixture
    ? allLiveMatches.find(lm => lm.fixtureId === selectedFixture.id && lm.status !== 'completed')
    : null;

  const flip = () => {
    if (!teamA || !teamB || teamA === teamB) return;
    setFlipping(true);
    setResult(null);
    const newRotation = rotation + 1800 + Math.floor(Math.random() * 360);
    setRotation(newRotation);

    setTimeout(() => {
      const coinResult: 'Heads' | 'Tails' = Math.random() > 0.5 ? 'Heads' : 'Tails';
      const winnerId = coinResult === call ? teamA : teamB;
      const toss: TossResult = { winner: winnerId, call, result: coinResult, decision };
      setResult(toss);
      setFlipping(false);
      if (navigator.vibrate) navigator.vibrate([100, 50, 200]);
    }, 1500);
  };

  const startMatch = () => {
    if (!result) return;
    const fixtureId = selectedFixture?.id || '';
    const newMatch = {
      id: genId('lm'),
      fixtureId,
      teamAId: teamA,
      teamBId: teamB,
      status: 'live' as const,
      currentInnings: 1 as const,
      overs,
      toss: result,
      lastOverBowlerId: '',
      innings1: {
        teamId: result.decision === 'Bat First' ? result.winner : (result.winner === teamA ? teamB : teamA),
        battingOrder: [],
        currentBatter1: '',
        currentBatter2: '',
        currentBowler: '',
        runs: 0, wickets: 0, overs: 0, balls: 0, extras: 0, target: 0,
        ballEvents: [],
        playerStats: {},
        bowlerStats: {},
        partnerships: [],
        fallOfWickets: [],
      },
      innings2: {
        teamId: result.decision === 'Bat First' ? (result.winner === teamA ? teamB : teamA) : result.winner,
        battingOrder: [],
        currentBatter1: '',
        currentBatter2: '',
        currentBowler: '',
        runs: 0, wickets: 0, overs: 0, balls: 0, extras: 0, target: 0,
        ballEvents: [],
        playerStats: {},
        bowlerStats: {},
        partnerships: [],
        fallOfWickets: [],
      },
      undoStack: [],
      startedAt: Date.now(),
      updatedAt: Date.now(),
    };
    if (selectedFixture) {
      updateFixture({ ...selectedFixture, toss: result, status: 'live' });
    }
    updateLiveMatch(newMatch);
    setActiveFixture(fixtureId || newMatch.id);
    navigate('scorer');
  };

  const resumeExisting = () => {
    if (!selectedFixture) return;
    setActiveFixture(selectedFixture.id);
    navigate('scorer');
  };

  const getTeam = (id: string) => teams.find(t => t.id === id);
  const winner = result ? getTeam(result.winner) : null;

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
        <h2 className="text-kdpl-text font-oswald font-bold text-xl">Toss Engine</h2>
        <p className="text-kdpl-muted text-xs">Coin flip for match start</p>
      </div>

      {/* Fixture Selection — picking a scheduled fixture locks the correct teams
          to it, so the live match always links back to the right match on the
          schedule (fixes matches silently going untracked / mismatched). */}
      <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4">
        <div className="text-kdpl-muted text-xs font-semibold uppercase tracking-wide mb-3">Select Match</div>
        {scheduledFixtures.length > 0 ? (
          <select value={selectedFixtureId} onChange={e => pickFixture(e.target.value)} disabled={!!result}
            className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm outline-none disabled:opacity-60">
            <option value="">— Custom match (not on schedule) —</option>
            {scheduledFixtures.map(f => {
              const ta = teams.find(t => t.id === f.teamAId);
              const tb = teams.find(t => t.id === f.teamBId);
              return <option key={f.id} value={f.id}>#{f.matchNumber} · {ta?.name || '?'} vs {tb?.name || '?'} · {f.date}</option>;
            })}
          </select>
        ) : (
          <p className="text-kdpl-muted text-xs">No scheduled fixtures — pick teams manually below, or add fixtures first.</p>
        )}
        {existingLiveForFixture && (
          <div className="mt-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-3 flex items-center justify-between gap-2">
            <p className="text-yellow-400 text-xs">This match is already live/in progress.</p>
            <button onClick={resumeExisting} className="px-3 py-1.5 rounded-lg bg-yellow-500 text-kdpl-darker text-xs font-bold flex-shrink-0">
              Resume →
            </button>
          </div>
        )}
      </div>

      {/* Team Selection */}
      <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-kdpl-muted text-xs font-semibold uppercase tracking-wide">Teams</div>
          {result && (
            <button onClick={() => { setResult(null); setRotation(0); }} className="text-kdpl-neon text-xs underline">
              Reset / New Toss
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-kdpl-muted text-xs mb-1 block">Team A</label>
            <select value={teamA} onChange={e => setTeamA(e.target.value)} disabled={!!result || !!selectedFixture}
              className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm outline-none disabled:opacity-60">
              {teams.map(t => <option key={t.id} value={t.id}>{t.logo} {t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-kdpl-muted text-xs mb-1 block">Team B</label>
            <select value={teamB} onChange={e => setTeamB(e.target.value)} disabled={!!result || !!selectedFixture}
              className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm outline-none disabled:opacity-60">
              {teams.filter(t => t.id !== teamA).map(t => <option key={t.id} value={t.id}>{t.logo} {t.name}</option>)}
            </select>
          </div>
        </div>
        {selectedFixture && <p className="text-kdpl-muted text-[10px] mt-2">Teams are locked to the selected fixture. Choose "Custom match" above to pick freely.</p>}
        {result && !selectedFixture && <p className="text-kdpl-muted text-[10px] mt-2">Teams are locked once the toss is flipped. Tap "Reset / New Toss" to change them.</p>}
      </div>

      {/* Overs Selection */}
      <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4">
        <div className="text-kdpl-muted text-xs font-semibold uppercase tracking-wide mb-3">Overs Format</div>
        <div className="flex gap-2 flex-wrap">
          {OVERS_PRESETS.map(o => (
            <button key={o} onClick={() => setOvers(o)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${overs === o ? 'bg-kdpl-neon text-kdpl-darker shadow-lg shadow-kdpl-neon/30' : 'bg-kdpl-darker border border-kdpl-border text-kdpl-muted hover:text-kdpl-text'}`}>
              {o === 10 ? 'T10' : o === 20 ? 'T20' : o === 50 ? 'ODI' : `${o} Ov`}
            </button>
          ))}
        </div>
      </div>

      {/* Coin flip area */}
      <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-6 flex flex-col items-center gap-5">
        {/* Coin */}
        <div className="relative" style={{ perspective: '600px' }}>
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-3xl shadow-xl transition-transform"
            style={{
              transform: `rotateY(${rotation}deg)`,
              transition: flipping ? 'transform 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              boxShadow: '0 0 30px rgba(251,191,36,0.4)',
            }}
          >
            {flipping ? '🪙' : result ? (result.result === 'Heads' ? '👑' : '🦅') : '🪙'}
          </div>
        </div>

        {/* Call selection */}
        <div>
          <div className="text-kdpl-muted text-xs text-center mb-2">Team A calls:</div>
          <div className="flex gap-3">
            {(['Heads', 'Tails'] as const).map(c => (
              <button key={c} onClick={() => setCall(c)}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${call === c ? 'bg-yellow-400 text-kdpl-darker shadow-lg' : 'bg-kdpl-darker border border-kdpl-border text-kdpl-muted'}`}>
                {c === 'Heads' ? '👑 Heads' : '🦅 Tails'}
              </button>
            ))}
          </div>
        </div>

        <button onClick={flip} disabled={flipping || !teamA || !teamB || teamA === teamB || !!existingLiveForFixture}
          className="w-full py-4 bg-kdpl-neon text-kdpl-darker rounded-2xl font-oswald font-bold text-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-kdpl-neon/30">
          {flipping ? '🪙 Flipping...' : '🪙 FLIP COIN'}
        </button>
      </div>

      {/* Result */}
      {result && !flipping && (
        <div className="rounded-2xl border-2 border-kdpl-neon/50 bg-kdpl-neon/5 p-5">
          <div className="text-center mb-4">
            <div className="text-3xl mb-2">{result.result === 'Heads' ? '👑' : '🦅'}</div>
            <div className="text-kdpl-neon font-oswald font-bold text-xl">{result.result.toUpperCase()}!</div>
            <div className="text-kdpl-text font-semibold text-base mt-1">
              {winner?.logo} {winner?.name} won the toss!
            </div>
            <div className="text-kdpl-muted text-sm">{getTeam(teamA)?.shortName} called {call}</div>
          </div>

          {/* Decision */}
          <div>
            <div className="text-kdpl-muted text-xs text-center mb-2">{winner?.name} elects to:</div>
            <div className="flex gap-3">
              {(['Bat First', 'Bowl First'] as const).map(d => (
                <button key={d} onClick={() => setDecision(d)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${decision === d ? 'bg-kdpl-neon text-kdpl-darker' : 'bg-kdpl-card border border-kdpl-border text-kdpl-muted'}`}>
                  {d === 'Bat First' ? '🏏 Bat First' : '🎳 Bowl First'}
                </button>
              ))}
            </div>
          </div>

          <button onClick={startMatch}
            className="w-full mt-4 py-3 bg-red-500 text-white rounded-xl font-bold text-sm active:scale-98 shadow-lg shadow-red-500/30">
            🔴 Start Match → Open Scorer
          </button>

          {/* Explicit, unambiguous confirmation of who bats/bowls first */}
          <div className="mt-3 rounded-xl bg-kdpl-darker border border-kdpl-border p-3 text-center">
            <div className="text-kdpl-muted text-[10px] uppercase tracking-wide mb-1">Confirm before starting</div>
            <div className="text-kdpl-text text-sm">
              🏏 <span className="font-bold text-kdpl-neon">
                {getTeam(decision === 'Bat First' ? result.winner : (result.winner === teamA ? teamB : teamA))?.name}
              </span> bats first
            </div>
            <div className="text-kdpl-text text-sm mt-0.5">
              🎳 <span className="font-bold">
                {getTeam(decision === 'Bat First' ? (result.winner === teamA ? teamB : teamA) : result.winner)?.name}
              </span> bowls first
            </div>
          </div>
        </div>
      )}

      {/* Toss History */}
      {tossHistory.length > 0 && (
        <div>
          <h3 className="text-kdpl-text font-oswald font-semibold text-sm uppercase tracking-wide mb-2">Toss History</h3>
          <div className="flex flex-col gap-2">
            {tossHistory.slice(0, 10).map((t, i) => (
              <div key={i} className="rounded-xl bg-kdpl-card border border-kdpl-border px-3 py-2.5 flex items-center justify-between">
                <div className="text-kdpl-muted text-xs">Match #{t.matchNum}</div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-kdpl-text font-medium">{getTeam(t.winner)?.shortName}</span>
                  <span className="text-kdpl-muted">won</span>
                  <span className="text-kdpl-neon font-medium">{t.result}</span>
                  <span className="text-kdpl-muted">→</span>
                  <span className="text-kdpl-text">{t.decision}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
