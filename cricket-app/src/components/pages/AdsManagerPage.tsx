// ═══════════════════════════════════════════════════════════════
// KDPL ADS MANAGER — AdSense/Custom Ad Slot Manager
// ═══════════════════════════════════════════════════════════════

import { CreditCardIcon, ToggleLeftIcon, ToggleRightIcon } from '../ui/Icons';
import { useState } from 'react';
import type { KDPLStore } from '../../store/useKDPLStore';
import type { AdSlot } from '../../types';

const POSITION_LABELS: Record<AdSlot['position'], string> = {
  'dashboard-top': '🏠 Dashboard — Top Banner',
  'dashboard-mid': '🏠 Dashboard — Mid Rectangle',
  'fixtures-top': '📅 Fixtures — Top Banner',
  'standings-top': '📊 Standings — Top Banner',
  'scorecard-bottom': '📋 Scorecard — Bottom',
  'live-sidebar': '🔴 Live — Sidebar',
};

const AD_TEMPLATES = [
  {
    name: 'Google AdSense — Auto',
    code: `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXXXXXXXXXXXXXXX" data-ad-slot="XXXXXXXXXX" data-ad-format="auto" data-full-width-responsive="true"></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>`,
  },
  {
    name: 'Google AdSense — Banner 728×90',
    code: `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
<ins class="adsbygoogle" style="display:inline-block;width:728px;height:90px" data-ad-client="ca-pub-XXXXXXXXXXXXXXXXX" data-ad-slot="XXXXXXXXXX"></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>`,
  },
  {
    name: 'Google AdSense — Rectangle 300×250',
    code: `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
<ins class="adsbygoogle" style="display:inline-block;width:300px;height:250px" data-ad-client="ca-pub-XXXXXXXXXXXXXXXXX" data-ad-slot="XXXXXXXXXX"></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>`,
  },
];

