// ═══════════════════════════════════════════════════════════════
// KDPL TEAMS MANAGEMENT PAGE
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { PlusIcon, EditPenIcon, TrashIcon, UsersIcon, TrophyIcon, XIcon } from '../ui/Icons';
import type { KDPLStore } from '../../store/useKDPLStore';
import { genId } from '../../utils/id';
import type { Team } from '../../types';

const COLORS = [
  '#00ff66','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#f97316',
  '#14b8a6','#a855f7','#eab308','#22c55e','#0ea5e9','#f43f5e','#84cc16','#6366f1',
  '#d946ef','#fb7185','#2dd4bf','#facc15','#4ade80','#60a5fa','#c084fc','#fb923c',
];
const EMOJIS = [
  '👑','⚔️','⚡','🦅','🔥','🐉','🦁','🌟','🏆','💎',
  '🐯','🦂','🐺','🦈','🐍','🦇','🦄','🐅','🦖','🐆',
  '🛡️','⚓','🏹','🗡️','💥','🌪️','☄️','🎯','🔱','🪓',
];

// Deterministic "auto-generate" so the same team name always gets the same
// look — lets an organizer add 50-100 teams without hand-picking each one.
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function autoGenerateIdentity(name: string, shortName: string) {
  const key = (shortName || name || 'TM').trim();
  const h = hashString(key);
  const color = COLORS[h % COLORS.length];
  const emoji = EMOJIS[h % EMOJIS.length];
  return { color, logo: emoji };
}

function teamInitials(name: string, shortName: string): string {
  const src = (shortName || name || 'TM').trim();
  return src.slice(0, 2).toUpperCase();
}

