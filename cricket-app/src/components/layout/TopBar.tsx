// ═══════════════════════════════════════════════════════════════
// KDPL TOP APP BAR
// ═══════════════════════════════════════════════════════════════


import { useState } from 'react';
import { SunIcon, MoonIcon, BellIcon, ShieldIcon, WifiOffIcon, LogoutIcon, XIcon, SettingsIcon, ArrowLeftIcon } from '../ui/Icons';
import type { KDPLStore } from '../../store/useKDPLStore';

interface TopBarProps {
  store: KDPLStore;
  onBellClick: () => void;
  unreadCount: number;
}

export default function TopBar({ store, onBellClick, unreadCount }: TopBarProps) {
  const { state, setTheme, logoutAdmin, navigate, goBack } = store;
  const { tournament, theme, isSuperAdmin, hasSetupAccess, authUid, authEmail, isOnline, syncStatus, liveMatch, pageHistory, currentPage } = state;
  const isLive = liveMatch?.status === 'live';
  const [confirmLogout, setConfirmLogout] = useState(false);
  const roleLabel = isSuperAdmin ? 'Super Admin' : authUid ? 'Organizer' : 'Setup Access';
  const showBack = pageHistory.length > 0 && currentPage !== 'dashboard';

  return (
    <div className="flex items-center justify-between px-3 h-14 border-b border-kdpl-border bg-kdpl-darker/95 backdrop-blur-sm relative z-50 flex-shrink-0">
      {/* Back button */}
      {showBack && (
        <button onClick={goBack}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-kdpl-muted hover:text-kdpl-text hover:bg-kdpl-card transition-all flex-shrink-0 mr-1"
          aria-label="Back">
          <ArrowLeftIcon size={18} />
        </button>
      )}

      {/* Logo + Title — tap to browse all tournaments */}
      <button onClick={() => navigate('tournaments')} className="flex items-center gap-2 min-w-0 text-left">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-kdpl-green to-kdpl-neon flex items-center justify-center flex-shrink-0 shadow-lg shadow-kdpl-neon/20">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M4 20L20 4" /><path d="M4 20l4-1 12-15-1 4" />
            <circle cx="19" cy="5" r="2" fill="white" stroke="none" />
          </svg>
        </div>
        <div className="min-w-0">
          <div className="text-kdpl-neon font-oswald font-bold text-sm leading-none tracking-wide">KDPL</div>
          <div className="text-kdpl-text/60 text-xs truncate max-w-[140px] leading-none mt-0.5">
            {tournament?.shortName || 'All Tournaments'}
          </div>
        </div>
        {/* Live indicator */}
        {isLive && (
          <div className="flex items-center gap-1 bg-red-500/20 border border-red-500/40 rounded-full px-2 py-0.5 ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 text-[10px] font-bold tracking-wide">LIVE</span>
          </div>
        )}
      </button>

      {/* Right Controls */}
      <div className="flex items-center gap-1">
        {/* Sync / Online dot */}
        <div className="flex items-center gap-1 mr-1">
          {isOnline ? (
            <div className={`w-2 h-2 rounded-full ${syncStatus === 'synced' ? 'bg-kdpl-neon' : syncStatus === 'syncing' ? 'bg-yellow-400 animate-pulse' : 'bg-orange-400'}`} title={syncStatus} />
          ) : (
            <WifiOffIcon size={14} className="text-orange-400" />
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-kdpl-muted hover:text-kdpl-text hover:bg-kdpl-card transition-all"
        >
          {theme === 'dark' ? <SunIcon size={16} /> : <MoonIcon size={16} />}
        </button>

        {/* Notifications bell */}
        <button
          onClick={onBellClick}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-kdpl-muted hover:text-kdpl-text hover:bg-kdpl-card transition-all relative"
        >
          <BellIcon size={16} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Settings (Firebase config / Setup PIN) — always reachable */}
        <button
          onClick={() => navigate('app-settings')}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-kdpl-muted hover:text-kdpl-text hover:bg-kdpl-card transition-all"
          title="App Settings"
        >
          <SettingsIcon size={16} />
        </button>

        {/* Signed in badge — tap to logout, or Sign In link for guests */}
        {(authUid || hasSetupAccess) ? (
          <div className="relative">
            <button
              onClick={() => setConfirmLogout(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-kdpl-green/20 border border-kdpl-green/40 cursor-pointer hover:bg-kdpl-green/30 transition-all"
              title={`${roleLabel} — tap to logout`}
            >
              <ShieldIcon size={14} className="text-kdpl-neon" />
            </button>

            {confirmLogout && (
              <>
                <div className="fixed inset-0 z-[60]" onClick={() => setConfirmLogout(false)} />
                <div className="absolute right-0 top-10 z-[61] w-52 bg-kdpl-card border border-kdpl-border rounded-xl shadow-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-kdpl-text text-xs font-semibold">{roleLabel}</span>
                    <button onClick={() => setConfirmLogout(false)} className="text-kdpl-muted"><XIcon size={12} /></button>
                  </div>
                  {authEmail && <div className="text-kdpl-muted text-[10px] mb-2 truncate">{authEmail}</div>}
                  <button
                    onClick={() => { logoutAdmin(); setConfirmLogout(false); }}
                    className="w-full py-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <LogoutIcon size={13} /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button onClick={() => navigate('organizer-auth')}
            className="px-2.5 h-8 rounded-lg flex items-center text-kdpl-muted hover:text-kdpl-neon text-xs font-medium">
            Sign In
          </button>
        )}
      </div>
    </div>
  );
}
