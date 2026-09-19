// ═══════════════════════════════════════════════════════════════
// SERIES DETAIL — score line + matches for one series
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import type { KDPLStore } from '../../store/useKDPLStore';
import { computeSeriesResult } from '../../utils/series';
import { ArrowLeftIcon, PlusIcon, CalendarIcon } from '../ui/Icons';

const STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  live: 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  abandoned: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export default function SeriesDetailPage({ store }: { store: KDPLStore }) {
  const { state, navigate, setActiveFixture, addSeriesMatch, goBack } = store;
  const { series, fixtures, teams, venues, isAdmin, tournament, activeSeriesId } = state;

  const sr = series.find(s => s.id === activeSeriesId);
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [venueId, setVenueId] = useState(venues[0]?.id || '');
  const [overs, setOvers] = useState(tournament?.overs || 10);

  if (!sr) {
    return (
      <div className="p-4">
        <p className="text-kdpl-muted text-sm">Series not found.</p>
        <button onClick={() => navigate('series')} className="mt-2 text-kdpl-neon text-sm underline">← Back to Series</button>
      </div>
    );
  }

  const teamA = teams.find(t => t.id === sr.teamAId);
  const teamB = teams.find(t => t.id === sr.teamBId);
  const result = computeSeriesResult(sr, fixtures);

  const openMatch = (fixtureId: string, page: 'toss' | 'scorer' | 'scorecard' | 'live') => {
    setActiveFixture(fixtureId);
    navigate(page);
  };

  const handleAddMatch = () => {
    if (!date) return;
    addSeriesMatch(sr.id, date, venueId, overs);
    setShowAddMatch(false);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <button onClick={goBack} className="flex items-center gap-1 text-kdpl-muted text-xs w-fit">
        <ArrowLeftIcon size={14} /> Back
      </button>

      <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4 text-center">
        <div className="text-kdpl-text text-base font-bold mb-1">{sr.name}</div>
        <div className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mb-3 ${
          result.status === 'completed' ? 'bg-kdpl-neon/15 text-kdpl-neon' :
          result.status === 'live' ? 'bg-red-500/15 text-red-400' :
          'bg-kdpl-border text-kdpl-muted'
        }`}>{result.status}</div>
        <div className="flex items-center justify-center gap-4">
          <div className="flex-1 text-right">
            <div className="text-2xl mb-1">{teamA?.logo}</div>
            <div className="text-kdpl-text text-sm font-semibold">{teamA?.name}</div>
          </div>
          <div className="text-kdpl-neon text-2xl font-black px-3">{result.teamAWins} - {result.teamBWins}</div>
          <div className="flex-1 text-left">
            <div className="text-2xl mb-1">{teamB?.logo}</div>
            <div className="text-kdpl-text text-sm font-semibold">{teamB?.name}</div>
          </div>
        </div>
        {result.ties > 0 && <div className="text-kdpl-muted text-xs mt-2">{result.ties} tied match{result.ties > 1 ? 'es' : ''}</div>}
        <div className="text-kdpl-muted text-xs mt-2">
          {sr.seriesType === 'best-of' ? `Best of ${sr.totalMatches}` : `${sr.totalMatches}-match series`}
          {result.decided && result.winnerId && <span className="text-kdpl-neon font-semibold"> · {teams.find(t => t.id === result.winnerId)?.name} won the series</span>}
          {result.decided && !result.winnerId && <span> · Series drawn</span>}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-kdpl-text text-sm font-bold">Matches</h3>
        {isAdmin && !result.decided && result.remaining > 0 && (
          <button onClick={() => setShowAddMatch(true)}
            className="flex items-center gap-1 bg-kdpl-neon text-kdpl-darker px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95">
            <PlusIcon size={12} /> Add Match
          </button>
        )}
      </div>

      {result.matches.length === 0 && (
        <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-6 text-center">
          <p className="text-kdpl-muted text-sm">No matches added yet.</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {result.matches.map(f => (
          <div key={f.id} className="rounded-xl bg-kdpl-card border border-kdpl-border p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-kdpl-text text-xs font-semibold">Match {f.seriesMatchNumber}</span>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${STATUS_STYLES[f.status] || ''}`}>{f.status}</span>
            </div>
            <div className="flex items-center gap-1 text-kdpl-muted text-[10px] mb-2">
              <CalendarIcon size={10} /> {f.date} · {f.time}
            </div>
            {f.status === 'completed' && f.result && (
              <p className="text-kdpl-muted text-xs mb-2">
                {teams.find(t => t.id === f.result!.winnerId)?.name || 'Match tied'} {f.result.winnerId ? `won by ${f.result.margin}` : ''}
              </p>
            )}
            <div className="flex gap-2">
              {isAdmin && f.status === 'scheduled' && (
                <button onClick={() => openMatch(f.id, 'toss')} className="flex-1 py-1.5 text-xs rounded-lg bg-kdpl-neon/10 border border-kdpl-neon/20 text-kdpl-neon font-medium">🪙 Toss</button>
              )}
              {isAdmin && f.status === 'live' && (
                <button onClick={() => openMatch(f.id, 'scorer')} className="flex-1 py-1.5 text-xs rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 font-medium">🔴 Score</button>
              )}
              {!isAdmin && f.status === 'live' && (
                <button onClick={() => openMatch(f.id, 'live')} className="flex-1 py-1.5 text-xs rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 font-medium">🔴 Watch Live</button>
              )}
              {f.status === 'completed' && (
                <button onClick={() => openMatch(f.id, 'scorecard')} className="flex-1 py-1.5 text-xs rounded-lg bg-kdpl-card border border-kdpl-border text-kdpl-muted font-medium">📊 Scorecard</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAddMatch && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-kdpl-card border border-kdpl-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-4">
            <h3 className="text-kdpl-text text-sm font-bold mb-3">Add Match {result.matches.length + 1}</h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-kdpl-muted text-xs mb-1 block">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm outline-none" />
              </div>
              <div>
                <label className="text-kdpl-muted text-xs mb-1 block">Venue</label>
                <select value={venueId} onChange={e => setVenueId(e.target.value)}
                  className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm outline-none">
                  <option value="">— Select Venue —</option>
                  {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-kdpl-muted text-xs mb-1 block">Overs</label>
                <input type="number" min={1} value={overs} onChange={e => setOvers(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm outline-none" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowAddMatch(false)} className="flex-1 py-3 rounded-xl border border-kdpl-border text-kdpl-muted text-sm">Cancel</button>
              <button onClick={handleAddMatch} disabled={!date}
                className="flex-1 py-3 rounded-xl bg-kdpl-neon text-kdpl-darker text-sm font-bold disabled:opacity-50">Add Match</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
