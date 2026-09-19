// ═══════════════════════════════════════════════════════════════
// KDPL FACEBOOK LIVE INTEGRATION
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { genId } from '../../utils/id';
import { FacebookIcon, PlusIcon, ShareIcon } from '../ui/Icons';
import type { KDPLStore } from '../../store/useKDPLStore';
import type { FacebookStream } from '../../types';

const LS_KEY = 'kdpl_fb_streams';
const CLOUD_DOC = doc(db, 'kdpl', 'data');
function getSavedStreams(): FacebookStream[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
function saveStreams(streams: FacebookStream[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(streams));
  setDoc(CLOUD_DOC, { facebookStreams: streams }, { merge: true }).catch(e => console.warn('Cloud sync failed', e));
}

export default function FacebookLivePage({ store }: { store: KDPLStore }) {
  const { state, navigate } = store;
  const { isAdmin, fixtures, teams, liveMatch } = state;
  const [streams, setStreams] = useState<FacebookStream[]>(getSavedStreams());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ matchId: '', embedUrl: '', title: '', broadcasterName: '', scheduledTime: '', status: 'scheduled' as FacebookStream['status'] });
  const [selectedStream, setSelectedStream] = useState<FacebookStream | null>(streams.find(s => s.status === 'live') || null);

  // Cloud sync — see the same live streams on every device
  useEffect(() => {
    const unsub = onSnapshot(CLOUD_DOC, snap => {
      const data = snap.data();
      if (data?.facebookStreams !== undefined) {
        const cloudStreams = data.facebookStreams as FacebookStream[];
        setStreams(cloudStreams);
        localStorage.setItem(LS_KEY, JSON.stringify(cloudStreams));
      }
    }, e => console.warn('Cloud sync unavailable:', e.message));
    return () => unsub();
  }, []);

  const activeStream = streams.find(s => s.status === 'live');

  const handleSave = () => {
    if (!form.embedUrl.trim()) return;
    const fixture = fixtures.find(f => f.id === form.matchId);
    const ta = teams.find(t => t.id === fixture?.teamAId);
    const tb = teams.find(t => t.id === fixture?.teamBId);
    const stream: FacebookStream = {
      id: genId('fs'),
      matchId: form.matchId,
      matchTitle: fixture ? `${ta?.name} vs ${tb?.name}` : form.title,
      embedUrl: form.embedUrl,
      title: form.title,
      broadcasterName: form.broadcasterName,
      scheduledTime: form.scheduledTime,
      status: form.status,
      createdBy: 'admin',
      createdAt: Date.now(),
    };
    const updated = [...streams, stream];
    setStreams(updated);
    saveStreams(updated);
    setShowForm(false);
    setForm({ matchId: '', embedUrl: '', title: '', broadcasterName: '', scheduledTime: '', status: 'scheduled' });
  };

  const updateStatus = (id: string, status: FacebookStream['status']) => {
    const updated = streams.map(s => s.id === id ? { ...s, status } : s);
    setStreams(updated);
    saveStreams(updated);
    if (status === 'live') {
      const stream = updated.find(s => s.id === id);
      if (stream) setSelectedStream(stream);
    }
  };

  const deleteStream = (id: string) => {
    const updated = streams.filter(s => s.id !== id);
    setStreams(updated);
    saveStreams(updated);
    if (selectedStream?.id === id) setSelectedStream(null);
  };

  const handleShare = async () => {
    if (!selectedStream) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `🔴 LIVE: ${selectedStream.matchTitle}`,
          text: `Watch ${selectedStream.matchTitle} live on KD Premier League!`,
          url: window.location.href,
        });
      }
    } catch (e) { console.warn(e); }
  };

  const getFbEmbedSrc = (url: string) => {
    if (url.includes('plugins/video.php')) return url;
    const encoded = encodeURIComponent(url);
    return `https://www.facebook.com/plugins/video.php?href=${encoded}&show_text=false&autoplay=1&mute=0`;
  };

  // Get the original Facebook watch URL back out (for the "Open in Facebook" fallback,
  // since Facebook's embed frequently refuses to play private/personal-profile videos —
  // the fallback still lets viewers watch directly on facebook.com or in the FB app).
  const getFbDirectUrl = (url: string) => {
    if (!url.includes('plugins/video.php')) return url;
    try {
      const params = new URL(url).searchParams;
      return params.get('href') || url;
    } catch { return url; }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <FacebookIcon size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-kdpl-text font-oswald font-bold text-xl">Facebook Live</h2>
            <p className="text-kdpl-muted text-xs">Watch matches live</p>
          </div>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-xl text-sm font-bold active:scale-95">
            <PlusIcon size={16} /> Add Stream
          </button>
        )}
      </div>

      {/* Active Stream Player */}
      {(selectedStream || activeStream) && (
        <div className="rounded-2xl bg-kdpl-card border border-kdpl-border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-kdpl-border bg-blue-900/30">
            <div className="flex items-center gap-2 min-w-0">
              {(selectedStream || activeStream)?.status === 'live' && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
              )}
              <div className="min-w-0">
                <span className="text-kdpl-text font-semibold text-sm block truncate">{(selectedStream || activeStream)?.matchTitle}</span>
                {(selectedStream || activeStream)?.broadcasterName && (
                  <span className="text-kdpl-muted text-[10px] block truncate">📹 {(selectedStream || activeStream)?.broadcasterName}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${(selectedStream || activeStream)?.status === 'live' ? 'bg-red-500 text-white' : 'bg-kdpl-border text-kdpl-muted'}`}>
                {(selectedStream || activeStream)?.status?.toUpperCase()}
              </span>
              <button onClick={handleShare} className="w-7 h-7 rounded-lg bg-kdpl-card border border-kdpl-border flex items-center justify-center text-kdpl-muted">
                <ShareIcon size={12} />
              </button>
            </div>
          </div>

          {/* Facebook iframe */}
          <div className="relative" style={{ paddingBottom: '56.25%' }}>
            {(selectedStream || activeStream)?.embedUrl ? (
              <iframe
                src={getFbEmbedSrc((selectedStream || activeStream)!.embedUrl)}
                className="absolute inset-0 w-full h-full"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                allowFullScreen
                title="Facebook Live Stream"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-kdpl-darker/80">
                <FacebookIcon size={40} className="text-blue-400 mb-3" />
                <p className="text-kdpl-muted text-sm">No stream URL configured</p>
              </div>
            )}
          </div>

          {/* Fallback — Facebook's embed often blocks personal/private videos,
              so always offer a direct link that's guaranteed to work */}
          {(selectedStream || activeStream)?.embedUrl && (
            <a href={getFbDirectUrl((selectedStream || activeStream)!.embedUrl)} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 bg-blue-600/10 border-t border-blue-600/20 text-blue-400 text-xs font-semibold">
              <FacebookIcon size={13} /> Video not playing? Watch directly on Facebook →
            </a>
          )}

          {/* Stream info */}
          <div className="p-3 text-xs text-kdpl-muted flex items-center justify-between">
            <span>{(selectedStream || activeStream)?.title}</span>
            {(selectedStream || activeStream)?.scheduledTime && (
              <span>📅 {(selectedStream || activeStream)?.scheduledTime}</span>
            )}
          </div>
        </div>
      )}

      {/* No active stream placeholder */}
      {!selectedStream && !activeStream && (
        <div className="rounded-2xl bg-kdpl-card border border-kdpl-border/60 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-600/30 flex items-center justify-center mx-auto mb-4">
            <FacebookIcon size={32} className="text-blue-400" />
          </div>
          <h3 className="text-kdpl-text font-oswald font-bold text-lg mb-2">Live Stream Will Appear Here</h3>
          <p className="text-kdpl-muted text-sm">Facebook Live stream will be embedded here when a match goes live</p>
          {isAdmin && (
            <button onClick={() => setShowForm(true)}
              className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold">
              Add Stream URL
            </button>
          )}
        </div>
      )}

      {/* Live Score mini-panel */}
      {liveMatch && (() => {
        const inns = liveMatch.currentInnings === 1 ? liveMatch.innings1 : liveMatch.innings2;
        const battingTeam = teams.find(t => t.id === inns.teamId);
        return (
        <div className="rounded-xl bg-kdpl-card border border-kdpl-border p-3 cursor-pointer" onClick={() => navigate('live')}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 text-xs font-bold">LIVE SCORE</span>
            </div>
            <span className="text-kdpl-neon text-xs">Full Score →</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">{battingTeam?.logo}</span>
              <span className="text-kdpl-text text-sm font-oswald font-bold">{battingTeam?.shortName}</span>
              <span className="text-kdpl-neon font-oswald font-bold text-lg">{inns.runs}/{inns.wickets}</span>
            </div>
            <span className="text-kdpl-muted text-xs">({inns.overs}.{inns.balls})</span>
          </div>
        </div>
        );
      })()}

      {/* Add Stream Form */}
      {showForm && isAdmin && (
        <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4">
          <h3 className="text-kdpl-text font-oswald font-bold mb-4">Add Facebook Live Stream</h3>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-kdpl-muted text-xs mb-1 block">Select Match (optional)</label>
              <select value={form.matchId} onChange={e => setForm(f => ({...f, matchId: e.target.value}))}
                className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm outline-none">
                <option value="">— Select Match —</option>
                {fixtures.map(f => {
                  const ta = teams.find(t => t.id === f.teamAId);
                  const tb = teams.find(t => t.id === f.teamBId);
                  return <option key={f.id} value={f.id}>M#{f.matchNumber} — {ta?.shortName} vs {tb?.shortName}</option>;
                })}
              </select>
            </div>
            <div>
              <label className="text-kdpl-muted text-xs mb-1 block">Stream Title</label>
              <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
                className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none"
                placeholder="KDPL Live — Match Title" />
            </div>
            <div>
              <label className="text-kdpl-muted text-xs mb-1 block">Facebook Video/Live URL *</label>
              <input value={form.embedUrl} onChange={e => setForm(f => ({...f, embedUrl: e.target.value}))}
                className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none"
                placeholder="https://www.facebook.com/video/..." />
              <div className="mt-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-2.5">
                <p className="text-yellow-400/90 text-[10px] leading-relaxed">
                  ⚠️ To avoid "video may not exist / no permission" errors:<br/>
                  • The video must be posted from a <b>Facebook Page</b>, not a personal profile (personal videos are blocked by Facebook's embed rules regardless of privacy).<br/>
                  • The Page post's privacy must be set to <b>Public</b>.<br/>
                  • Copy the link using the post's <b>"Copy link"</b> option (not a shortened fb.watch link, if possible).
                </p>
              </div>
            </div>
            <div>
              <label className="text-kdpl-muted text-xs mb-1 block">Broadcaster Name</label>
              <input value={form.broadcasterName} onChange={e => setForm(f => ({...f, broadcasterName: e.target.value}))}
                placeholder="Who's live-broadcasting this match?"
                className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none" />
            </div>
            <div>
              <label className="text-kdpl-muted text-xs mb-1 block">Scheduled Time (optional)</label>
              <input type="datetime-local" value={form.scheduledTime} onChange={e => setForm(f => ({...f, scheduledTime: e.target.value}))}
                className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2.5 text-kdpl-text text-sm focus:border-kdpl-neon outline-none" />
            </div>
            <div>
              <label className="text-kdpl-muted text-xs mb-2 block">Status</label>
              <div className="flex gap-2">
                {(['scheduled', 'live', 'ended'] as const).map(s => (
                  <button key={s} onClick={() => setForm(f => ({...f, status: s}))}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium border capitalize ${form.status === s ? 'bg-kdpl-neon text-kdpl-darker border-kdpl-neon' : 'bg-kdpl-darker border-kdpl-border text-kdpl-muted'}`}>
                    {s === 'live' ? '🔴' : s === 'scheduled' ? '📅' : '✅'} {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 mt-1">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-kdpl-border text-kdpl-muted text-sm">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm">Add Stream</button>
            </div>
          </div>
        </div>
      )}

      {/* Stream List */}
      {streams.length > 0 && (
        <div>
          <h3 className="text-kdpl-text font-oswald font-semibold text-sm uppercase tracking-wide mb-2">All Streams</h3>
          <div className="flex flex-col gap-2">
            {streams.map(stream => (
              <div key={stream.id} className={`rounded-xl bg-kdpl-card border p-3 cursor-pointer transition-all ${selectedStream?.id === stream.id ? 'border-blue-500/60' : 'border-kdpl-border'}`}
                onClick={() => setSelectedStream(stream)}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-kdpl-text text-sm font-semibold">{stream.matchTitle || stream.title}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stream.status === 'live' ? 'bg-red-500 text-white' : stream.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' : 'bg-kdpl-border text-kdpl-muted'}`}>
                      {stream.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="text-kdpl-muted text-xs truncate">{stream.embedUrl}</div>
                {stream.broadcasterName && <div className="text-kdpl-muted text-[10px] mt-0.5">📹 Broadcast by {stream.broadcasterName}</div>}
                {isAdmin && (
                  <div className="flex gap-2 mt-2">
                    {stream.status !== 'live' && (
                      <button onClick={e => { e.stopPropagation(); updateStatus(stream.id, 'live'); }}
                        className="px-2 py-1 bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] rounded-lg">🔴 Go Live</button>
                    )}
                    {stream.status === 'live' && (
                      <button onClick={e => { e.stopPropagation(); updateStatus(stream.id, 'ended'); }}
                        className="px-2 py-1 bg-kdpl-border text-kdpl-muted text-[10px] rounded-lg">End Stream</button>
                    )}
                    <button onClick={e => { e.stopPropagation(); deleteStream(stream.id); }}
                      className="px-2 py-1 bg-red-500/10 text-red-400 text-[10px] rounded-lg">Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
