// ═══════════════════════════════════════════════════════════════
// KDPL SETUP-ACCESS PIN MODAL
// This PIN only unlocks the Firebase bootstrap Settings page.
// Organizer / Super Admin sign-in happens on its own page (real
// Firebase Auth accounts) — see OrganizerAuthPage.
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { XIcon, ShieldIcon } from '../ui/Icons';
import type { KDPLStore } from '../../store/useKDPLStore';

interface PinModalProps {
  store: KDPLStore;
  onClose: () => void;
  onSuccess: () => void;
}

const KEYPAD = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

export default function PinModal({ store, onClose, onSuccess }: PinModalProps) {
  const { loginAdmin } = store;
  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(300);
  const [shake, setShake] = useState(false);
  const [hint, setHint] = useState('Enter Setup PIN');

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (locked) {
      interval = setInterval(() => {
        setLockTimer(t => {
          if (t <= 1) { setLocked(false); setAttempts(0); setHint('Enter Setup PIN'); return 300; }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [locked]);

  useEffect(() => {
    if (pin.length === 4) {
      const success = loginAdmin(pin);
      if (success) {
        setHint('✓ Access Granted!');
        setTimeout(() => { onSuccess(); onClose(); }, 400);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setShake(true);
        setPin('');
        setTimeout(() => setShake(false), 600);
        if (newAttempts >= 5) {
          setLocked(true);
          setHint('Too many attempts — locked 5 min');
        } else {
          setHint(`Wrong PIN — ${5 - newAttempts} attempts left`);
        }
      }
    }
  }, [pin]);

  const handleKey = (k: string) => {
    if (locked) return;
    if (k === '⌫') { setPin(p => p.slice(0, -1)); return; }
    if (k === '') return;
    if (pin.length < 4) setPin(p => p + k);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const formatTime = (s: number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`w-full max-w-sm bg-kdpl-card border border-kdpl-border rounded-t-3xl p-6 transition-transform duration-300 ${shake ? 'animate-shake' : ''}`}
        onClick={e => e.stopPropagation()}
        style={{ animation: shake ? 'shake 0.5s ease-in-out' : undefined }}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-kdpl-border rounded-full mx-auto mb-5" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-kdpl-green/20 flex items-center justify-center border border-kdpl-green/40">
              <ShieldIcon size={20} className="text-kdpl-neon" />
            </div>
            <div>
              <div className="text-kdpl-text font-semibold font-oswald">Setup Access</div>
              <div className={`text-xs mt-0.5 ${locked ? 'text-red-400' : hint.includes('✓') ? 'text-kdpl-neon' : 'text-kdpl-muted'}`}>
                {locked ? `Locked — ${formatTime(lockTimer)}` : hint}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-kdpl-border/50 flex items-center justify-center text-kdpl-muted hover:text-kdpl-text">
            <XIcon size={16} />
          </button>
        </div>

        {/* PIN dots */}
        <div className="flex justify-center gap-4 mb-8">
          {[0,1,2,3].map(i => (
            <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-200
              ${pin.length > i ? 'bg-kdpl-neon border-kdpl-neon scale-110' : 'border-kdpl-border bg-transparent'}`}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3">
          {KEYPAD.map((k, i) => (
            <button
              key={i}
              onClick={() => handleKey(k)}
              disabled={locked || k === ''}
              className={`h-14 rounded-2xl text-xl font-semibold transition-all duration-150
                ${k === ''
                  ? 'invisible'
                  : k === '⌫'
                  ? 'bg-kdpl-border/60 text-kdpl-muted hover:bg-kdpl-border active:scale-90'
                  : 'bg-kdpl-darker border border-kdpl-border text-kdpl-text hover:bg-kdpl-border hover:text-kdpl-neon active:scale-90'
                }
                ${locked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
              `}
              style={{ fontFamily: 'Oswald, sans-serif' }}
            >
              {k}
            </button>
          ))}
        </div>

        <p className="text-center text-kdpl-muted text-xs mt-5">
          This PIN only unlocks Firebase Setup Settings.
        </p>
        <p className="text-center text-kdpl-muted text-xs mt-1">
          Sign in with an Organizer account to create/manage tournaments.
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 50%, 90% { transform: translateX(-8px); }
          30%, 70% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}
