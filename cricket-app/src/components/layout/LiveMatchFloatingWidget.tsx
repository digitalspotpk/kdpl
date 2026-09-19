// ═══════════════════════════════════════════════════════════════
// KDPL LIVE MATCH FLOATING WIDGET — shown app-wide while a match is
// live, with a close button. Reappears for the next live match.
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { RadioIcon, XIcon, ChevronRightIcon } from '../ui/Icons';
import type { KDPLStore } from '../../store/useKDPLStore';

export default function LiveMatchFloatingWidget({ store }: { store: KDPLStore }) {
  const { state, navigate } = store;
  const { liveMatch, teams, currentPage } = state;
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  if (!liveMatch || liveMatch.status !== 'live') return null;
  if (liveMatch.id === dismissedId) return null;
  if (currentPage === 'scorer' || currentPage === 'live') return null; // already looking at it

  const teamA = teams.find(t => t.id === liveMatch.teamAId);
  const teamB = teams.find(t => t.id === liveMatch.teamBId);
  const innings = liveMatch.currentInnings === 1 ? liveMatch.innings1 : liveMatch.innings2;
  const battingTeam = teams.find(t => t.id === innings.teamId);
  const oversStr = `${innings.overs}.${innings.balls}`;

  return (
    <div className="absolute bottom-24 left-4 right-4 z-40 animate-slide-up">
      <div className="flex items-center gap-3 rounded-2xl bg-kdpl-card/95 backdrop-blur-md border border-red-500/40 shadow-2xl p-3">
        <button onClick={() => navigate('live')} className="flex items-center gap-3 flex-1 min-w-0 text-left">
          <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center flex-shrink-0">
            <RadioIcon size={16} className="text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
              <span className="text-red-400 text-[10px] font-bold tracking-wide">LIVE</span>
              <span className="text-kdpl-muted text-[10px] truncate">{teamA?.shortName} vs {teamB?.shortName}</span>
            </div>
            <div className="text-kdpl-text text-sm font-oswald font-bold truncate">
              {battingTeam?.shortName || '—'}: {innings.runs}/{innings.wickets} <span className="text-kdpl-muted font-normal text-xs">({oversStr} ov)</span>
            </div>
          </div>
          <ChevronRightIcon size={16} className="text-kdpl-muted flex-shrink-0" />
        </button>
        <button onClick={() => setDismissedId(liveMatch.id)}
          className="w-7 h-7 rounded-lg bg-kdpl-darker border border-kdpl-border flex items-center justify-center text-kdpl-muted flex-shrink-0">
          <XIcon size={12} />
        </button>
      </div>
    </div>
  );
}
