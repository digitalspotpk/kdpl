// ═══════════════════════════════════════════════════════════════
// KDPL SETUP — 3-Step Player Registration Stepper
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { CheckIcon, UserIcon, ShieldIcon } from '../ui/Icons';
import type { KDPLStore } from '../../store/useKDPLStore';
import { genId } from '../../utils/id';
import type { PlayerRole, UserProfile } from '../../types';

const ROLES: { value: PlayerRole | 'Viewer Only'; label: string; icon: string }[] = [
  { value: 'Batsman', label: 'Batsman', icon: '🏏' },
  { value: 'Bowler', label: 'Bowler', icon: '🎳' },
  { value: 'All-Rounder', label: 'All-Rounder', icon: '🌟' },
  { value: 'Wicket-Keeper', label: 'Wicket-Keeper', icon: '🧤' },
  { value: 'Viewer Only', label: 'Viewer Only', icon: '👁️' },
];

const USERS_LS_KEY = 'kdpl_users';
const CLOUD_DOC = doc(db, 'kdpl', 'data');

const STEPS = ['Personal Info', 'Cricket Profile', 'Submit'];

export default function SetupPage({ store }: { store: KDPLStore }) {
  const { navigate } = store;
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', city: '',
    preferredRole: 'Batsman' as PlayerRole | 'Viewer Only',
    battingStyle: 'Right-hand Bat',
    bowlingStyle: 'None',
    experience: '',
    about: '',
  });

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const handleSubmit = () => {
    // Save registration request into the SAME storage that "Manage → Users" reads,
    // so it actually shows up for Super Admin approval (localStorage + Firestore cloud sync).
    const existing: UserProfile[] = JSON.parse(localStorage.getItem(USERS_LS_KEY) || '[]');
    const newUser: UserProfile = {
      uid: genId('u'),
      name: form.name,
      email: form.email,
      phone: form.phone,
      city: form.city,
      role: 'USER',
      preferredRole: form.preferredRole,
      status: 'pending',
      createdAt: Date.now(),
      lastLogin: 0,
    };
    const updated = [...existing, newUser];
    localStorage.setItem(USERS_LS_KEY, JSON.stringify(updated));
    setDoc(CLOUD_DOC, { users: updated }, { merge: true }).catch(e => console.warn('Cloud sync failed', e));
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-kdpl-neon/20 border border-kdpl-neon/40 flex items-center justify-center">
          <CheckIcon size={36} className="text-kdpl-neon" />
        </div>
        <div>
          <h2 className="text-kdpl-text font-oswald font-bold text-2xl mb-2">Registration Submitted!</h2>
          <p className="text-kdpl-muted text-sm leading-relaxed">
            Your registration has been submitted successfully.<br />
            An admin will review and approve your account shortly.
          </p>
        </div>
        <div className="w-full max-w-xs bg-kdpl-card border border-kdpl-border rounded-2xl p-4 text-sm text-kdpl-muted text-left">
          <div className="flex items-center gap-2 mb-3">
            <UserIcon size={16} className="text-kdpl-neon" />
            <span className="text-kdpl-text font-semibold">{form.name}</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">{ROLES.find(r => r.value === form.preferredRole)?.icon}</span>
            <span>{form.preferredRole}</span>
          </div>
          <div className="text-kdpl-muted text-xs">{form.email} · {form.city}</div>
        </div>
        <button onClick={() => navigate('dashboard')}
          className="w-full max-w-xs py-3.5 bg-kdpl-neon text-kdpl-darker rounded-2xl font-oswald font-bold text-lg">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div>
        <h2 className="text-kdpl-text font-oswald font-bold text-xl">Player Registration</h2>
        <p className="text-kdpl-muted text-xs">Join KD Premier League</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`flex items-center gap-2 flex-1 ${i < STEPS.length - 1 ? 'relative' : ''}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all
                ${i < step ? 'bg-kdpl-neon border-kdpl-neon text-kdpl-darker'
                : i === step ? 'border-kdpl-neon text-kdpl-neon bg-kdpl-neon/10'
                : 'border-kdpl-border text-kdpl-muted bg-kdpl-darker'}`}>
                {i < step ? <CheckIcon size={14} /> : i + 1}
              </div>
              <span className={`text-xs font-medium ${i === step ? 'text-kdpl-text' : 'text-kdpl-muted'}`}>{s}</span>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px ml-2 bg-kdpl-border">
                  <div className={`h-full bg-kdpl-neon transition-all duration-500 ${i < step ? 'w-full' : 'w-0'}`} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Step 0: Personal Info */}
      {step === 0 && (
        <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4 flex flex-col gap-3 animate-slide-up">
          <h3 className="text-kdpl-text font-oswald font-bold">Personal Information</h3>

          <div>
            <label className="text-kdpl-muted text-xs mb-1 block">Full Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
              className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none"
              placeholder="Muhammad Saleem" />
          </div>
          <div>
            <label className="text-kdpl-muted text-xs mb-1 block">Email Address *</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))}
              className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none"
              placeholder="your@email.com" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-kdpl-muted text-xs mb-1 block">Phone</label>
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))}
                className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none"
                placeholder="+92 3XX XXXXXXX" />
            </div>
            <div>
              <label className="text-kdpl-muted text-xs mb-1 block">City</label>
              <input value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))}
                className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none"
                placeholder="Khoi Dara" />
            </div>
          </div>
          <button onClick={handleNext} disabled={!form.name || !form.email}
            className="w-full py-3.5 rounded-2xl bg-kdpl-neon text-kdpl-darker font-oswald font-bold text-base disabled:opacity-50 mt-2">
            Continue →
          </button>
        </div>
      )}

      {/* Step 1: Cricket Profile */}
      {step === 1 && (
        <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4 flex flex-col gap-3 animate-slide-up">
          <h3 className="text-kdpl-text font-oswald font-bold">Cricket Profile</h3>
          <div>
            <label className="text-kdpl-muted text-xs mb-2 block">Preferred Role *</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map(role => (
                <button key={role.value} onClick={() => setForm(f => ({...f, preferredRole: role.value}))}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${form.preferredRole === role.value ? 'bg-kdpl-neon/10 border-kdpl-neon text-kdpl-neon' : 'bg-kdpl-darker border-kdpl-border text-kdpl-muted'}`}>
                  <span className="text-lg">{role.icon}</span>
                  <span className="text-xs font-medium">{role.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-kdpl-muted text-xs mb-1 block">Batting Style</label>
            <select value={form.battingStyle} onChange={e => setForm(f => ({...f, battingStyle: e.target.value}))}
              className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm outline-none">
              {['Right-hand Bat', 'Left-hand Bat'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-kdpl-muted text-xs mb-1 block">Bowling Style</label>
            <select value={form.bowlingStyle} onChange={e => setForm(f => ({...f, bowlingStyle: e.target.value}))}
              className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm outline-none">
              {['None', 'Right-arm Fast', 'Right-arm Medium', 'Right-arm Off-Spin', 'Right-arm Leg-Spin', 'Left-arm Fast', 'Left-arm Spin'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-kdpl-muted text-xs mb-1 block">Years of Experience</label>
            <input value={form.experience} onChange={e => setForm(f => ({...f, experience: e.target.value}))}
              className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none"
              placeholder="e.g. 5 years" />
          </div>
          <div>
            <label className="text-kdpl-muted text-xs mb-1 block">About Yourself</label>
            <textarea value={form.about} onChange={e => setForm(f => ({...f, about: e.target.value}))}
              className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none resize-none"
              rows={3} placeholder="Brief introduction about your cricket background..." />
          </div>
          <div className="flex gap-3 mt-2">
            <button onClick={handleBack} className="flex-1 py-3 rounded-2xl border border-kdpl-border text-kdpl-muted font-medium">← Back</button>
            <button onClick={handleNext} className="flex-1 py-3 rounded-2xl bg-kdpl-neon text-kdpl-darker font-oswald font-bold">Continue →</button>
          </div>
        </div>
      )}

      {/* Step 2: Review & Submit */}
      {step === 2 && (
        <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4 flex flex-col gap-4 animate-slide-up">
          <h3 className="text-kdpl-text font-oswald font-bold">Review & Submit</h3>
          <div className="rounded-xl bg-kdpl-darker border border-kdpl-border p-4">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-kdpl-border">
              <div className="w-14 h-14 rounded-2xl bg-kdpl-neon/10 border border-kdpl-neon/30 flex items-center justify-center text-3xl">
                {ROLES.find(r => r.value === form.preferredRole)?.icon}
              </div>
              <div>
                <div className="text-kdpl-text font-oswald font-bold text-lg">{form.name || 'Your Name'}</div>
                <div className="text-kdpl-neon text-sm font-medium">{form.preferredRole}</div>
                <div className="text-kdpl-muted text-xs">{form.city}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-y-2 text-xs">
              {[
                ['Email', form.email], ['Phone', form.phone || '—'],
                ['Batting', form.battingStyle], ['Bowling', form.bowlingStyle],
                ['Experience', form.experience || '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="text-kdpl-muted">{label}</div>
                  <div className="text-kdpl-text font-medium">{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-3">
            <div className="flex items-start gap-2">
              <ShieldIcon size={14} className="text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-400/80 text-[11px] leading-relaxed">
                After you submit, the Super Admin will review your request and approve/reject it. Your account stays pending until approved.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleBack} className="flex-1 py-3 rounded-2xl border border-kdpl-border text-kdpl-muted font-medium">← Back</button>
            <button onClick={handleSubmit}
              className="flex-1 py-3 rounded-2xl bg-kdpl-neon text-kdpl-darker font-oswald font-bold">
              Submit Registration
            </button>
          </div>
        </div>
      )}

      {/* Already have account */}
      <div className="text-center text-kdpl-muted text-xs pb-2">
        Already have an account?{' '}
        <button onClick={() => navigate('dashboard')} className="text-kdpl-neon underline">Go to Dashboard</button>
      </div>
    </div>
  );
}
