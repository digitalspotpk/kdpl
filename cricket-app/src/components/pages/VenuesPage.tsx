// ═══════════════════════════════════════════════════════════════
// KDPL VENUES PAGE
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { PlusIcon, EditPenIcon, TrashIcon, MapPinIcon } from '../ui/Icons';
import type { KDPLStore } from '../../store/useKDPLStore';
import { genId } from '../../utils/id';
import type { Venue } from '../../types';

const PITCH_TYPES: Venue['pitchType'][] = ['Green', 'Flat', 'Dusty', 'Hard', 'Spin-Friendly'];
const PITCH_ICONS: Record<string, string> = { Green: '🌿', Flat: '🟫', Dusty: '🏜️', Hard: '🪨', 'Spin-Friendly': '🌀' };

export default function VenuesPage({ store }: { store: KDPLStore }) {
  const { state, addVenue, updateVenue, deleteVenue } = store;
  const { venues, isAdmin } = state;
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Venue | null>(null);
  const [form, setForm] = useState({ name: '', city: '', capacity: 5000, pitchType: 'Hard' as Venue['pitchType'], hasFloodlights: false, latitude: undefined as number | undefined, longitude: undefined as number | undefined });
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState('');

  const resetForm = () => { setForm({ name: '', city: '', capacity: 5000, pitchType: 'Hard', hasFloodlights: false, latitude: undefined, longitude: undefined }); setEditing(null); setLocateError(''); };

  const handleEdit = (venue: Venue) => {
    setEditing(venue);
    setForm({ name: venue.name, city: venue.city, capacity: venue.capacity, pitchType: venue.pitchType, hasFloodlights: venue.hasFloodlights, latitude: venue.latitude, longitude: venue.longitude });
    setShowForm(true);
  };

  const handleGetLiveLocation = () => {
    if (!navigator.geolocation) { setLocateError("Location isn't supported on this device/browser."); return; }
    if (!window.isSecureContext) { setLocateError('Location needs HTTPS — make sure you opened the site via https://.'); return; }
    setLocating(true);
    setLocateError('');

    const onSuccess = (pos: GeolocationPosition) => {
      setForm(f => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
      setLocating(false);
    };

    const errorMessage = (err: GeolocationPositionError) =>
      err.code === 1 ? 'Location permission denied — allow it in your browser/app settings and try again.'
      : err.code === 2 ? "Position unavailable — try moving outdoors or turning on your phone's GPS/Location."
      : 'Timed out getting a GPS fix — try again, ideally outdoors.';

    // First attempt: high-accuracy GPS
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      err => {
        if (err.code === 1) { setLocating(false); setLocateError(errorMessage(err)); return; }
        // Retry with a longer timeout and lower accuracy (works better indoors / on weak GPS)
        navigator.geolocation.getCurrentPosition(
          onSuccess,
          err2 => { setLocating(false); setLocateError(errorMessage(err2)); },
          { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editing) {
      updateVenue({ ...editing, ...form });
    } else {
      addVenue({ id: genId('v'), ...form, createdAt: Date.now() });
    }
    setShowForm(false); resetForm();
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-kdpl-text font-oswald font-bold text-xl">Venues</h2>
          <p className="text-kdpl-muted text-xs">{venues.length} registered venues</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setShowForm(true); resetForm(); }}
            className="flex items-center gap-2 bg-kdpl-neon text-kdpl-darker px-3 py-2 rounded-xl text-sm font-bold active:scale-95">
            <PlusIcon size={16} /> Add Venue
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <div className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4">
          <h3 className="text-kdpl-text font-oswald font-bold mb-4">{editing ? 'Edit Venue' : 'Add Venue'}</h3>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-kdpl-muted text-xs mb-1 block">Venue Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                  className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2 text-kdpl-text text-sm focus:border-kdpl-neon outline-none"
                  placeholder="KDPL Stadium" />
              </div>
              <div>
                <label className="text-kdpl-muted text-xs mb-1 block">City</label>
                <input value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))}
                  className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2 text-kdpl-text text-sm focus:border-kdpl-neon outline-none"
                  placeholder="Khoi Dara" />
              </div>
            </div>
            <div>
              <label className="text-kdpl-muted text-xs mb-1 block">Capacity</label>
              <input type="number" value={form.capacity} onChange={e => setForm(f => ({...f, capacity: Number(e.target.value)}))}
                className="w-full bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2 text-kdpl-text text-sm focus:border-kdpl-neon outline-none" />
            </div>
            <div>
              <label className="text-kdpl-muted text-xs mb-2 block">Pitch Type</label>
              <div className="flex gap-2 flex-wrap">
                {PITCH_TYPES.map(pt => (
                  <button key={pt} onClick={() => setForm(f => ({...f, pitchType: pt}))}
                    className={`px-3 py-1.5 rounded-xl text-xs border font-medium flex items-center gap-1 ${form.pitchType === pt ? 'bg-kdpl-neon text-kdpl-darker border-kdpl-neon' : 'bg-kdpl-darker border-kdpl-border text-kdpl-muted'}`}>
                    {PITCH_ICONS[pt]} {pt}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`w-12 h-6 rounded-full transition-all relative ${form.hasFloodlights ? 'bg-kdpl-neon' : 'bg-kdpl-border'}`}
                onClick={() => setForm(f => ({...f, hasFloodlights: !f.hasFloodlights}))}>
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${form.hasFloodlights ? 'left-6' : 'left-0.5'}`} />
              </div>
              <span className="text-kdpl-text text-sm">Has Floodlights 💡</span>
            </label>

            <div>
              <label className="text-kdpl-muted text-xs mb-1 block">Google Maps Live Location</label>
              <button type="button" onClick={handleGetLiveLocation} disabled={locating}
                className="w-full py-2.5 rounded-xl bg-kdpl-darker border border-kdpl-border text-kdpl-text text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60">
                <MapPinIcon size={14} className={locating ? 'animate-pulse text-kdpl-neon' : 'text-kdpl-neon'} />
                {locating ? 'Fetching location...' : form.latitude ? 'Update Location (while standing at the venue)' : 'Get Live Location (tap while standing at the venue)'}
              </button>
              {locateError && (
                <div className="mt-1.5">
                  <p className="text-red-400 text-xs">{locateError}</p>
                  <p className="text-kdpl-muted text-[10px] mt-1">
                    Tip: check that your <b>browser</b> (not just the phone) has location permission allowed for this site, and that you're using Chrome. If GPS still won't lock, enter coordinates manually below.
                  </p>
                </div>
              )}
              {form.latitude !== undefined && form.longitude !== undefined && (
                <p className="text-kdpl-muted text-[11px] mt-1.5">
                  📍 {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}
                </p>
              )}

              {/* Manual fallback — open Google Maps, long-press your spot, copy the coordinates */}
              <details className="mt-2">
                <summary className="text-kdpl-neon text-xs cursor-pointer select-none">Or enter coordinates manually</summary>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <input type="number" step="any" placeholder="Latitude"
                    value={form.latitude ?? ''}
                    onChange={e => setForm(f => ({ ...f, latitude: e.target.value === '' ? undefined : Number(e.target.value) }))}
                    className="bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2 text-kdpl-text text-sm outline-none" />
                  <input type="number" step="any" placeholder="Longitude"
                    value={form.longitude ?? ''}
                    onChange={e => setForm(f => ({ ...f, longitude: e.target.value === '' ? undefined : Number(e.target.value) }))}
                    className="bg-kdpl-darker border border-kdpl-border rounded-xl px-3 py-2 text-kdpl-text text-sm outline-none" />
                </div>
                <p className="text-kdpl-muted text-[10px] mt-1.5">
                  Open Google Maps → find the venue → long-press the exact spot → tap the coordinates shown to copy them → paste the two numbers above.
                </p>
              </details>
            </div>

            <div className="flex gap-3 mt-1">
              <button onClick={() => { setShowForm(false); resetForm(); }}
                className="flex-1 py-2.5 rounded-xl border border-kdpl-border text-kdpl-muted text-sm">Cancel</button>
              <button onClick={handleSave}
                className="flex-1 py-2.5 rounded-xl bg-kdpl-neon text-kdpl-darker font-bold text-sm">{editing ? 'Update' : 'Add Venue'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {venues.map(venue => (
          <div key={venue.id} className="rounded-2xl bg-kdpl-card border border-kdpl-border p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-kdpl-darker border border-kdpl-border flex items-center justify-center text-2xl">
                  🏟️
                </div>
                <div>
                  <h3 className="text-kdpl-text font-oswald font-bold text-base">{venue.name}</h3>
                  <div className="flex items-center gap-1 text-kdpl-muted text-xs mt-0.5">
                    <MapPinIcon size={10} />
                    <span>{venue.city}</span>
                  </div>
                </div>
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(venue)} className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <EditPenIcon size={14} />
                  </button>
                  <button onClick={() => deleteVenue(venue.id)} className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                    <TrashIcon size={14} />
                  </button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-kdpl-darker/50 rounded-xl p-2 text-center">
                <div className="text-kdpl-neon font-oswald font-bold text-base">{venue.capacity.toLocaleString()}</div>
                <div className="text-kdpl-muted text-[10px]">Capacity</div>
              </div>
              <div className="bg-kdpl-darker/50 rounded-xl p-2 text-center">
                <div className="text-sm mb-0.5">{PITCH_ICONS[venue.pitchType]}</div>
                <div className="text-kdpl-text text-[10px] font-medium">{venue.pitchType}</div>
                <div className="text-kdpl-muted text-[9px]">Pitch</div>
              </div>
              <div className="bg-kdpl-darker/50 rounded-xl p-2 text-center">
                <div className="text-base mb-0.5">{venue.hasFloodlights ? '💡' : '☀️'}</div>
                <div className="text-[10px] font-medium text-kdpl-text">{venue.hasFloodlights ? 'Night OK' : 'Day Only'}</div>
                <div className="text-kdpl-muted text-[9px]">Lights</div>
              </div>
            </div>
            {venue.latitude !== undefined && venue.longitude !== undefined && (
              <a href={`https://www.google.com/maps?q=${venue.latitude},${venue.longitude}`} target="_blank" rel="noopener noreferrer"
                className="mt-2.5 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-medium">
                <MapPinIcon size={12} /> View Live Location on Google Maps
              </a>
            )}
          </div>
        ))}
        {venues.length === 0 && (
          <div className="text-center py-12 text-kdpl-muted">
            <MapPinIcon size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No venues registered yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
