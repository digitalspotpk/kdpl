import type { Series, Fixture } from '../types';

export interface SeriesResult {
  matches: Fixture[];         // all fixtures linked to this series, in order
  completedCount: number;
  teamAWins: number;
  teamBWins: number;
  ties: number;
  decided: boolean;
  winnerId: string;           // '' until decided (or a tied fixed-length series)
  status: 'upcoming' | 'live' | 'completed';
  remaining: number;          // matches still to add, toward totalMatches (0 if best-of already decided)
}

export function computeSeriesResult(series: Series, fixtures: Fixture[]): SeriesResult {
  const matches = fixtures
    .filter(f => f.seriesId === series.id)
    .sort((a, b) => (a.seriesMatchNumber || 0) - (b.seriesMatchNumber || 0));
  const completed = matches.filter(f => f.status === 'completed' && f.result);

  let teamAWins = 0, teamBWins = 0, ties = 0;
  completed.forEach(f => {
    if (f.result!.winnerId === series.teamAId) teamAWins++;
    else if (f.result!.winnerId === series.teamBId) teamBWins++;
    else ties++;
  });

  const majority = Math.floor(series.totalMatches / 2) + 1;
  let decided = false;
  let winnerId = '';

  if (series.seriesType === 'best-of' && (teamAWins >= majority || teamBWins >= majority)) {
    decided = true;
    winnerId = teamAWins >= majority ? series.teamAId : series.teamBId;
  } else if (completed.length >= series.totalMatches && matches.length >= series.totalMatches) {
    decided = true;
    winnerId = teamAWins > teamBWins ? series.teamAId : teamBWins > teamAWins ? series.teamBId : '';
  }

  const status: SeriesResult['status'] = decided
    ? 'completed'
    : matches.some(f => f.status === 'live') || completed.length > 0
      ? 'live'
      : 'upcoming';

  const remaining = decided ? 0 : Math.max(0, series.totalMatches - matches.length);

  return { matches, completedCount: completed.length, teamAWins, teamBWins, ties, decided, winnerId, status, remaining };
}