export default function AdsManagerPage({ store }: { store: KDPLStore }) {
  const { state, updateAdSlot } = store;
  const { adSlots, isSuperAdmin } = state;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState('');
  const [saved, setSaved] = useState<string | null>(null);

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center gap-2">
        <div className="text-4xl mb-2">🛡️</div>
        <h3 className="text-kdpl-text font-oswald font-bold text-xl">Super Admin Access Required</h3>
        <p className="text-kdpl-muted text-sm max-w-xs">Only the Super Admin can manage ads. Sign in with Firebase Auth.</p>
      </div>
    );
  }

  const handleToggle = (slot: AdSlot) => {
    updateAdSlot({ ...slot, enabled: !slot.enabled });
  };

  const startEdit = (slot: AdSlot) => {
    setEditingId(slot.id);
    setEditCode(slot.adCode);
  };

  const saveEdit = (slot: AdSlot) => {
    updateAdSlot({ ...slot, adCode: editCode });
    setEditingId(null);
    setSaved(slot.id);
    setTimeout(() => setSaved(null), 2000);
  };

  const applyTemplate = (code: string) => {
    setEditCode(code);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
          <CreditCardIcon size={20} className="text-yellow-400" />
        </div>
        <div>
          <h2 className="text-kdpl-text font-oswald font-bold text-xl">Ads Manager</h2>
          <p className="text-kdpl-muted text-xs">Google AdSense & custom ad slot configuration</p>
        </div>
      </div>

      {/* Setup Guide */}
      <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4">
        <div className="text-kdpl-muted text-xs font-semibold uppercase tracking-wide mb-3">📋 Setup Guide</div>
        <div className="flex flex-col gap-2">
          {[
            { step: '1', desc: 'Get your Google AdSense publisher ID (ca-pub-XXXXXXXX)' },
            { step: '2', desc: 'Create ad units in AdSense dashboard and get slot IDs' },
            { step: '3', desc: 'Paste the AdSense code into each slot below' },
            { step: '4', desc: 'Enable the slot with the toggle switch' },
            { step: '5', desc: 'Ads appear automatically on the designated pages' },
          ].map(item => (
            <div key={item.step} className="flex items-start gap-2.5 text-xs text-kdpl-muted">
              <span className="w-5 h-5 rounded bg-kdpl-neon/20 border border-kdpl-neon/30 text-kdpl-neon font-bold text-[10px] flex items-center justify-center flex-shrink-0">{item.step}</span>
              <span>{item.desc}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <p className="text-blue-400 text-[10px]">💡 Replace <code className="bg-blue-500/20 px-1 rounded">XXXXXXXXXXXXXXXXX</code> with your actual AdSense publisher ID and <code className="bg-blue-500/20 px-1 rounded">XXXXXXXXXX</code> with your ad slot ID</p>
        </div>
      </div>

      {/* Ad Templates */}
      <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4">
        <div className="text-kdpl-muted text-xs font-semibold uppercase tracking-wide mb-3">📦 Ad Code Templates</div>
        <div className="flex flex-col gap-2">
          {AD_TEMPLATES.map(tpl => (
            <div key={tpl.name} className="rounded-xl bg-kdpl-darker border border-kdpl-border p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-kdpl-text text-xs font-medium">{tpl.name}</span>
                {editingId && (
                  <button onClick={() => applyTemplate(tpl.code)}
                    className="text-[10px] text-kdpl-neon px-2 py-0.5 bg-kdpl-neon/10 rounded">Use</button>
                )}
              </div>
              <code className="text-[9px] text-kdpl-muted leading-relaxed block truncate opacity-70">
                {tpl.code.slice(0, 80)}...
              </code>
            </div>
          ))}
        </div>
      </div>

      {/* Ad Slots */}
      <div className="flex flex-col gap-3">
        {adSlots.map(slot => (
          <div key={slot.id} className={`rounded-2xl bg-kdpl-card border overflow-hidden transition-all ${slot.enabled ? 'border-kdpl-neon/40' : 'border-kdpl-border'}`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-kdpl-border">
              <div>
                <div className="text-kdpl-text text-sm font-semibold">{POSITION_LABELS[slot.position]}</div>
                <div className="text-kdpl-muted text-[10px] mt-0.5">
                  {slot.enabled ? <span className="text-kdpl-neon">✓ Active</span> : <span>Disabled</span>}
                  {slot.adCode ? <span className="ml-2">· Code configured</span> : <span className="ml-2 text-yellow-400">· No code</span>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {editingId === slot.id ? (
                  <button onClick={() => saveEdit(slot)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold ${saved === slot.id ? 'bg-green-500 text-white' : 'bg-kdpl-neon text-kdpl-darker'}`}>
                    {saved === slot.id ? '✓ Saved' : 'Save'}
                  </button>
                ) : (
                  <button onClick={() => startEdit(slot)}
                    className="px-3 py-1.5 rounded-xl text-xs bg-kdpl-darker border border-kdpl-border text-kdpl-muted">
                    Edit Code
                  </button>
                )}
                <button onClick={() => handleToggle(slot)} className="flex-shrink-0">
                  {slot.enabled
                    ? <ToggleRightIcon size={32} className="text-kdpl-neon" />
                    : <ToggleLeftIcon size={32} className="text-kdpl-muted" />}
                </button>
              </div>
            </div>

            {/* Code editor */}
            {editingId === slot.id && (
              <div className="p-4">
                <label className="text-kdpl-muted text-xs mb-2 block">Ad Code (HTML / AdSense script)</label>
                <textarea
                  value={editCode}
                  onChange={e => setEditCode(e.target.value)}
                  rows={6}
                  className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-xs font-mono focus:border-kdpl-neon outline-none resize-none leading-relaxed"
                  placeholder="Paste your Google AdSense code or custom HTML ad code here..."
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setEditCode('')}
                    className="px-3 py-1.5 text-xs text-kdpl-muted border border-kdpl-border rounded-lg">Clear</button>
                  <button onClick={() => { setEditingId(null); setEditCode(''); }}
                    className="px-3 py-1.5 text-xs text-kdpl-muted border border-kdpl-border rounded-lg">Cancel</button>
                </div>
              </div>
            )}

            {/* Preview if enabled and has code */}
            {slot.enabled && slot.adCode && editingId !== slot.id && (
              <div className="px-4 py-2 bg-kdpl-darker/30">
                <div className="text-[9px] text-kdpl-muted/50">Ad Preview (live on page)</div>
                <div className="text-[10px] text-kdpl-neon/60 font-mono truncate">{slot.adCode.slice(0, 60)}...</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="rounded-xl bg-kdpl-card border border-kdpl-border p-3">
        <div className="text-kdpl-muted text-[10px] leading-relaxed">
          <strong className="text-kdpl-text">⚠️ Important:</strong> Make sure your website is approved by Google AdSense before activating ads.
          Ad codes are stored locally and execute on the client side. Test on a deployed URL, not localhost.
        </div>
      </div>
    </div>
  );
}
