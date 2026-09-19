// ═══════════════════════════════════════════════════════════════
// KDPL ANDROID MATERIAL BOTTOM NAVIGATION
// ═══════════════════════════════════════════════════════════════

import { HomeIcon, CalendarIcon, RadioIcon, EditIcon, BarChartIcon, LockIcon } from '../ui/Icons';
import type { KDPLStore } from '../../store/useKDPLStore';

interface BottomNavProps {
  store: KDPLStore;
}

const TABS = [
  { id: 'home', label: 'Home', icon: HomeIcon, page: 'dashboard' },
  { id: 'matches', label: 'Matches', icon: CalendarIcon, page: 'fixtures' },
  { id: 'live', label: 'Live', icon: RadioIcon, page: 'live' },
  { id: 'manage', label: 'Manage', icon: EditIcon, page: 'teams', adminOnly: true },
  { id: 'stats', label: 'Stats', icon: BarChartIcon, page: 'standings' },
] as const;

const PAGE_TAB_MAP: Record<string, string> = {
  dashboard: 'home',
  fixtures: 'matches', 'tournament-config': 'matches', setup: 'matches',
  live: 'live', 'facebook-live': 'live', global: 'live',
  teams: 'manage', venues: 'manage', players: 'manage', squad: 'manage',
  toss: 'manage', scorer: 'manage', scorecard: 'manage', shuffle: 'manage',
  tournament: 'manage', 'user-management': 'manage', 'ads-manager': 'manage', 'app-settings': 'manage',
  tournaments: 'manage', 'create-tournament': 'manage', 'organizer-auth': 'manage',
  standings: 'stats', analytics: 'stats', notifications: 'stats',
};

export default function BottomNav({ store }: BottomNavProps) {
  const { state, navigate } = store;
  const { currentPage, isAdmin, authUid, liveMatch } = state;
  const activeTab = PAGE_TAB_MAP[currentPage] || 'home';
  const isLive = liveMatch?.status === 'live';

  const handleTabClick = (tab: typeof TABS[number]) => {
    if (tab.id === 'manage' && !isAdmin) {
      navigate(authUid ? 'tournaments' : 'organizer-auth');
      return;
    }
    navigate(tab.page);
  };

  return (
    <div className="flex-shrink-0 h-16 border-t border-kdpl-border bg-kdpl-darker/95 backdrop-blur-md relative z-50">
      <div className="flex items-stretch h-full">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isManage = tab.id === 'manage';
          const isLiveTab = tab.id === 'live';
          const locked = isManage && !isAdmin;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-200 relative
                ${isActive
                  ? 'text-kdpl-neon'
                  : 'text-kdpl-muted hover:text-kdpl-text'
                }`}
              style={{ transform: isActive ? 'scale(1.05)' : 'scale(1)' }}
            >
              {/* Active pill indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-kdpl-neon rounded-full" />
              )}

              {/* Live pulse dot */}
              {isLiveTab && isLive && (
                <span className="absolute top-2 right-1/2 translate-x-5 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-kdpl-darker" />
              )}

              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
                ${isActive ? 'bg-kdpl-neon/10' : ''}`}>
                {locked ? (
                  <LockIcon size={18} className="text-kdpl-muted" />
                ) : (
                  <Icon size={18} />
                )}
              </div>
              <span className={`text-[10px] font-medium leading-none ${isActive ? 'text-kdpl-neon' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
