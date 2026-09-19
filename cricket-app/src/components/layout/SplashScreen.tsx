// ═══════════════════════════════════════════════════════════════
// KDPL SPLASH SCREEN — animated app-load intro
// ═══════════════════════════════════════════════════════════════

interface SplashScreenProps {
  fadeOut: boolean;
}

export default function SplashScreen({ fadeOut }: SplashScreenProps) {
  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(15,81,50,0.55) 0%, #060e1a 65%)' }}
    >
      {/* Logo mark */}
      <div className="relative flex items-center justify-center" style={{ animation: 'kdpl-logo-in 0.7s cubic-bezier(0.34,1.56,0.64,1) both' }}>
        <div className="absolute w-28 h-28 rounded-full border-2 border-kdpl-neon/25" style={{ animation: 'kdpl-ring-pulse 2s ease-out infinite' }} />
        <div className="absolute w-28 h-28 rounded-full border border-kdpl-neon/15" style={{ animation: 'kdpl-ring-pulse 2s ease-out 0.6s infinite' }} />
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-kdpl-green to-kdpl-neon flex items-center justify-center shadow-2xl shadow-kdpl-neon/40">
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
            <path d="M4 20L20 4" /><path d="M4 20l4-1 12-15-1 4" />
            <circle cx="19" cy="5" r="2.3" fill="white" stroke="none" />
          </svg>
        </div>
      </div>

      {/* Wordmark */}
      <div className="mt-6 text-center" style={{ animation: 'kdpl-text-in 0.6s ease-out 0.35s both' }}>
        <div className="text-kdpl-neon font-oswald font-bold text-3xl tracking-[0.15em]">KDPL</div>
        <div className="text-kdpl-muted text-xs tracking-[0.2em] uppercase mt-1">Tournament Manager</div>
      </div>

      {/* Progress bar */}
      <div className="mt-9 w-40 h-1 rounded-full bg-kdpl-border/60 overflow-hidden" style={{ animation: 'kdpl-text-in 0.6s ease-out 0.5s both' }}>
        <div className="h-full bg-gradient-to-r from-kdpl-green to-kdpl-neon rounded-full" style={{ animation: 'kdpl-progress 1.3s ease-in-out 0.4s both' }} />
      </div>

      <style>{`
        @keyframes kdpl-logo-in {
          0% { opacity: 0; transform: scale(0.4) rotate(-15deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes kdpl-text-in {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes kdpl-ring-pulse {
          0% { transform: scale(0.85); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes kdpl-progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
