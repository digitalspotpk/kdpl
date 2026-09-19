// ═══════════════════════════════════════════════════════════════
// KDPL PLAYERS PAGE
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { PlusIcon, EditPenIcon, TrashIcon, SearchIcon, AwardIcon, LockIcon, UnlockIcon } from '../ui/Icons';
import type { KDPLStore } from '../../store/useKDPLStore';
import { genId } from '../../utils/id';
import type { Player, PlayerRole } from '../../types';

const ROLES: PlayerRole[] = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'];
const BATTING_STYLES = ['Right-hand Bat', 'Left-hand Bat'];
const BOWLING_STYLES = ['Right-arm Fast', 'Right-arm Medium', 'Right-arm Off-Spin', 'Right-arm Leg-Spin', 'Left-arm Fast', 'Left-arm Medium', 'Left-arm Spin', 'None'];
const ROLE_COLORS: Record<string, string> = { Batsman: 'bg-blue-500/20 text-blue-400 border-blue-500/30', Bowler: 'bg-red-500/20 text-red-400 border-red-500/30', 'All-Rounder': 'bg-green-500/20 text-green-400 border-green-500/30', 'Wicket-Keeper': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };

const EMPTY_FORM = { name: '', role: 'Batsman' as PlayerRole, teamId: '', battingStyle: 'Right-hand Bat', bowlingStyle: 'None', phone: '', city: '' };

