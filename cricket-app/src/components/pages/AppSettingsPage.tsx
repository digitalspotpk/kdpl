// ═══════════════════════════════════════════════════════════════
// KDPL APP SETTINGS
// Firebase config + Firestore rules: PIN (Setup Access) OR Super Admin —
//   needed so Firebase can be bootstrapped BEFORE any Super Admin exists.
// Super Admin email allowlist, PIN reset: Super Admin only (except the
//   very first allowlist entry, which PIN can also add, to bootstrap).
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { SettingsIcon, ShieldIcon, ClipboardIcon, RefreshIcon, LockIcon, CheckIcon, XIcon } from '../ui/Icons';
import { firebaseConfig, isFirebaseConfigured } from '../../firebase';
import PinModal from '../modals/PinModal';
import type { KDPLStore } from '../../store/useKDPLStore';

const FIRESTORE_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function isSuperAdmin() {
      return isSignedIn() &&
        request.auth.token.email in
        get(/databases/$(database)/documents/kdpl/data).data.superAdminEmails;
    }

    function ownsTournament(tournamentId) {
      return isSignedIn() &&
        get(/databases/$(database)/documents/kdplTournaments/$(tournamentId)).data.organizerUid == request.auth.uid;
    }

    // Shared app document — teams, players, venues, fixtures, series,
    // notifications, ad slots, the organizer list, and the Super Admin
    // allowlist all still live here as array fields inside ONE document.
    // Rules can only gate this document as a whole (any signed-in user
    // may write SOME field in it) — they can't yet restrict "you may only
    // touch the entries that belong to your own tournament" the way
    // kdplTournaments and kdplLiveMatches do below, because a rule can't
    // see inside one array entry vs. another. That finer protection needs
    // teams/players/venues/fixtures/series split into their own
    // collections too (the same kind of migration already done for
    // tournaments and live matches) — ask your developer for that if
    // multiple organizers will share one deployment and you don't fully
    // trust each other.
    match /kdpl/{docId} {
      allow read: if true;
      allow write: if isSignedIn();
    }

    // Each tournament is its own document, so this DOES fully enforce
    // "only the organizer who owns it (or the Super Admin) can edit or
    // delete it" — matching the app's Danger Zone / Data Management
    // delete buttons at the database level, not just in the UI.
    match /kdplTournaments/{tournamentId} {
      allow read: if true;
      allow create: if isSignedIn() && request.resource.data.organizerUid == request.auth.uid;
      allow update, delete: if isSuperAdmin() ||
        (isSignedIn() && resource.data.organizerUid == request.auth.uid);
    }

    // Same per-document protection for live matches, checked against
    // whichever tournament the match belongs to.
    match /kdplLiveMatches/{matchId} {
      allow read: if true;
      allow create, update: if isSuperAdmin() || ownsTournament(request.resource.data.tournamentId);
      allow delete: if isSuperAdmin() || ownsTournament(resource.data.tournamentId);
    }
  }
}`;

export default function AppSettingsPage({ store }: { store: KDPLStore }) {
  const { state, changePin, addSuperAdminEmail, removeSuperAdminEmail } = store;
  const { hasSetupAccess, isSuperAdmin, superAdminEmails } = state;
  const [configText, setConfigText] = useState(JSON.stringify(firebaseConfig, null, 2));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [copiedRules, setCopiedRules] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinChanged, setPinChanged] = useState(false);
  const [pinError, setPinError] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);

  if (!hasSetupAccess && !isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center gap-3">
        <div className="text-4xl mb-1">🔒</div>
        <h3 className="text-kdpl-text font-oswald font-bold text-xl">Setup Access Required</h3>
        <p className="text-kdpl-muted text-sm max-w-xs">Enter the Setup PIN to configure Firebase here (the person who deployed the app has it).</p>
        <button onClick={() => setShowPinModal(true)}
          className="mt-1 px-5 py-2.5 rounded-xl bg-kdpl-neon text-kdpl-darker font-oswald font-bold text-sm">
          Enter PIN →
        </button>
        {showPinModal && (
          <PinModal store={store} onClose={() => setShowPinModal(false)} onSuccess={() => setShowPinModal(false)} />
        )}
      </div>
    );
  }

  const handleSaveConfig = () => {
    try {
      const parsed = JSON.parse(configText);
      if (!parsed.apiKey || !parsed.projectId) {
        setError('apiKey and projectId are required in the config.');
        return;
      }
      localStorage.setItem('kdpl_firebase_config', JSON.stringify(parsed));
      setError('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("This isn't valid JSON — paste the object copied from the Firebase Console again.");
    }
  };

  const handleCopyRules = () => {
    navigator.clipboard?.writeText(FIRESTORE_RULES);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2000);
  };

  const handlePinChange = () => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) { setPinError('PIN must be 4 digits.'); return; }
    changePin(newPin);
    setNewPin('');
    setPinError('');
    setPinChanged(true);
    setTimeout(() => setPinChanged(false), 2000);
  };

  const handleAddEmail = () => {
    if (!newEmail.trim() || !newEmail.includes('@')) return;
    addSuperAdminEmail(newEmail.trim());
    setNewEmail('');
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h2 className="text-kdpl-text font-oswald font-bold text-xl flex items-center gap-2">
          <SettingsIcon size={20} /> App Settings
        </h2>
        <p className="text-kdpl-muted text-xs">Firebase config &amp; Super Admin roles</p>
      </div>

      {/* Connection status */}
      <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className={`w-2.5 h-2.5 rounded-full ${isFirebaseConfigured() ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`} />
          <span className="text-kdpl-text text-sm font-semibold">
            {isFirebaseConfigured() ? 'Firebase Connected' : 'Firebase Not Configured Yet'}
          </span>
        </div>
        <p className="text-kdpl-muted text-xs">
          {isFirebaseConfigured()
            ? `Project ID: ${firebaseConfig.projectId}`
            : "Paste the config below and save, then reload the page. Without this, Organizer/Super Admin login and cloud sync won't work."}
        </p>
      </div>

      {/* Firebase Config Editor */}
      <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4">
        <div className="text-kdpl-muted text-xs font-semibold uppercase tracking-wide mb-2">Firebase Project Config</div>
        <p className="text-kdpl-muted text-[11px] mb-2">
          Copy the full config object from Firebase Console → Project Settings → Your apps → Web app, and paste it here.
        </p>
        <textarea
          value={configText}
          onChange={e => setConfigText(e.target.value)}
          rows={9}
          spellCheck={false}
          className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-xs font-mono focus:border-kdpl-neon outline-none"
        />
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        <div className="flex gap-2 mt-3">
          <button onClick={handleSaveConfig}
            className={`flex-1 py-3 rounded-xl font-oswald font-bold text-sm transition-all ${saved ? 'bg-green-500 text-white' : 'bg-kdpl-neon text-kdpl-darker'}`}>
            {saved ? '✓ Saved — Reload Page Now' : 'Save Config'}
          </button>
          {saved && (
            <button onClick={() => window.location.reload()}
              className="px-4 py-3 rounded-xl bg-kdpl-darker border border-kdpl-border text-kdpl-text flex items-center gap-1.5 text-sm">
              <RefreshIcon size={14} /> Reload
            </button>
          )}
        </div>
      </div>

      {/* Recommended Firestore Rules */}
      <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4">
        <div className="text-kdpl-muted text-xs font-semibold uppercase tracking-wide mb-2">Firestore Security Rules</div>
        <p className="text-kdpl-muted text-[11px] mb-2">
          Paste this into Firebase Console → Firestore Database → Rules (don't forget to click Publish). This enforces that only the organizer who owns a tournament (or the Super Admin) can edit or delete it — at the database level, not just in this app's UI.
        </p>
        <pre className="bg-kdpl-darker border border-kdpl-border rounded-xl p-3 text-[10px] text-kdpl-text overflow-x-auto whitespace-pre-wrap font-mono">{FIRESTORE_RULES}</pre>
        <button onClick={handleCopyRules}
          className="w-full mt-2 py-2.5 rounded-xl bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs font-medium flex items-center justify-center gap-1.5">
          {copiedRules ? <><CheckIcon size={12} className="text-green-400" /> Copied!</> : <><ClipboardIcon size={12} /> Copy Rules</>}
        </button>
        <p className="text-kdpl-muted text-[10px] mt-2">
          Note: teams, players, venues, fixtures and series still share one document per app, so these rules can't yet fully isolate one organizer's data from another's at that level — only tournaments and live matches are fully protected per-record right now.
        </p>
      </div>

      {/* Super Admin allowlist */}
      <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4">
        <div className="text-kdpl-muted text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <ShieldIcon size={14} /> Super Admin Emails
        </div>
        <p className="text-kdpl-muted text-[11px] mb-2">
          Any email added here becomes a Super Admin (full app control) once it signs in via Firebase Auth. Create that account in Firebase Console → Authentication first.
        </p>
        <div className="flex gap-2 mb-2">
          <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
            placeholder="admin@example.com"
            className="flex-1 bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none" />
          <button onClick={handleAddEmail}
            className="px-4 py-2.5 rounded-xl bg-kdpl-neon text-kdpl-darker text-sm font-bold">Add</button>
        </div>
        <div className="flex flex-col gap-1.5">
          {superAdminEmails.length === 0 && <p className="text-kdpl-muted text-xs italic">No Super Admin emails yet.</p>}
          {superAdminEmails.map(email => (
            <div key={email} className="flex items-center justify-between bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2">
              <span className="text-kdpl-text text-xs">{email}</span>
              <button onClick={() => removeSuperAdminEmail(email)} className="text-red-400"><XIcon size={13} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* PIN reset — Super Admin only */}
      {isSuperAdmin ? (
        <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4">
          <div className="text-kdpl-muted text-xs font-semibold uppercase tracking-wide mb-3">🔒 Setup PIN</div>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-kdpl-muted text-xs mb-1 block">Change Setup PIN (4 digits)</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={newPin}
                  onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  placeholder="New 4-digit PIN"
                  className="flex-1 bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none tracking-widest"
                />
                <button onClick={handlePinChange}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${pinChanged ? 'bg-green-500 text-white' : 'bg-red-500/20 border border-red-500/40 text-red-400'}`}>
                  {pinChanged ? '✓' : 'Change'}
                </button>
              </div>
              {pinError && <p className="text-red-400 text-xs mt-1">{pinError}</p>}
            </div>
            <p className="text-kdpl-muted text-[10px]">This PIN only unlocks Firebase config Settings — it does not grant tournament management access.</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4 opacity-70">
          <div className="text-kdpl-muted text-xs font-semibold uppercase tracking-wide mb-1">🔒 Setup PIN</div>
          <p className="text-kdpl-muted text-[11px]">Only a Super Admin can change the PIN.</p>
        </div>
      )}

      {/* Roles overview */}
      <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4">
        <div className="text-kdpl-muted text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <ShieldIcon size={14} /> Roles &amp; Access
        </div>
        <div className="flex flex-col gap-2.5">
          {[
            { role: 'Super Admin', desc: 'Full app control — all tournaments, users, ads, Firebase settings. Signs in via email allowlist + Firebase Auth.', color: 'text-red-400 border-red-500/30 bg-red-500/10' },
            { role: 'Organizer', desc: 'Creates their own account (Sign Up), creates their own tournament, and can only manage that tournament.', color: 'text-kdpl-neon border-kdpl-neon/30 bg-kdpl-neon/10' },
            { role: 'User', desc: 'A registered player/member record — signs up via the Setup page, approved by the Super Admin. No login, just a record.', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
            { role: 'Guest', desc: 'No login needed — can view all tournaments, matches, scores, and standings publicly (read-only).', color: 'text-kdpl-muted border-kdpl-border bg-kdpl-darker' },
          ].map(r => (
            <div key={r.role} className={`rounded-xl border p-3 ${r.color}`}>
              <div className="text-xs font-bold mb-0.5">{r.role}</div>
              <div className="text-[11px] opacity-80">{r.desc}</div>
            </div>
          ))}
        </div>
        <p className="text-kdpl-muted text-[10px] mt-3 flex items-center gap-1">
          <LockIcon size={10} /> Open "Manage → Users" to approve player registrations.
        </p>
      </div>
    </div>
  );
}
