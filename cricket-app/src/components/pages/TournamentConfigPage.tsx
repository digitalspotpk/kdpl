// ═══════════════════════════════════════════════════════════════
// KDPL TOURNAMENT CONFIG — Settings & Setup
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { SettingsIcon, WhatsAppIcon, PlusIcon, XIcon, TrashIcon } from '../ui/Icons';
import type { KDPLStore } from '../../store/useKDPLStore';
import { genId } from '../../utils/id';
import type { Tournament, TournamentOfficial } from '../../types';

const FORMATS: Tournament['format'][] = ['Round-Robin', 'Knockout', 'Double-Elimination', 'League'];
const OVERS_OPTIONS = [5, 6, 8, 10, 20, 50];

export default function TournamentConfigPage({ store }: { store: KDPLStore }) {
  const { state, updateTournament, updateSupportWhatsapp, navigate, deleteTournament } = store;
  const { tournament, isAdmin, isSuperAdmin, supportWhatsapp } = state;
  const [form, setForm] = useState<Tournament | null>(tournament);
  const [saved, setSaved] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState(supportWhatsapp);
  const [whatsappSaved, setWhatsappSaved] = useState(false);
  const [ruleInput, setRuleInput] = useState('');
  const [officialForm, setOfficialForm] = useState({ name: '', role: 'Organizer' as TournamentOfficial['role'], whatsapp: '' });
  const [broadcasterForm, setBroadcasterForm] = useState({ name: '', whatsapp: '' });
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const [showDangerZone, setShowDangerZone] = useState(false);

  const addOfficial = () => {
    if (!officialForm.name.trim()) return;
    setForm(f => f ? ({ ...f, officials: [...(f.officials || []), { id: genId('off'), ...officialForm, whatsapp: officialForm.whatsapp.replace(/\D/g, '') }] }) : f);
    setOfficialForm({ name: '', role: 'Organizer', whatsapp: '' });
  };

  const removeOfficial = (id: string) => {
    setForm(f => f ? ({ ...f, officials: (f.officials || []).filter(o => o.id !== id) }) : f);
  };

  const addBroadcaster = () => {
    if (!broadcasterForm.name.trim()) return;
    setForm(f => f ? ({ ...f, broadcasters: [...(f.broadcasters || []), { id: genId('bc'), ...broadcasterForm, whatsapp: broadcasterForm.whatsapp.replace(/\D/g, '') }] }) : f);
    setBroadcasterForm({ name: '', whatsapp: '' });
  };

  const removeBroadcaster = (id: string) => {
    setForm(f => f ? ({ ...f, broadcasters: (f.broadcasters || []).filter(b => b.id !== id) }) : f);
  };

  const addRule = () => {
    if (!ruleInput.trim()) return;
    setForm(f => f ? ({ ...f, customRules: [...(f.customRules || []), ruleInput.trim()] }) : f);
    setRuleInput('');
  };

  const removeRule = (i: number) => {
    setForm(f => f ? ({ ...f, customRules: (f.customRules || []).filter((_, idx) => idx !== i) }) : f);
  };

  const handleSave = () => {
    if (!form) return;
    updateTournament(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleWhatsappSave = () => {
    const digitsOnly = whatsappNumber.replace(/\D/g, '');
    updateSupportWhatsapp(digitsOnly);
    setWhatsappNumber(digitsOnly);
    setWhatsappSaved(true);
    setTimeout(() => setWhatsappSaved(false), 2000);
  };

  if (!tournament) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center gap-3">
        <div className="text-4xl mb-1">🏆</div>
        <h3 className="text-kdpl-text font-oswald font-bold text-xl">No Tournament Selected</h3>
        <p className="text-kdpl-muted text-sm max-w-xs">Select or create a tournament first from "Manage → Tournaments" to edit settings.</p>
        <button onClick={() => navigate('tournaments')}
          className="mt-2 px-5 py-2.5 rounded-xl bg-kdpl-neon text-kdpl-darker font-oswald font-bold text-sm">
          Browse Tournaments →
        </button>
      </div>
    );
  }

  if (!isAdmin || !form) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center gap-2">
        <div className="text-4xl mb-2">🛡️</div>
        <h3 className="text-kdpl-text font-oswald font-bold text-xl">Organizer Access Only</h3>
        <p className="text-kdpl-muted text-sm max-w-xs">Only this tournament's Organizer or a Super Admin can edit it.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-kdpl-neon/10 border border-kdpl-neon/30 flex items-center justify-center">
          <SettingsIcon size={20} className="text-kdpl-neon" />
        </div>
        <div>
          <h2 className="text-kdpl-text font-oswald font-bold text-xl">Tournament Config</h2>
          <p className="text-kdpl-muted text-xs">Manage tournament settings</p>
        </div>
      </div>

      {/* Basic Info */}
      <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4">
        <div className="text-kdpl-muted text-xs font-semibold uppercase tracking-wide mb-3">Basic Information</div>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-kdpl-muted text-xs mb-1 block">Tournament Name</label>
            <input value={form.name} onChange={e => setForm(f => f ? ({...f, name: e.target.value}) : f)}
              className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none"
              placeholder="KD Premier League 2025" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-kdpl-muted text-xs mb-1 block">Short Name</label>
              <input value={form.shortName} onChange={e => setForm(f => f ? ({...f, shortName: e.target.value}) : f)}
                className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none"
                placeholder="KDPL 2025" />
            </div>
            <div>
              <label className="text-kdpl-muted text-xs mb-1 block">Organizer</label>
              <input value={form.organizer} onChange={e => setForm(f => f ? ({...f, organizer: e.target.value}) : f)}
                className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none"
                placeholder="KD Sports Club" />
            </div>
          </div>
          <div>
            <label className="text-kdpl-muted text-xs mb-1 block">Main Venue</label>
            <input value={form.venue} onChange={e => setForm(f => f ? ({...f, venue: e.target.value}) : f)}
              className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none"
              placeholder="KDPL Stadium, Khoi Dara" />
          </div>
          <div>
            <label className="text-kdpl-muted text-xs mb-1 block">Prize Pool</label>
            <input value={form.prizePool} onChange={e => setForm(f => f ? ({...f, prizePool: e.target.value}) : f)}
              className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none"
              placeholder="Rs. 50,000" />
          </div>
        </div>
      </div>

      {/* Format & Overs */}
      <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4">
        <div className="text-kdpl-muted text-xs font-semibold uppercase tracking-wide mb-3">Format & Rules</div>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-kdpl-muted text-xs mb-2 block">Tournament Format</label>
            <div className="grid grid-cols-2 gap-2">
              {FORMATS.map(fmt => (
                <button key={fmt} onClick={() => setForm(f => f ? ({...f, format: fmt}) : f)}
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
                <button key={o} onClick={() => setForm(f => f ? ({...f, overs: o}) : f)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border ${form.overs === o ? 'bg-kdpl-neon text-kdpl-darker border-kdpl-neon' : 'bg-kdpl-darker border-kdpl-border text-kdpl-muted'}`}>
                  {o === 10 ? 'T10' : o === 20 ? 'T20' : o === 50 ? 'ODI' : `${o}`}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-kdpl-muted text-xs mb-1 block">Teams</label>
              <input type="number" min={2} max={16} value={form.teamCount} onChange={e => setForm(f => f ? ({...f, teamCount: Number(e.target.value)}) : f)}
                className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none" />
            </div>
            <div>
              <label className="text-kdpl-muted text-xs mb-1 block">Players/Team</label>
              <input type="number" min={6} max={15} value={form.playersPerTeam} onChange={e => setForm(f => f ? ({...f, playersPerTeam: Number(e.target.value)}) : f)}
                className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4">
        <div className="text-kdpl-muted text-xs font-semibold uppercase tracking-wide mb-3">Schedule</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-kdpl-muted text-xs mb-1 block">Start Date</label>
            <input type="date" value={form.startDate} onChange={e => setForm(f => f ? ({...f, startDate: e.target.value}) : f)}
              className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none" />
          </div>
          <div>
            <label className="text-kdpl-muted text-xs mb-1 block">End Date</label>
            <input type="date" value={form.endDate} onChange={e => setForm(f => f ? ({...f, endDate: e.target.value}) : f)}
              className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none" />
          </div>
        </div>
        <div className="mt-3">
          <label className="text-kdpl-muted text-xs mb-2 block">Status</label>
          <div className="flex gap-2">
            {(['upcoming', 'active', 'completed'] as const).map(s => (
              <button key={s} onClick={() => setForm(f => f ? ({...f, status: s}) : f)}
                className={`flex-1 py-2 rounded-xl text-xs border font-medium capitalize ${form.status === s ? 'bg-kdpl-neon text-kdpl-darker border-kdpl-neon' : 'bg-kdpl-darker border-kdpl-border text-kdpl-muted'}`}>
                {s === 'upcoming' ? '🔵' : s === 'active' ? '🟢' : '🏆'} {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      {/* Custom Rules */}
      <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4">
        <div className="text-kdpl-muted text-xs font-semibold uppercase tracking-wide mb-3">Custom Rules</div>
        <p className="text-kdpl-muted text-[11px] mb-2">Shown on the tournament page and fixture posters.</p>
        <div className="flex gap-2 mb-3">
          <input value={ruleInput} onChange={e => setRuleInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addRule()}
            placeholder="e.g. Every player must bowl at least 1 over"
            className="flex-1 bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none" />
          <button onClick={addRule} className="px-4 rounded-xl bg-kdpl-neon text-kdpl-darker flex items-center justify-center">
            <PlusIcon size={16} />
          </button>
        </div>
        {(form.customRules || []).length > 0 && (
          <div className="flex flex-col gap-2">
            {(form.customRules || []).map((rule, i) => (
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
        {(form.officials || []).length > 0 && (
          <div className="flex flex-col gap-2">
            {form.officials.map(o => (
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
        {(form.broadcasters || []).length > 0 && (
          <div className="flex flex-col gap-2">
            {form.broadcasters.map(b => (
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

      <button onClick={handleSave}
        className={`w-full py-3.5 rounded-2xl font-oswald font-bold text-base transition-all active:scale-98 ${saved ? 'bg-green-500 text-white' : 'bg-kdpl-neon text-kdpl-darker shadow-lg shadow-kdpl-neon/30'}`}>
        {saved ? '✓ Settings Saved!' : 'Save Tournament Settings'}
      </button>

      {/* Support Settings — WhatsApp (site-wide setting, not per-tournament — Super Admin only) */}
      {isSuperAdmin && (
        <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4">
          <div className="text-kdpl-muted text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <WhatsAppIcon size={14} className="text-[#25D366]" /> Support Settings <span className="text-[9px] normal-case text-kdpl-muted">(applies site-wide)</span>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-kdpl-muted text-xs mb-1 block">WhatsApp Support Number</label>
              <input
                type="tel"
                value={whatsappNumber}
                onChange={e => setWhatsappNumber(e.target.value.replace(/[^\d+]/g, ''))}
                placeholder="+923001234567"
                className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none"
              />
              <p className="text-kdpl-muted text-[10px] mt-1">Include the country code (e.g. +92 for Pakistan). This number links to the WhatsApp support icon on the home page.</p>
            </div>
            <button onClick={handleWhatsappSave}
              className={`w-full py-3 rounded-xl font-oswald font-bold text-sm transition-all active:scale-98 ${whatsappSaved ? 'bg-green-500 text-white' : 'bg-[#25D366] text-white'}`}>
              {whatsappSaved ? '✓ Support Link Saved!' : 'Save Support Link'}
            </button>
          </div>
        </div>
      )}

      {/* Danger Zone — delete this tournament and everything in it */}
      {isAdmin && tournament && (
        <div className="rounded-2xl bg-red-500/5 border border-red-500/30 p-4">
          <button onClick={() => setShowDangerZone(v => !v)} className="w-full flex items-center justify-between">
            <span className="text-red-400 text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
              <TrashIcon size={13} /> Danger Zone
            </span>
            <span className="text-red-400 text-xs">{showDangerZone ? '−' : '+'}</span>
          </button>
          {showDangerZone && (
            <div className="mt-3">
              <p className="text-kdpl-muted text-xs mb-3">
                Permanently deletes "{tournament.name}" and everything in it — teams, players, venues, fixtures, series and any live match data. This cannot be undone.
              </p>
              <label className="text-kdpl-muted text-xs mb-1 block">
                Type <span className="text-kdpl-text font-semibold">{tournament.name}</span> to confirm:
              </label>
              <input value={confirmDeleteText} onChange={e => setConfirmDeleteText(e.target.value)}
                className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm outline-none mb-3" />
              <button
                onClick={() => { deleteTournament(tournament.id); navigate('tournaments'); }}
                disabled={confirmDeleteText.trim() !== tournament.name}
                className="w-full py-3 rounded-xl bg-red-500 text-white text-sm font-bold disabled:opacity-40">
                Delete This Tournament Permanently
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
