// ═══════════════════════════════════════════════════════════════
// KDPL — KD PREMIER LEAGUE CRICKET TOURNAMENT MANAGER
// Complete Production App — React + TypeScript + Tailwind CSS
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useKDPLStore } from './store/useKDPLStore';

// Layout Components
import TopBar from './components/layout/TopBar';
import BottomNav from './components/layout/BottomNav';
import LiveMatchFloatingWidget from './components/layout/LiveMatchFloatingWidget';
import PullToRefresh from './components/layout/PullToRefresh';
import SubNav from './components/layout/SubNav';

// Pages
import Dashboard from './components/pages/Dashboard';
import TeamsPage from './components/pages/TeamsPage';
import PlayersPage from './components/pages/PlayersPage';
import VenuesPage from './components/pages/VenuesPage';
import FixturesPage from './components/pages/FixturesPage';
import SeriesPage from './components/pages/SeriesPage';
import SeriesDetailPage from './components/pages/SeriesDetailPage';
import LiveScorePage from './components/pages/LiveScorePage';
import ScorerPage from './components/pages/ScorerPage';
import StandingsPage from './components/pages/StandingsPage';
import AnalyticsPage from './components/pages/AnalyticsPage';
import ScorecardPage from './components/pages/ScorecardPage';
import TossPage from './components/pages/TossPage';
import SquadPage from './components/pages/SquadPage';
import ShufflePage from './components/pages/ShufflePage';
import TournamentConfigPage from './components/pages/TournamentConfigPage';
import FacebookLivePage from './components/pages/FacebookLivePage';
import NotificationsPage from './components/pages/NotificationsPage';
import UserManagementPage from './components/pages/UserManagementPage';
import DataManagementPage from './components/pages/DataManagementPage';
import AdsManagerPage from './components/pages/AdsManagerPage';
import GlobalArchivePage from './components/pages/GlobalArchivePage';
import SetupPage from './components/pages/SetupPage';
import AppSettingsPage from './components/pages/AppSettingsPage';
import TournamentsListPage from './components/pages/TournamentsListPage';
import CreateTournamentPage from './components/pages/CreateTournamentPage';
import OrganizerAuthPage from './components/pages/OrganizerAuthPage';
import SplashScreen from './components/layout/SplashScreen';

export default function App() {
  const store = useKDPLStore();
  const { state, navigate } = store;
  const { currentPage, theme, notifications } = state;

  const [showSplash, setShowSplash] = useState(true);
  const [splashFadeOut, setSplashFadeOut] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Apply theme to body
  useEffect(() => {
    document.body.classList.toggle('light-mode', theme === 'light');
  }, [theme]);

  // Animated splash on load — shows alone for ~2.5s, THEN the app mounts
  useEffect(() => {
    const t1 = setTimeout(() => setSplashFadeOut(true), 2100);
    const t2 = setTimeout(() => setShowSplash(false), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleBellClick = () => {
    navigate('notifications');
  };

  // Show ONLY the splash — app content doesn't mount underneath it at all
  if (showSplash) {
    return <SplashScreen fadeOut={splashFadeOut} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard store={store} />;
      case 'teams': return <TeamsPage store={store} />;
      case 'players': return <PlayersPage store={store} />;
      case 'venues': return <VenuesPage store={store} />;
      case 'fixtures': return <FixturesPage store={store} />;
      case 'series': return <SeriesPage store={store} />;
      case 'series-detail': return <SeriesDetailPage store={store} />;
      case 'live': return <LiveScorePage store={store} />;
      case 'scorer': return <ScorerPage store={store} />;
      case 'standings': return <StandingsPage store={store} />;
      case 'analytics': return <AnalyticsPage store={store} />;
      case 'scorecard': return <ScorecardPage store={store} />;
      case 'toss': return <TossPage store={store} />;
      case 'squad': return <SquadPage store={store} />;
      case 'shuffle': return <ShufflePage store={store} />;
      case 'tournament-config': return <TournamentConfigPage store={store} />;
      case 'facebook-live': return <FacebookLivePage store={store} />;
      case 'notifications': return <NotificationsPage store={store} />;
      case 'user-management': return <UserManagementPage store={store} />;
      case 'data-management': return <DataManagementPage store={store} />;
      case 'ads-manager': return <AdsManagerPage store={store} />;
      case 'app-settings': return <AppSettingsPage store={store} />;
      case 'tournaments': return <TournamentsListPage store={store} />;
      case 'create-tournament': return <CreateTournamentPage store={store} />;
      case 'organizer-auth': return <OrganizerAuthPage store={store} />;
      case 'global': return <GlobalArchivePage store={store} />;
      case 'tournament': return <TournamentConfigPage store={store} />;
      case 'setup': return <SetupPage store={store} />;
      default: return <Dashboard store={store} />;
    }
  };

  return (
    <div className="min-h-dvh w-full flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at 50% -20%, rgba(15,81,50,0.3) 0%, #060e1a 60%)' }}>
      
      {/* Phone Frame / App Shell */}
      <div id="kdpl-app-frame"
        className="w-full h-dvh flex flex-col bg-kdpl-darker relative overflow-hidden"
        style={{ fontFamily: 'Inter, sans-serif' }}>

        {/* Notch (desktop only — hidden on mobile via CSS) */}
        <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-kdpl-dark rounded-b-2xl z-50" />

        {/* TOP BAR */}
        <TopBar store={store} onBellClick={handleBellClick} unreadCount={unreadCount} />

        {/* SUB NAV */}
        <SubNav store={store} />

        {/* Offline Banner */}
        {!state.isOnline && (
          <div className="flex-shrink-0 flex items-center justify-center gap-2 py-1.5 bg-amber-500/20 border-b border-amber-500/30">
            <span className="text-amber-400 text-xs font-semibold">📡 You are offline — showing cached data</span>
          </div>
        )}

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col min-h-0 animate-slide-up" key={currentPage}>
          <PullToRefresh>
            {renderPage()}
          </PullToRefresh>
        </main>

        {/* Live match floating widget — shown app-wide */}
        <LiveMatchFloatingWidget store={store} />

        {/* BOTTOM NAVIGATION */}
        <BottomNav store={store} />

        {/* Splash gradient overlay at top */}
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-kdpl-neon/40 to-transparent" />
      </div>
    </div>
  );
}
