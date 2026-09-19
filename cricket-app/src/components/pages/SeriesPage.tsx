// ═══════════════════════════════════════════════════════════════
// SERIES — groups several matches between two teams into one
// head-to-head contest (e.g. "3-match T20 Series"), tracked and
// decided separately from the tournament's points table.
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import type { KDPLStore } from '../../store/useKDPLStore';
import type { Series } from '../../types';
import { computeSeriesResult } from '../../utils/series';
import { TrophyIcon, PlusIcon, TrashIcon, EditPenIcon } from '../ui/Icons';

export default function SeriesPage({ store }: { store: KDPLStore }) {
  const { state, createSeries, updateSeries, deleteSeries, navigate, setActiveSeries } = store;
  const { series, teams, fixtures, isAdmin } = state;

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Series | null>(null);
  const [name, setName] = useState('');
  const [teamAId, setTeamAId] = useState(teams[0]?.id || '');
  const [teamBId, setTeamBId] = useState(teams[1]?.id || '');
  const [totalMatches, setTotalMatches] = useState(3);
  const [seriesType, setSeriesType] = useState<'best-of' | 'fixed'>('best-of');

  const openCreate = () => {
    setEditing(null);
    setName('');
    setTeamAId(teams[0]?.id || '');
    setTeamBId(teams[1]?.id || '');
    setTotalMatches(3);
    setSeriesType('best-of');
    setShowForm(true);
  };

  const openEdit = (sr: Series) => {
    setEditing(sr);
    setName(sr.name);
    setTeamAId(sr.teamAId);
    setTeamBId(sr.teamBId);
    setTotalMatches(sr.totalMatches);
    setSeriesType(sr.seriesType);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!teamAId || !teamBId || teamAId === teamBId || totalMatches < 1) return;
    const teamA = teams.find(t => t.id === teamAId);
    const teamB = teams.find(t => t.id === teamBId);
    const finalName = name.trim() || `${teamA?.name || 'Team A'} vs ${teamB?.name || 'Team B'} Series`;
    if (editing) {
      updateSeries({ ...editing, name: finalName, teamAId, teamBId, totalMatches, seriesType });
    } else {
      createSeries({ name: finalName, teamAId, teamBId, totalMatches, seriesType });
    }
    setShowForm(false);
  };

  const openSeries = (sr: Series) => {
    setActiveSeries(sr.id);
    navigate('series-detail');
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-kdpl-text text-base font-bold flex items-center gap-2">
          <TrophyIcon size={18} className="text-kdpl-neon" /> Series
        </h2>
        {isAdmin && (
          <button onClick={openCreate}
            className="flex items-center gap-1 bg-kdpl-neon text-kdpl-darker px-3 py-2 rounded-xl text-xs font-bold active:scale-95">
            <PlusIcon size={14} /> New Series
          </button>
        )}
      </div>

      {series.length === 0 && (
        <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-6 text-center">
          <p className="text-kdpl-muted text-sm">No series yet. A series groups several matches between two teams (e.g. "3-match T20 Series") with its own running score, separate from the points table.</p>
          {isAdmin && <button onClick={openCreate} className="mt-3 text-kdpl-neon text-sm underline">Create a series</button>}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {series.map(sr => {
          const teamA = teams.find(t => t.id === sr.teamAId);
          const teamB = teams.find(t => t.id === sr.teamBId);
          const result = computeSeriesResult(sr, fixtures);
          return (
            <div key={sr.id} onClick={() => openSeries(sr)}
              className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4 cursor-pointer active:scale-[0.99] transition-transform">
              <div className="flex items-center justify-between mb-2">
                <span className="text-kdpl-text text-sm font-semibold">{sr.name}</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  result.status === 'completed' ? 'bg-kdpl-neon/15 text-kdpl-neon' :
                  result.status === 'live' ? 'bg-red-500/15 text-red-400' :
                  'bg-kdpl-border text-kdpl-muted'
                }`}>{result.status}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-kdpl-muted mb-2">
                <span>{teamA?.logo} {teamA?.name}</span>
                <span className="text-kdpl-text font-bold">{result.teamAWins} - {result.teamBWins}{result.ties > 0 ? ` (${result.ties} tie)` : ''}</span>
                <span>{teamB?.name} {teamB?.logo}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-kdpl-muted text-[10px]">
                  {sr.seriesType === 'best-of' ? `Best of ${sr.totalMatches}` : `${sr.totalMatches}-match series`}
                  {result.decided && result.winnerId && ` · ${teams.find(t => t.id === result.winnerId)?.name} won`}
                </span>
                {isAdmin && (
                  <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(sr)} className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <EditPenIcon size={11} />
                    </button>
                    <button onClick={() => { if (confirm('Delete this series? Its matches will stay on the fixtures list, just unlinked from the series.')) deleteSeries(sr.id); }}
                      className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                      <TrashIcon size={11} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-kdpl-card border border-kdpl-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-4 max-h-[85vh] overflow-y-auto">
            <h3 className="text-kdpl-text text-sm font-bold mb-3">{editing ? 'Edit Series' : 'New Series'}</h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-kdpl-muted text-xs mb-1 block">Series Name (optional)</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. 3-Match T20 Series"
                  className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-kdpl-muted text-xs mb-1 block">Team A</label>
                  <select value={teamAId} onChange={e => setTeamAId(e.target.value)}
                    className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm outline-none">
                    {teams.map(t => <option key={t.id} value={t.id}>{t.logo} {t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-kdpl-muted text-xs mb-1 block">Team B</label>
                  <select value={teamBId} onChange={e => setTeamBId(e.target.value)}
                    className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm outline-none">
                    {teams.filter(t => t.id !== teamAId).map(t => <option key={t.id} value={t.id}>{t.logo} {t.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-kdpl-muted text-xs mb-1 block">Total Matches</label>
                  <input type="number" min={1} value={totalMatches} onChange={e => setTotalMatches(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm outline-none" />
                </div>
                <div>
                  <label className="text-kdpl-muted text-xs mb-1 block">Type</label>
                  <select value={seriesType} onChange={e => setSeriesType(e.target.value as 'best-of' | 'fixed')}
                    className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm outline-none">
                    <option value="best-of">Best-of (ends early once decided)</option>
                    <option value="fixed">Fixed (all matches always played)</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-kdpl-border text-kdpl-muted text-sm">Cancel</button>
              <button onClick={handleSave} disabled={!teamAId || !teamBId || teamAId === teamBId}
                className="flex-1 py-3 rounded-xl bg-kdpl-neon text-kdpl-darker text-sm font-bold disabled:opacity-50">
                {editing ? 'Save Changes' : 'Create Series'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
