// ═══════════════════════════════════════════════════════════════
// KDPL CREATE TOURNAMENT — Organizer creates their own tournament
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { TrophyIcon, PlusIcon, XIcon } from '../ui/Icons';
import type { KDPLStore } from '../../store/useKDPLStore';
import { genId } from '../../utils/id';
import type { Tournament, TournamentOfficial, TournamentBroadcaster } from '../../types';

const FORMATS: Tournament['format'][] = ['Round-Robin', 'Knockout', 'Double-Elimination', 'League'];
const OVERS_OPTIONS = [5, 6, 8, 10, 20, 50];

export default function CreateTournamentPage({ store }: { store: KDPLStore }) {
  const { state, createTournament, navigate } = store;
  const { authUid, isSuperAdmin, organizerProfile } = state;
  const [form, setForm] = useState({
    name: '', shortName: '', logo: '', banner: '',
    format: 'Round-Robin' as Tournament['format'], overs: 10,
    startDate: '', endDate: '', venue: '',
    status: 'upcoming' as Tournament['status'],
    teamCount: 4, playersPerTeam: 11, prizePool: '', organizer: '',
  });
  const [customRules, setCustomRules] = useState<string[]>([]);
  const [ruleInput, setRuleInput] = useState('');
  const [officials, setOfficials] = useState<TournamentOfficial[]>([]);
  const [officialForm, setOfficialForm] = useState({ name: '', role: 'Organizer' as TournamentOfficial['role'], whatsapp: '' });
  const [broadcasters, setBroadcasters] = useState<TournamentBroadcaster[]>([]);
  const [broadcasterForm, setBroadcasterForm] = useState({ name: '', whatsapp: '' });

  if (!authUid) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center gap-3">
        <div className="text-4xl mb-1">🔒</div>
        <h3 className="text-kdpl-text font-oswald font-bold text-xl">Sign In Required</h3>
        <p className="text-kdpl-muted text-sm max-w-xs">Sign in with an Organizer account first to create a tournament.</p>
        <button onClick={() => navigate('organizer-auth')}
          className="mt-2 px-5 py-2.5 rounded-xl bg-kdpl-neon text-kdpl-darker font-oswald font-bold text-sm">
          Sign In / Sign Up →
        </button>
      </div>
    );
  }

  if (!isSuperAdmin && organizerProfile?.status !== 'approved') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center gap-3">
        <div className="text-4xl mb-1">⏳</div>
        <h3 className="text-kdpl-text font-oswald font-bold text-xl">
          {organizerProfile?.status === 'rejected' ? 'Account Not Approved' : 'Waiting for Approval'}
        </h3>
        <p className="text-kdpl-muted text-sm max-w-xs">
          {organizerProfile?.status === 'rejected'
            ? "The Super Admin didn't approve your organizer account. Contact them for details."
            : 'Your organizer account is pending Super Admin approval. Once approved, you can create a tournament here.'}
        </p>
      </div>
    );
  }

  const addRule = () => {
    if (!ruleInput.trim()) return;
    setCustomRules(r => [...r, ruleInput.trim()]);
    setRuleInput('');
  };

  const removeRule = (i: number) => setCustomRules(r => r.filter((_, idx) => idx !== i));

  const addOfficial = () => {
    if (!officialForm.name.trim()) return;
    setOfficials(o => [...o, { id: genId('off'), ...officialForm, whatsapp: officialForm.whatsapp.replace(/\D/g, '') }]);
    setOfficialForm({ name: '', role: 'Organizer', whatsapp: '' });
  };

  const removeOfficial = (id: string) => setOfficials(o => o.filter(x => x.id !== id));

  const addBroadcaster = () => {
    if (!broadcasterForm.name.trim()) return;
    setBroadcasters(b => [...b, { id: genId('bc'), ...broadcasterForm, whatsapp: broadcasterForm.whatsapp.replace(/\D/g, '') }]);
    setBroadcasterForm({ name: '', whatsapp: '' });
  };
  const removeBroadcaster = (id: string) => setBroadcasters(b => b.filter(x => x.id !== id));

  const handleCreate = () => {
    if (!form.name.trim()) return;
    createTournament({ ...form, customRules, officials, broadcasters });
    navigate('dashboard');
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-kdpl-neon/10 border border-kdpl-neon/30 flex items-center justify-center">
          <TrophyIcon size={20} className="text-kdpl-neon" />
        </div>
        <div>
          <h2 className="text-kdpl-text font-oswald font-bold text-xl">Create New Tournament</h2>
          <p className="text-kdpl-muted text-xs">Set up your own tournament</p>
        </div>
      </div>

      <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4">
        <div className="text-kdpl-muted text-xs font-semibold uppercase tracking-wide mb-3">Basic Information</div>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-kdpl-muted text-xs mb-1 block">Tournament Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
              className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none"
              placeholder="City Premier League 2026" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-kdpl-muted text-xs mb-1 block">Short Name</label>
              <input value={form.shortName} onChange={e => setForm(f => ({...f, shortName: e.target.value}))}
                className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none"
                placeholder="CPL 2026" />
            </div>
            <div>
              <label className="text-kdpl-muted text-xs mb-1 block">Organizer / Club Name</label>
              <input value={form.organizer} onChange={e => setForm(f => ({...f, organizer: e.target.value}))}
                className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none"
                placeholder="Your Club Name" />
            </div>
          </div>
          <div>
            <label className="text-kdpl-muted text-xs mb-1 block">Main Venue</label>
            <input value={form.venue} onChange={e => setForm(f => ({...f, venue: e.target.value}))}
              className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none"
              placeholder="Stadium name, city" />
          </div>
          <div>
            <label className="text-kdpl-muted text-xs mb-1 block">Prize Pool</label>
            <input value={form.prizePool} onChange={e => setForm(f => ({...f, prizePool: e.target.value}))}
              className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none"
              placeholder="Rs. 50,000" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4">
        <div className="text-kdpl-muted text-xs font-semibold uppercase tracking-wide mb-3">Format & Rules</div>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-kdpl-muted text-xs mb-2 block">Tournament Format</label>
            <div className="grid grid-cols-2 gap-2">
              {FORMATS.map(fmt => (
                <button key={fmt} onClick={() => setForm(f => ({...f, format: fmt}))}
                  className={`py-2 px-3 rounded-xl text-xs border font-medium ${form.format === fmt ? 'bg-kdpl-neon text-kdpl-darker border-kdpl-neon' : 'bg-kdpl-darker border-kdpl-border text-kdpl-muted'}`}>
                  {fmt}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-kdpl-muted text-xs mb-2 block">Default Overs</label>
            <div className="flex gap-2 flex-wrap">
              {OVERS_OPTIONS.map(o => (
                <button key={o} onClick={() => setForm(f => ({...f, overs: o}))}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border ${form.overs === o ? 'bg-kdpl-neon text-kdpl-darker border-kdpl-neon' : 'bg-kdpl-darker border-kdpl-border text-kdpl-muted'}`}>
                  {o === 10 ? 'T10' : o === 20 ? 'T20' : o === 50 ? 'ODI' : `${o}`}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-kdpl-muted text-xs mb-1 block">Teams</label>
              <input type="number" min={2} max={16} value={form.teamCount} onChange={e => setForm(f => ({...f, teamCount: Number(e.target.value)}))}
                className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none" />
            </div>
            <div>
              <label className="text-kdpl-muted text-xs mb-1 block">Players/Team</label>
              <input type="number" min={6} max={15} value={form.playersPerTeam} onChange={e => setForm(f => ({...f, playersPerTeam: Number(e.target.value)}))}
                className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4">
        <div className="text-kdpl-muted text-xs font-semibold uppercase tracking-wide mb-3">Schedule</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-kdpl-muted text-xs mb-1 block">Start Date</label>
            <input type="date" value={form.startDate} onChange={e => setForm(f => ({...f, startDate: e.target.value}))}
              className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none" />
          </div>
          <div>
            <label className="text-kdpl-muted text-xs mb-1 block">End Date</label>
            <input type="date" value={form.endDate} onChange={e => setForm(f => ({...f, endDate: e.target.value}))}
              className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4">
        <div className="text-kdpl-muted text-xs font-semibold uppercase tracking-wide mb-3">Custom Rules</div>
        <p className="text-kdpl-muted text-[11px] mb-2">Add your own rules — shown on the tournament page and fixture posters.</p>
        <div className="flex gap-2 mb-3">
          <input value={ruleInput} onChange={e => setRuleInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addRule()}
            placeholder="e.g. Powerplay: first 3 overs, 2 fielders outside circle"
            className="flex-1 bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none" />
          <button onClick={addRule} className="px-4 rounded-xl bg-kdpl-neon text-kdpl-darker flex items-center justify-center">
            <PlusIcon size={16} />
          </button>
        </div>
        {customRules.length > 0 && (
          <div className="flex flex-col gap-2">
            {customRules.map((rule, i) => (
              <div key={i} className="flex items-start gap-2 bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2">
                <span className="text-kdpl-neon text-xs font-bold flex-shrink-0">{i + 1}.</span>
                <span className="text-kdpl-text text-xs flex-1">{rule}</span>
                <button onClick={() => removeRule(i)} className="text-red-400 flex-shrink-0"><XIcon size={12} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Organizer & Committee — public info */}
      <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4">
        <div className="text-kdpl-muted text-xs font-semibold uppercase tracking-wide mb-3">Organizer & Committee</div>
        <p className="text-kdpl-muted text-[11px] mb-2">Shown publicly so teams/players know who's running the tournament.</p>
        <div className="flex flex-col gap-2 mb-3">
          <input value={officialForm.name} onChange={e => setOfficialForm(f => ({...f, name: e.target.value}))}
            placeholder="Full name"
            className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none" />
          <div className="flex gap-2">
            <select value={officialForm.role} onChange={e => setOfficialForm(f => ({...f, role: e.target.value as TournamentOfficial['role']}))}
              className="flex-1 bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm outline-none">
              <option value="Organizer">Organizer</option>
              <option value="Committee Member">Committee Member</option>
            </select>
            <input value={officialForm.whatsapp} onChange={e => setOfficialForm(f => ({...f, whatsapp: e.target.value.replace(/[^\d+]/g, '')}))}
              placeholder="+923001234567"
              className="flex-1 bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none" />
            <button onClick={addOfficial} className="px-4 rounded-xl bg-kdpl-neon text-kdpl-darker flex items-center justify-center flex-shrink-0">
              <PlusIcon size={16} />
            </button>
          </div>
        </div>
        {officials.length > 0 && (
          <div className="flex flex-col gap-2">
            {officials.map(o => (
              <div key={o.id} className="flex items-center gap-2 bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2">
                <div className="flex-1 min-w-0">
                  <div className="text-kdpl-text text-xs font-semibold">{o.name} <span className="text-kdpl-muted font-normal">· {o.role}</span></div>
                  {o.whatsapp && <div className="text-kdpl-muted text-[10px]">📱 {o.whatsapp}</div>}
                </div>
                <button onClick={() => removeOfficial(o.id)} className="text-red-400 flex-shrink-0"><XIcon size={12} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Broadcasters — public info */}
      <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4">
        <div className="text-kdpl-muted text-xs font-semibold uppercase tracking-wide mb-3">Live Broadcasters</div>
        <p className="text-kdpl-muted text-[11px] mb-2">Anyone who'll be live-streaming matches — shown publicly on the tournament page.</p>
        <div className="flex gap-2 mb-3">
          <input value={broadcasterForm.name} onChange={e => setBroadcasterForm(f => ({...f, name: e.target.value}))}
            placeholder="Broadcaster name"
            className="flex-1 bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none" />
          <input value={broadcasterForm.whatsapp} onChange={e => setBroadcasterForm(f => ({...f, whatsapp: e.target.value.replace(/[^\d+]/g, '')}))}
            placeholder="+923001234567"
            className="flex-1 bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none" />
          <button onClick={addBroadcaster} className="px-4 rounded-xl bg-kdpl-neon text-kdpl-darker flex items-center justify-center flex-shrink-0">
            <PlusIcon size={16} />
          </button>
        </div>
        {broadcasters.length > 0 && (
          <div className="flex flex-col gap-2">
            {broadcasters.map(b => (
              <div key={b.id} className="flex items-center gap-2 bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2">
                <div className="flex-1 min-w-0">
                  <div className="text-kdpl-text text-xs font-semibold">📹 {b.name}</div>
                  {b.whatsapp && <div className="text-kdpl-muted text-[10px]">📱 {b.whatsapp}</div>}
                </div>
                <button onClick={() => removeBroadcaster(b.id)} className="text-red-400 flex-shrink-0"><XIcon size={12} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={handleCreate} disabled={!form.name.trim()}
        className="w-full py-3.5 rounded-2xl font-oswald font-bold text-base bg-kdpl-neon text-kdpl-darker shadow-lg shadow-kdpl-neon/30 disabled:opacity-50">
        Create Tournament 🏆
      </button>
    </div>
  );
}