export default function TeamsPage({ store }: { store: KDPLStore }) {
  const { state, addTeam, updateTeam, deleteTeam, navigate } = store;
  const { teams, players, isAdmin } = state;
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [form, setForm] = useState({ name: '', shortName: '', city: '', captain: '', color: COLORS[0], logo: '', logoImageUrl: '' });
  const [sponsors, setSponsors] = useState<string[]>([]);
  const [sponsorInput, setSponsorInput] = useState('');

  const resetForm = () => { setForm({ name: '', shortName: '', city: '', captain: '', color: COLORS[Math.floor(Math.random() * COLORS.length)], logo: '', logoImageUrl: '' }); setSponsors([]); setSponsorInput(''); setEditing(null); };

  const handleEdit = (team: Team) => {
    setEditing(team);
    setForm({ name: team.name, shortName: team.shortName, city: team.city, captain: team.captain, color: team.color, logo: team.logo, logoImageUrl: team.logoImageUrl || '' });
    setSponsors(team.sponsors || []);
    setShowForm(true);
  };

  const handleAutoGenerate = () => {
    const { color, logo } = autoGenerateIdentity(form.name, form.shortName);
    setForm(f => ({ ...f, color, logo }));
  };

  const addSponsor = () => {
    if (!sponsorInput.trim()) return;
    setSponsors(s => [...s, sponsorInput.trim()]);
    setSponsorInput('');
  };

  const removeSponsor = (i: number) => setSponsors(s => s.filter((_, idx) => idx !== i));

  const handleSave = () => {
    if (!form.name.trim()) return;
    // Never save a blank logo — every team needs a unique-looking badge,
    // even if the organizer skipped picking one manually.
    const finalLogo = form.logo || teamInitials(form.name, form.shortName);
    const teamData = { ...form, logo: finalLogo, sponsors };
    if (editing) {
      updateTeam({ ...editing, ...teamData });
    } else {
      addTeam({
        id: genId('t'), ...teamData, wins: 0, losses: 0, ties: 0, nrr: 0, points: 0, matchesPlayed: 0,
        nrrRunsFor: 0, nrrOversFor: 0, nrrRunsAgainst: 0, nrrOversAgainst: 0, createdAt: Date.now()
      });
    }
    setShowForm(false); resetForm();
  };

  const getTeamPlayers = (teamId: string) => players.filter(p => p.teamId === teamId).length;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-kdpl-text font-oswald font-bold text-xl">Teams</h2>
          <p className="text-kdpl-muted text-xs">{teams.length} registered teams</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setShowForm(true); resetForm(); }}
            className="flex items-center gap-2 bg-kdpl-neon text-kdpl-darker px-3 py-2 rounded-xl text-sm font-bold transition-all active:scale-95">
            <PlusIcon size={16} /> Add Team
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && isAdmin && (
        <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4">
          <h3 className="text-kdpl-text font-oswald font-bold mb-4">{editing ? 'Edit Team' : 'New Team'}</h3>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-kdpl-muted text-xs mb-1 block">Team Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                  className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2 text-kdpl-text text-sm focus:border-kdpl-neon outline-none"
                  placeholder="KD Fighters" />
              </div>
              <div>
                <label className="text-kdpl-muted text-xs mb-1 block">Short Name</label>
                <input value={form.shortName} onChange={e => setForm(f => ({...f, shortName: e.target.value.toUpperCase().slice(0,4)}))}
                  className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2 text-kdpl-text text-sm focus:border-kdpl-neon outline-none"
                  placeholder="KDF" maxLength={4} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-kdpl-muted text-xs mb-1 block">City</label>
                <input value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))}
                  className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2 text-kdpl-text text-sm focus:border-kdpl-neon outline-none"
                  placeholder="Khoi Dara" />
              </div>
              <div>
                <label className="text-kdpl-muted text-xs mb-1 block">Captain</label>
                <input value={form.captain} onChange={e => setForm(f => ({...f, captain: e.target.value}))}
                  className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2 text-kdpl-text text-sm focus:border-kdpl-neon outline-none"
                  placeholder="Muhammad Saleem" />
              </div>
            </div>

            {/* Sponsors — multiple allowed */}
            <div>
              <label className="text-kdpl-muted text-xs mb-1 block">Sponsors</label>
              <div className="flex gap-2 mb-2">
                <input value={sponsorInput} onChange={e => setSponsorInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSponsor()}
                  placeholder="Sponsor name"
                  className="flex-1 bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2 text-kdpl-text text-sm focus:border-kdpl-neon outline-none" />
                <button onClick={addSponsor} className="px-4 rounded-xl bg-kdpl-neon text-kdpl-darker flex items-center justify-center flex-shrink-0">
                  <PlusIcon size={14} />
                </button>
              </div>
              {sponsors.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {sponsors.map((sp, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-kdpl-darker border border-kdpl-border rounded-lg px-2.5 py-1">
                      <span className="text-kdpl-text text-xs">{sp}</span>
                      <button onClick={() => removeSponsor(i)} className="text-red-400"><XIcon size={10} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Avatar — optional real photo instead of emoji/initials */}
            <div>
              <label className="text-kdpl-muted text-xs mb-1 block">Custom Avatar (Image URL, optional)</label>
              <input value={form.logoImageUrl} onChange={e => setForm(f => ({...f, logoImageUrl: e.target.value}))}
                placeholder="https://... (link to a team photo/crest)"
                className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2 text-kdpl-text text-sm focus:border-kdpl-neon outline-none" />
              <p className="text-kdpl-muted text-[10px] mt-1">Paste a link to an image (e.g. from Google Drive, Imgur, Facebook). Leave blank to use the emoji/initials badge below instead.</p>
            </div>

            {/* Auto-generate identity — recommended for adding many teams quickly */}
            <div className="rounded-xl bg-kdpl-neon/5 border border-kdpl-neon/20 p-3 flex items-center gap-3">
              {form.logoImageUrl ? (
                <img src={form.logoImageUrl} alt="avatar preview"
                  className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border-2"
                  style={{ borderColor: form.color || COLORS[0] }}
                  onError={e => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
              ) : (
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ backgroundColor: (form.color || COLORS[0]) + '25', border: `1.5px solid ${form.color || COLORS[0]}` }}>
                  {form.logo || teamInitials(form.name, form.shortName)}
                </div>
              )}
              <div className="flex-1">
                <div className="text-kdpl-text text-xs font-semibold">Logo Preview</div>
                <div className="text-kdpl-muted text-[10px]">Adding many teams? Auto-generate a unique badge instantly.</div>
              </div>
              <button onClick={handleAutoGenerate}
                className="px-3 py-2 rounded-lg bg-kdpl-neon text-kdpl-darker text-xs font-bold flex-shrink-0">
                🎲 Auto
              </button>
            </div>

            {/* Logo Emoji (optional manual pick) */}
            <div>
              <label className="text-kdpl-muted text-xs mb-2 block">Or Pick a Logo Manually</label>
              <div className="flex gap-2 flex-wrap max-h-32 overflow-y-auto kdpl-scroll">
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => setForm(f => ({...f, logo: e}))}
                    className={`text-xl w-10 h-10 rounded-xl border-2 transition-all flex-shrink-0 ${form.logo === e ? 'border-kdpl-neon bg-kdpl-neon/10' : 'border-kdpl-border bg-kdpl-darker'}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Team Color */}
            <div>
              <label className="text-kdpl-muted text-xs mb-2 block">Team Color</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setForm(f => ({...f, color: c}))}
                    style={{ backgroundColor: c, borderColor: form.color === c ? '#fff' : 'transparent' }}
                    className="w-7 h-7 rounded-full border-2 transition-all flex-shrink-0" />
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <button onClick={() => { setShowForm(false); resetForm(); }}
                className="flex-1 py-2.5 rounded-xl border border-kdpl-border text-kdpl-muted text-sm">Cancel</button>
              <button onClick={handleSave}
                className="flex-1 py-2.5 rounded-xl bg-kdpl-neon text-kdpl-darker font-bold text-sm">
                {editing ? 'Update' : 'Create Team'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teams Grid */}
      <div className="flex flex-col gap-3">
        {teams.map(team => (
          <div key={team.id} className="rounded-2xl bg-kdpl-card border border-kdpl-border overflow-hidden">
            {/* Color banner */}
            <div className="h-1.5" style={{ backgroundColor: team.color }} />
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {team.logoImageUrl ? (
                    <img src={team.logoImageUrl} alt={team.name} className="w-12 h-12 rounded-xl object-cover border" style={{ borderColor: team.color + '60' }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: team.color + '20', border: `1px solid ${team.color}40` }}>
                      {team.logo}
                    </div>
                  )}
                  <div>
                    <h3 className="text-kdpl-text font-oswald font-bold text-base">{team.name}</h3>
                    <p className="text-kdpl-muted text-xs">{team.city} · Capt: {team.captain}</p>
                    {team.sponsors && team.sponsors.length > 0 && (
                      <p className="text-kdpl-muted text-[10px] mt-0.5">🤝 Sponsored by {team.sponsors.join(', ')}</p>
                    )}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(team)} className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <EditPenIcon size={14} />
                    </button>
                    <button onClick={() => deleteTeam(team.id)} className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                      <TrashIcon size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Points', value: team.points, color: 'text-kdpl-neon' },
                  { label: 'Wins', value: team.wins, color: 'text-green-400' },
                  { label: 'Losses', value: team.losses, color: 'text-red-400' },
                  { label: 'NRR', value: `${team.nrr >= 0 ? '+' : ''}${team.nrr.toFixed(2)}`, color: team.nrr >= 0 ? 'text-kdpl-neon' : 'text-red-400' },
                ].map(s => (
                  <div key={s.label} className="text-center bg-kdpl-darker/50 rounded-xl p-2">
                    <div className={`font-oswald font-bold text-lg ${s.color}`}>{s.value}</div>
                    <div className="text-kdpl-muted text-[10px]">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Player count + navigate */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-kdpl-border/50">
                <div className="flex items-center gap-1.5 text-kdpl-muted text-xs">
                  <UsersIcon size={13} />
                  <span>{getTeamPlayers(team.id)} Players</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => navigate('players')}
                    className="text-xs text-kdpl-neon px-2 py-1 rounded-lg bg-kdpl-neon/10 border border-kdpl-neon/20">
                    View Players
                  </button>
                  <button onClick={() => navigate('squad')}
                    className="text-xs text-blue-400 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    Squad
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {teams.length === 0 && (
          <div className="text-center py-12 text-kdpl-muted">
            <TrophyIcon size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No teams yet. Add your first team!</p>
          </div>
        )}
      </div>
    </div>
  );
}
