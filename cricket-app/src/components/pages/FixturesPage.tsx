// ═══════════════════════════════════════════════════════════════
// KDPL FIXTURES PAGE
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import { PlusIcon, CalendarIcon, MapPinIcon, TrashIcon, EditPenIcon, ImageIcon } from '../ui/Icons';
import type { KDPLStore } from '../../store/useKDPLStore';
import { genId } from '../../utils/id';
import type { Fixture, FixtureUmpire } from '../../types';
import AdSlotRenderer from '../ui/AdSlotRenderer';
import FixturePosterModal from '../modals/FixturePosterModal';

const STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  live: 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  abandoned: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const OVERS_PRESETS = [5, 6, 8, 10, 20, 50];

export default function FixturesPage({ store }: { store: KDPLStore }) {
  const { state, addFixture, updateFixture, deleteFixture, navigate, generateFixtures, awardWalkover, cancelFixture, setActiveFixture } = store;
  const { fixtures, teams, venues, players, isAdmin, adSlots, tournament } = state;  const [filter, setFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Fixture | null>(null);
  const [posterFixture, setPosterFixture] = useState<Fixture | null>(null);
  const [walkoverFixture, setWalkoverFixture] = useState<Fixture | null>(null);
  const [form, setForm] = useState({
    teamAId: '', teamBId: '', venueId: '', date: '', time: '14:00', slot: 'Day' as 'Day' | 'Night', overs: tournament?.overs || 10,
    stage: 'group' as Fixture['stage'],
  });
  const [umpires, setUmpires] = useState<FixtureUmpire[]>([]);
  const [umpireForm, setUmpireForm] = useState({ name: '', city: '' });

  const getTeam = (id: string) => teams.find(t => t.id === id);
  const getVenue = (id: string) => venues.find(v => v.id === id);

  const filtered = filter === 'all' ? fixtures : fixtures.filter(f => f.status === filter);
  const byRound: Record<number, Fixture[]> = {};
  filtered.forEach(f => { if (!byRound[f.round]) byRound[f.round] = []; byRound[f.round].push(f); });

  const stageLabel = (f: Fixture) => f.stage && f.stage !== 'group'
    ? ({ 'quarter-final': 'Quarter Final', 'semi-final': 'Semi Final', 'final': 'Final' } as const)[f.stage]
    : `Round ${f.round}`;

  const addUmpire = () => {
    if (!umpireForm.name.trim()) return;
    setUmpires(u => [...u, { id: genId('ump'), ...umpireForm }]);
    setUmpireForm({ name: '', city: '' });
  };
  const removeUmpire = (id: string) => setUmpires(u => u.filter(x => x.id !== id));

  const handleAutoGen = () => {
    if (tournament?.format === 'Double-Elimination') {
      alert('Double-elimination brackets aren\'t auto-generated yet — please add these fixtures manually for now.');
      return;
    }
    generateFixtures();
  };

  const handleSave = () => {
    if (!form.teamAId || !form.teamBId || form.teamAId === form.teamBId) return;
    const base = { tournamentId: tournament?.id || '', round: 1, matchNumber: fixtures.length + 1, status: 'scheduled' as const, createdAt: Date.now() };
    if (editing) {
      updateFixture({ ...editing, ...form, umpires });
    } else {
      addFixture({ id: genId('f'), ...base, ...form, umpires });
    }
    setShowForm(false); setEditing(null); setUmpires([]);
  };

  const handleEdit = (f: Fixture) => {
    setEditing(f);
    setForm({ teamAId: f.teamAId, teamBId: f.teamBId, venueId: f.venueId, date: f.date, time: f.time, slot: f.slot, overs: f.overs, stage: f.stage || 'group' });
    setUmpires(f.umpires || []);
    setShowForm(true);
  };

  // Memoized so the poster doesn't get a new array reference (and re-draw) on every render
  const posterPlayersA = useMemo(
    () => posterFixture ? players.filter(p => p.teamId === posterFixture.teamAId) : [],
    [players, posterFixture?.teamAId]
  );
  const posterPlayersB = useMemo(
    () => posterFixture ? players.filter(p => p.teamId === posterFixture.teamBId) : [],
    [players, posterFixture?.teamBId]
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <AdSlotRenderer slot={adSlots.find(a => a.position === 'fixtures-top')} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-kdpl-text font-oswald font-bold text-xl">Fixtures</h2>
          <p className="text-kdpl-muted text-xs">{fixtures.length} total matches</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={handleAutoGen}
              className="flex items-center gap-1 bg-kdpl-card border border-kdpl-border text-kdpl-muted px-2.5 py-2 rounded-xl text-xs active:scale-95">
              Auto-Gen
            </button>
            <button onClick={() => { setShowForm(true); setEditing(null); setUmpires([]); }}
              className="flex items-center gap-2 bg-kdpl-neon text-kdpl-darker px-3 py-2 rounded-xl text-sm font-bold active:scale-95">
              <PlusIcon size={16} /> Add
            </button>
          </div>
        )}
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {['all', 'scheduled', 'live', 'completed'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all capitalize ${filter === s ? 'bg-kdpl-neon text-kdpl-darker font-semibold' : 'bg-kdpl-card text-kdpl-muted border border-kdpl-border'}`}>
            {s === 'all' ? `All (${fixtures.length})` : s}
          </button>
        ))}
      </div>

      {/* Add/Edit Form */}
      {showForm && isAdmin && (
        <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4">
          <h3 className="text-kdpl-text font-oswald font-bold mb-4">{editing ? 'Edit Match' : 'Schedule Match'}</h3>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-kdpl-muted text-xs mb-1 block">Stage</label>
              <select value={form.stage} onChange={e => setForm(f => ({...f, stage: e.target.value as Fixture['stage']}))}
                className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2 text-kdpl-text text-sm outline-none">
                <option value="group">Group Stage</option>
                <option value="quarter-final">Quarter Final</option>
                <option value="semi-final">Semi Final</option>
                <option value="final">Final</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-kdpl-muted text-xs mb-1 block">Team A</label>
                <select value={form.teamAId} onChange={e => setForm(f => ({...f, teamAId: e.target.value}))}
                  className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2 text-kdpl-text text-sm outline-none">
                  <option value="">Select Team (or leave as TBD)</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.logo} {t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-kdpl-muted text-xs mb-1 block">Team B</label>
                <select value={form.teamBId} onChange={e => setForm(f => ({...f, teamBId: e.target.value}))}
                  className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2 text-kdpl-text text-sm outline-none">
                  <option value="">Select Team (or leave as TBD)</option>
                  {teams.filter(t => t.id !== form.teamAId).map(t => <option key={t.id} value={t.id}>{t.logo} {t.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-kdpl-muted text-xs mb-1 block">Venue</label>
              <select value={form.venueId} onChange={e => setForm(f => ({...f, venueId: e.target.value}))}
                className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2 text-kdpl-text text-sm outline-none">
                <option value="">Select Venue</option>
                {venues.map(v => <option key={v.id} value={v.id}>{v.name}, {v.city}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-kdpl-muted text-xs mb-1 block">Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))}
                  className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2 text-kdpl-text text-sm outline-none" />
              </div>
              <div>
                <label className="text-kdpl-muted text-xs mb-1 block">Time</label>
                <input type="time" value={form.time} onChange={e => setForm(f => ({...f, time: e.target.value}))}
                  className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2 text-kdpl-text text-sm outline-none" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <label className="text-kdpl-muted text-xs mb-1 block">Slot</label>
                <div className="flex gap-2">
                  {(['Day', 'Night'] as const).map(s => (
                    <button key={s} onClick={() => setForm(f => ({...f, slot: s}))}
                      className={`px-3 py-1.5 rounded-lg text-xs border ${form.slot === s ? 'bg-kdpl-neon text-kdpl-darker border-kdpl-neon' : 'bg-kdpl-darker border-kdpl-border text-kdpl-muted'}`}>
                      {s === 'Day' ? '☀️' : '🌙'} {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <label className="text-kdpl-muted text-xs mb-1 block">Overs</label>
                <div className="flex gap-1 flex-wrap">
                  {OVERS_PRESETS.map(o => (
                    <button key={o} onClick={() => setForm(f => ({...f, overs: o}))}
                      className={`px-2 py-1 rounded-lg text-xs border ${form.overs === o ? 'bg-kdpl-neon text-kdpl-darker border-kdpl-neon' : 'bg-kdpl-darker border-kdpl-border text-kdpl-muted'}`}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Umpires */}
            <div>
              <label className="text-kdpl-muted text-xs mb-1 block">Umpires</label>
              <div className="flex gap-2 mb-2">
                <input value={umpireForm.name} onChange={e => setUmpireForm(f => ({...f, name: e.target.value}))}
                  placeholder="Umpire name"
                  className="flex-1 bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2 text-kdpl-text text-sm focus:border-kdpl-neon outline-none" />
                <input value={umpireForm.city} onChange={e => setUmpireForm(f => ({...f, city: e.target.value}))}
                  placeholder="City/Village"
                  className="flex-1 bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2 text-kdpl-text text-sm focus:border-kdpl-neon outline-none" />
                <button onClick={addUmpire} className="px-3 rounded-xl bg-kdpl-neon text-kdpl-darker flex items-center justify-center flex-shrink-0">
                  <PlusIcon size={14} />
                </button>
              </div>
              {umpires.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {umpires.map(u => (
                    <div key={u.id} className="flex items-center justify-between bg-kdpl-darker border border-kdpl-border rounded-lg px-3 py-1.5">
                      <span className="text-kdpl-text text-xs">🏏 {u.name}{u.city ? ` · ${u.city}` : ''}</span>
                      <button onClick={() => removeUmpire(u.id)} className="text-red-400"><TrashIcon size={11} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-1">
              <button onClick={() => { setShowForm(false); setEditing(null); }}
                className="flex-1 py-2.5 rounded-xl border border-kdpl-border text-kdpl-muted text-sm">Cancel</button>
              <button onClick={handleSave}
                className="flex-1 py-2.5 rounded-xl bg-kdpl-neon text-kdpl-darker font-bold text-sm">{editing ? 'Update' : 'Schedule'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Fixtures by Round */}
      {Object.keys(byRound).sort((a, b) => Number(a) - Number(b)).map(round => {
        const roundFixtures = byRound[Number(round)];
        const headerLabel = stageLabel(roundFixtures[0]);
        return (
        <div key={round}>
          <h3 className="text-kdpl-muted text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
            <span className="w-5 h-5 bg-kdpl-neon/20 border border-kdpl-neon/30 rounded text-kdpl-neon text-[10px] flex items-center justify-center">{round}</span>
            {headerLabel}
          </h3>
          <div className="flex flex-col gap-2">
            {roundFixtures.map(fixture => {
              const ta = getTeam(fixture.teamAId);
              const tb = getTeam(fixture.teamBId);
              const venue = getVenue(fixture.venueId);
              return (
                <div key={fixture.id} className="rounded-2xl bg-kdpl-card border border-kdpl-border overflow-hidden">
                  {/* Status bar */}
                  <div className={`h-1 ${fixture.status === 'live' ? 'bg-red-500' : fixture.status === 'completed' ? 'bg-kdpl-neon' : 'bg-kdpl-border'}`} />
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[fixture.status]}`}>
                        {fixture.status === 'live' ? '🔴 LIVE' : fixture.status.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-1 text-kdpl-muted text-[10px]">
                        <span>M#{fixture.matchNumber}</span>
                        <span>·</span>
                        <span>{fixture.overs} Ov</span>
                        <span>·</span>
                        <span>{fixture.slot === 'Day' ? '☀️' : '🌙'}</span>
                      </div>
                    </div>

                    {/* Teams */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xl">{ta?.logo || '⏳'}</span>
                        <div>
                          <div className={`text-sm font-oswald font-bold ${fixture.result?.winnerId === fixture.teamAId ? 'text-kdpl-neon' : 'text-kdpl-text'}`}>{ta?.shortName || 'TBD'}</div>
                          {fixture.result && <div className="text-kdpl-neon font-bold text-sm font-oswald">{fixture.result.teamAScore}</div>}
                        </div>
                      </div>
                      <div className="px-3">
                        <span className="text-kdpl-muted text-xs font-bold">vs</span>
                      </div>
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <div className="text-right">
                          <div className={`text-sm font-oswald font-bold ${fixture.result?.winnerId === fixture.teamBId ? 'text-kdpl-neon' : 'text-kdpl-text'}`}>{tb?.shortName || 'TBD'}</div>
                          {fixture.result && <div className="text-kdpl-neon font-bold text-sm font-oswald">{fixture.result.teamBScore}</div>}
                        </div>
                        <span className="text-xl">{tb?.logo || '⏳'}</span>
                      </div>
                    </div>

                    {/* Result */}
                    {fixture.result && (
                      <div className="text-center text-kdpl-neon text-xs font-medium bg-kdpl-neon/5 rounded-lg py-1 mb-2">
                        {teams.find(t => t.id === fixture.result?.winnerId)?.name} won by {fixture.result.margin}
                      </div>
                    )}

                    {/* Meta */}
                    <div className="flex items-center justify-between text-[10px] text-kdpl-muted">
                      <div className="flex items-center gap-1">
                        <CalendarIcon size={10} />
                        <span>{fixture.date} {fixture.time}</span>
                      </div>
                      {venue && (
                        <div className="flex items-center gap-1">
                          <MapPinIcon size={10} />
                          <span>{venue.name}</span>
                        </div>
                      )}
                    </div>
                    {fixture.umpires && fixture.umpires.length > 0 && (
                      <div className="text-[10px] text-kdpl-muted mt-1">
                        🏏 Umpires: {fixture.umpires.map(u => `${u.name}${u.city ? ` (${u.city})` : ''}`).join(', ')}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-2.5 pt-2.5 border-t border-kdpl-border/50">
                      <button onClick={() => setPosterFixture(fixture)}
                        className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
                        <ImageIcon size={12} />
                      </button>
                      {isAdmin && fixture.status === 'scheduled' && (
                        <>
                          <button onClick={() => { setActiveFixture(fixture.id); navigate('toss'); }}
                            className="flex-1 py-1.5 text-xs rounded-lg bg-kdpl-neon/10 border border-kdpl-neon/20 text-kdpl-neon font-medium">
                            🪙 Toss
                          </button>
                          <button onClick={() => setWalkoverFixture(fixture)}
                            className="flex-1 py-1.5 text-xs rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-medium">
                            🚩 Walkover
                          </button>
                          <button onClick={() => cancelFixture(fixture.id)}
                            className="px-2.5 py-1.5 text-xs rounded-lg bg-kdpl-card border border-kdpl-border text-kdpl-muted font-medium">
                            Cancel
                          </button>
                        </>
                      )}
                      {isAdmin && fixture.status === 'live' && (
                        <button onClick={() => { setActiveFixture(fixture.id); navigate('scorer'); }}
                          className="flex-1 py-1.5 text-xs rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 font-medium">
                          🔴 Score
                        </button>
                      )}
                      {isAdmin && fixture.status === 'completed' && (
                        <button onClick={() => { setActiveFixture(fixture.id); navigate('scorecard'); }}
                          className="flex-1 py-1.5 text-xs rounded-lg bg-kdpl-card border border-kdpl-border text-kdpl-muted font-medium">
                          📊 Scorecard
                        </button>
                      )}
                      {isAdmin && (
                        <>
                          <button onClick={() => handleEdit(fixture)}
                            className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                            <EditPenIcon size={12} />
                          </button>
                          <button onClick={() => deleteFixture(fixture.id)}
                            className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">
                            <TrashIcon size={12} />
                          </button>
                        </>
                      )}
                      {!isAdmin && fixture.status === 'live' && (
                        <button onClick={() => { setActiveFixture(fixture.id); navigate('live'); }}
                          className="flex-1 py-1.5 text-xs rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 font-medium">
                          🔴 Watch Live
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        );
      })}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-kdpl-muted">
          <CalendarIcon size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No fixtures found</p>
          {isAdmin && <button onClick={handleAutoGen} className="mt-3 text-kdpl-neon text-sm underline">Auto-generate fixtures</button>}
        </div>
      )}

      {posterFixture && (
        <FixturePosterModal
          fixture={posterFixture}
          teamA={getTeam(posterFixture.teamAId)}
          teamB={getTeam(posterFixture.teamBId)}
          venue={getVenue(posterFixture.venueId)}
          tournament={tournament}
          playersA={posterPlayersA}
          playersB={posterPlayersB}
          onClose={() => setPosterFixture(null)}
        />
      )}

      {walkoverFixture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-kdpl-card border border-kdpl-border rounded-2xl p-5">
            <h3 className="text-kdpl-text font-oswald font-bold text-base mb-1">Award Walkover</h3>
            <p className="text-kdpl-muted text-xs mb-4">Pick which team gets the win because the other didn't show up. No runs are recorded — this just finalizes the result.</p>
            <div className="flex flex-col gap-2 mb-2">
              <button onClick={() => { awardWalkover(walkoverFixture.id, walkoverFixture.teamAId); setWalkoverFixture(null); }}
                className="w-full py-3 rounded-xl bg-kdpl-darker border border-kdpl-border text-kdpl-text text-sm font-semibold text-left px-4">
                {getTeam(walkoverFixture.teamAId)?.logo} {getTeam(walkoverFixture.teamAId)?.name} wins by walkover
              </button>
              <button onClick={() => { awardWalkover(walkoverFixture.id, walkoverFixture.teamBId); setWalkoverFixture(null); }}
                className="w-full py-3 rounded-xl bg-kdpl-darker border border-kdpl-border text-kdpl-text text-sm font-semibold text-left px-4">
                {getTeam(walkoverFixture.teamBId)?.logo} {getTeam(walkoverFixture.teamBId)?.name} wins by walkover
              </button>
            </div>
            <button onClick={() => setWalkoverFixture(null)} className="w-full py-2.5 rounded-xl border border-kdpl-border text-kdpl-muted text-sm mt-1">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
