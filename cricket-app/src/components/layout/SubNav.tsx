// ═══════════════════════════════════════════════════════════════
// KDPL SUB-NAVIGATION PILL BAR
// ═══════════════════════════════════════════════════════════════

import type { KDPLStore } from '../../store/useKDPLStore';

interface SubNavProps {
  store: KDPLStore;
}

const TAB_SUBNAV: Record<string, Array<{ label: string; page: string }>> = {
  matches: [
    { label: 'Fixtures', page: 'fixtures' },
    { label: 'Series', page: 'series' },
    { label: 'Setup', page: 'tournament-config' },
  ],
  live: [
    { label: 'Live Now', page: 'live' },
    { label: 'Facebook Live', page: 'facebook-live' },
    { label: 'Archive', page: 'global' },
  ],
  manage: [
    { label: 'Tournaments', page: 'tournaments' },
    { label: 'Setup', page: 'tournament-config' },
    { label: 'Teams', page: 'teams' },
    { label: 'Venues', page: 'venues' },
    { label: 'Players', page: 'players' },
    { label: 'Toss', page: 'toss' },
    { label: 'Scorer', page: 'scorer' },
    { label: 'Scorecard', page: 'scorecard' },
    { label: 'Squad', page: 'squad' },
    { label: 'Shuffle', page: 'shuffle' },
    { label: 'Users', page: 'user-management' },
    { label: 'Data', page: 'data-management' },
    { label: 'Ads', page: 'ads-manager' },
    { label: 'Settings', page: 'app-settings' },
  ],
  stats: [
    { label: 'Points Table', page: 'standings' },
    { label: 'Analytics', page: 'analytics' },
  ],
};

const PAGE_TAB_MAP: Record<string, string> = {
  dashboard: 'home',
  fixtures: 'matches', 'tournament-config': 'matches',
  live: 'live', 'facebook-live': 'live', global: 'live',
  teams: 'manage', venues: 'manage', players: 'manage', squad: 'manage',
  toss: 'manage', scorer: 'manage', scorecard: 'manage', shuffle: 'manage',
  tournament: 'manage', 'user-management': 'manage', 'ads-manager': 'manage', 'app-settings': 'manage', 'data-management': 'manage',
  tournaments: 'manage', 'create-tournament': 'manage', 'organizer-auth': 'manage',
  standings: 'stats', analytics: 'stats', notifications: 'stats',
};

export default function SubNav({ store }: SubNavProps) {
  const { state, navigate } = store;
  const { currentPage } = state;
  const activeTab = PAGE_TAB_MAP[currentPage] || 'home';
  const pills = TAB_SUBNAV[activeTab];

  if (!pills || pills.length === 0) return null;

  return (
    <div className="flex-shrink-0 px-3 py-2 border-b border-kdpl-border bg-kdpl-darker/80 backdrop-blur-sm">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {pills.map(pill => (
          <button
            key={pill.page}
            onClick={() => navigate(pill.page)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap
              ${currentPage === pill.page
                ? 'bg-kdpl-neon text-kdpl-darker font-semibold shadow-lg shadow-kdpl-neon/30'
                : 'bg-kdpl-card text-kdpl-muted hover:text-kdpl-text hover:bg-kdpl-border'
              }`}
          >
            {pill.label}
          </button>
        ))}
      </div>
    </div>
  );
}
