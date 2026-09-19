// ═══════════════════════════════════════════════════════════════
// KDPL TEAM BADGE — shows a team's custom avatar photo if set,
// otherwise falls back to their emoji/initials logo.
// ═══════════════════════════════════════════════════════════════

import type { Team } from '../../types';

interface TeamBadgeProps {
  team: Team | undefined;
  size?: number;
  className?: string;
}

export default function TeamBadge({ team, size = 40, className = '' }: TeamBadgeProps) {
  if (!team) {
    return (
      <div className={`rounded-full bg-kdpl-border flex items-center justify-center flex-shrink-0 ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.5 }}>
        ?
      </div>
    );
  }

  if (team.logoImageUrl) {
    return (
      <img
        src={team.logoImageUrl}
        alt={team.name}
        className={`rounded-full object-cover flex-shrink-0 border-2 ${className}`}
        style={{ width: size, height: size, borderColor: team.color }}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center flex-shrink-0 border-2 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.5, backgroundColor: team.color + '30', borderColor: team.color }}
    >
      {team.logo}
    </div>
  );
}