export default function PlayersPage({ store }: { store: KDPLStore }) {
  const { state, addPlayer, updatePlayer, deletePlayer, banPlayer, unbanPlayer } = store;
  const { players, teams, isAdmin } = state;
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [teamFilter, setTeamFilter] = useState<string>('All');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Player | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [banTarget, setBanTarget] = useState<Player | null>(null);
  const [banReason, setBanReason] = useState('');

  const filtered = players.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'All' || p.role === roleFilter;
    const matchesTeam = teamFilter === 'All' || p.teamId === teamFilter;
    return matchesSearch && matchesRole && matchesTeam;
  });

  const resetForm = () => { setForm(EMPTY_FORM); setEditing(null); };

  const handleEdit = (player: Player) => {
    setEditing(player);
    setForm({ name: player.name, role: player.role, teamId: player.teamId, battingStyle: player.battingStyle, bowlingStyle: player.bowlingStyle, phone: '', city: '' });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editing) {
      updatePlayer({ ...editing, ...form });
    } else {
      const mvp = 0;
      addPlayer({
        id: genId('p'), name: form.name, role: form.role, teamId: form.teamId,
        photo: '', battingStyle: form.battingStyle, bowlingStyle: form.bowlingStyle,
        banned: false, banReason: '',
        matches: 0, runs: 0, balls: 0, fours: 0, sixes: 0, fifties: 0, hundreds: 0, highScore: 0,
        wickets: 0, oversBowled: 0, runsConceded: 0, catches: 0, stumpings: 0,
        mvpScore: mvp, tier: 'Bronze', createdAt: Date.now()
      });
    }
    setShowForm(false); resetForm();
  };

  const getTier = (mvp: number) => mvp >= 300 ? { label: 'Gold', color: 'text-yellow-400', bg: 'bg-yellow-400/10' } : mvp >= 150 ? { label: 'Silver', color: 'text-gray-300', bg: 'bg-gray-300/10' } : { label: 'Bronze', color: 'text-amber-600', bg: 'bg-amber-600/10' };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-kdpl-text font-oswald font-bold text-xl">Players</h2>
          <p className="text-kdpl-muted text-xs">{players.length} registered players</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setShowForm(true); resetForm(); }}
            className="flex items-center gap-2 bg-kdpl-neon text-kdpl-darker px-3 py-2 rounded-xl text-sm font-bold active:scale-95">
            <PlusIcon size={16} /> Add Player
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-kdpl-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-kdpl-card border border-kdpl-border rounded-xl pl-9 pr-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none"
            placeholder="Search players..." />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {['All', ...ROLES].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${roleFilter === r ? 'bg-kdpl-neon text-kdpl-darker font-semibold' : 'bg-kdpl-card text-kdpl-muted border border-kdpl-border'}`}>
              {r}
            </button>
          ))}
          <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)}
            className="flex-shrink-0 bg-kdpl-card border border-kdpl-border rounded-full px-3 py-1.5 text-xs text-kdpl-muted outline-none cursor-pointer">
            <option value="All">All Teams</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && isAdmin && (
        <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4">
          <h3 className="text-kdpl-text font-oswald font-bold mb-4">{editing ? 'Edit Player' : 'Register Player'}</h3>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-kdpl-muted text-xs mb-1 block">Full Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2 text-kdpl-text text-sm focus:border-kdpl-neon outline-none"
                placeholder="Muhammad Saleem" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-kdpl-muted text-xs mb-1 block">Role</label>
                <select value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value as PlayerRole}))}
                  className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2 text-kdpl-text text-sm outline-none">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-kdpl-muted text-xs mb-1 block">Team</label>
                <select value={form.teamId} onChange={e => setForm(f => ({...f, teamId: e.target.value}))}
                  className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2 text-kdpl-text text-sm outline-none">
                  <option value="">Unassigned</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-kdpl-muted text-xs mb-1 block">Batting Style</label>
                <select value={form.battingStyle} onChange={e => setForm(f => ({...f, battingStyle: e.target.value}))}
                  className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2 text-kdpl-text text-sm outline-none">
                  {BATTING_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-kdpl-muted text-xs mb-1 block">Bowling Style</label>
                <select value={form.bowlingStyle} onChange={e => setForm(f => ({...f, bowlingStyle: e.target.value}))}
                  className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2 text-kdpl-text text-sm outline-none">
                  {BOWLING_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-1">
              <button onClick={() => { setShowForm(false); resetForm(); }}
                className="flex-1 py-2.5 rounded-xl border border-kdpl-border text-kdpl-muted text-sm">Cancel</button>
              <button onClick={handleSave}
                className="flex-1 py-2.5 rounded-xl bg-kdpl-neon text-kdpl-darker font-bold text-sm">
                {editing ? 'Update' : 'Register'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Players List */}
      <div className="flex flex-col gap-3">
        {filtered.map(player => {
          const team = teams.find(t => t.id === player.teamId);
          const tier = getTier(player.mvpScore);
          const sr = player.balls > 0 ? ((player.runs / player.balls) * 100).toFixed(1) : '0.0';
          const eco = player.oversBowled > 0 ? (player.runsConceded / player.oversBowled).toFixed(2) : '0.00';
          return (
            <div key={player.id} className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-kdpl-darker border border-kdpl-border flex items-center justify-center text-2xl">
                    {player.role === 'Batsman' ? '🏏' : player.role === 'Bowler' ? '🎳' : player.role === 'Wicket-Keeper' ? '🧤' : '🌟'}
                  </div>
                  <div>
                    <h3 className="text-kdpl-text font-semibold text-sm flex items-center gap-1.5">
                      {player.name}
                      {player.banned && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold">BANNED</span>}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${ROLE_COLORS[player.role]}`}>{player.role}</span>
                      {team && <span className="text-[10px] text-kdpl-muted">{team.logo} {team.shortName}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${tier.bg} ${tier.color}`}>
                    <AwardIcon size={10} />
                    {tier.label}
                  </div>
                  {isAdmin && (
                    <>
                      <button onClick={() => handleEdit(player)} className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                        <EditPenIcon size={12} />
                      </button>
                      {player.banned ? (
                        <button onClick={() => unbanPlayer(player.id)} title="Unban player" className="w-7 h-7 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                          <UnlockIcon size={12} />
                        </button>
                      ) : (
                        <button onClick={() => { setBanTarget(player); setBanReason(''); }} title="Ban player" className="w-7 h-7 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
                          <LockIcon size={12} />
                        </button>
                      )}
                      <button onClick={() => deletePlayer(player.id)} className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                        <TrashIcon size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              {/* Stats grid */}
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: 'Runs', value: player.runs },
                  { label: 'Avg', value: player.matches > 0 ? (player.runs / player.matches).toFixed(1) : '0.0' },
                  { label: 'SR', value: sr },
                  { label: 'Wkts', value: player.wickets },
                  { label: 'HS', value: player.highScore },
                  { label: 'Eco', value: eco },
                  { label: '50s/100s', value: `${player.fifties}/${player.hundreds}` },
                  { label: 'MVP', value: player.mvpScore },
                ].map(s => (
                  <div key={s.label} className="bg-kdpl-darker/50 rounded-lg p-1.5 text-center">
                    <div className="text-kdpl-text font-oswald font-bold text-xs">{s.value}</div>
                    <div className="text-kdpl-muted text-[9px]">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-kdpl-muted">
            <p className="text-sm">No players found</p>
          </div>
        )}
      </div>

      {/* Ban confirmation */}
      {banTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-kdpl-card border border-kdpl-border rounded-2xl p-5">
            <h3 className="text-kdpl-text font-oswald font-bold text-base mb-1">Ban {banTarget.name}?</h3>
            <p className="text-kdpl-muted text-xs mb-3">Banned players can't be selected for squads, toss, or scoring until unbanned.</p>
            <textarea value={banReason} onChange={e => setBanReason(e.target.value)}
              placeholder="Reason for ban (optional)"
              rows={3}
              className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2 text-kdpl-text text-sm outline-none mb-3" />
            <div className="flex gap-3">
              <button onClick={() => setBanTarget(null)} className="flex-1 py-2.5 rounded-xl border border-kdpl-border text-kdpl-muted text-sm">Cancel</button>
              <button onClick={() => { banPlayer(banTarget.id, banReason); setBanTarget(null); }}
                className="flex-1 py-2.5 rounded-xl bg-yellow-500 text-kdpl-darker font-bold text-sm">Ban Player</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
