// ═══════════════════════════════════════════════════════════════
// KDPL ORGANIZER AUTH — Sign up / Sign in (real Firebase Auth accounts)
// Works for both Tournament Organizers and Super Admins — the app
// decides which role a signed-in account gets by checking the
// Super Admin email allowlist (see App Settings).
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { ShieldIcon, UserIcon } from '../ui/Icons';
import { isFirebaseConfigured } from '../../firebase';
import type { KDPLStore } from '../../store/useKDPLStore';

export default function OrganizerAuthPage({ store }: { store: KDPLStore }) {
  const { organizerSignUp, organizerLogin, navigate } = store;
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!isFirebaseConfigured()) {
      setError("Firebase isn't configured yet. Ask an admin to set up the Firebase config in \"Manage → Settings\".");
      return;
    }
    if (!email.trim() || !password.trim() || (mode === 'signup' && !name.trim())) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');
    const err = mode === 'signup'
      ? await organizerSignUp(name.trim(), email.trim(), password)
      : await organizerLogin(email.trim(), password);
    setLoading(false);
    if (err) { setError(err); return; }
    setDone(true);
    setTimeout(() => navigate('tournaments'), 1400);
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center gap-3">
        <div className="w-16 h-16 rounded-full bg-kdpl-neon/15 border border-kdpl-neon/40 flex items-center justify-center text-3xl">✓</div>
        <h3 className="text-kdpl-text font-oswald font-bold text-xl">
          {mode === 'signup' ? 'Account Created!' : 'Signed In!'}
        </h3>
        <p className="text-kdpl-muted text-sm max-w-xs">
          {mode === 'signup'
            ? 'Your account is pending Super Admin approval. You\u2019ll be able to create a tournament once approved.'
            : 'Redirecting...'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-md mx-auto">
      <div className="flex flex-col items-center text-center gap-2 mt-4">
        <div className="w-14 h-14 rounded-2xl bg-kdpl-neon/10 border border-kdpl-neon/30 flex items-center justify-center">
          <ShieldIcon size={26} className="text-kdpl-neon" />
        </div>
        <h2 className="text-kdpl-text font-oswald font-bold text-xl">Tournament Organizer</h2>
        <p className="text-kdpl-muted text-sm max-w-xs">
          Create and manage your own tournament — teams, fixtures, live scoring, everything.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex bg-kdpl-darker border border-kdpl-border rounded-xl p-1">
        <button onClick={() => { setMode('signup'); setError(''); }}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === 'signup' ? 'bg-kdpl-neon text-kdpl-darker' : 'text-kdpl-muted'}`}>
          New Account
        </button>
        <button onClick={() => { setMode('signin'); setError(''); }}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === 'signin' ? 'bg-kdpl-neon text-kdpl-darker' : 'text-kdpl-muted'}`}>
          Sign In
        </button>
      </div>

      <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4 flex flex-col gap-3">
        {mode === 'signup' && (
          <div>
            <label className="text-kdpl-muted text-xs mb-1 block">Your Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none"
              placeholder="Full Name" />
          </div>
        )}
        <div>
          <label className="text-kdpl-muted text-xs mb-1 block">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none"
            placeholder="organizer@example.com" />
        </div>
        <div>
          <label className="text-kdpl-muted text-xs mb-1 block">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none"
            placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'} />
        </div>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-3 rounded-xl font-oswald font-bold text-sm bg-kdpl-neon text-kdpl-darker disabled:opacity-50">
          {loading ? 'Please wait...' : mode === 'signup' ? 'Create Account →' : 'Sign In →'}
        </button>
      </div>

      <div className="rounded-xl bg-kdpl-darker/50 border border-kdpl-border p-3 flex items-start gap-2">
        <UserIcon size={14} className="text-kdpl-muted flex-shrink-0 mt-0.5" />
        <p className="text-kdpl-muted text-[11px] leading-relaxed">
          Every Organizer has their own separate, secure login. New accounts need Super Admin approval before you can create a tournament — you can only manage the tournament(s) you created, not other organizers' data.
        </p>
      </div>
    </div>
  );
}
