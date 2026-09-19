// ═══════════════════════════════════════════════════════════════
// KDPL TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'CAPTAIN' | 'USER' | 'GUEST';

export type PlayerRole = 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket-Keeper';

export type TournamentFormat = 'Round-Robin' | 'Knockout' | 'Double-Elimination' | 'League';

export type MatchStatus = 'scheduled' | 'live' | 'completed' | 'abandoned';

export type StreamStatus = 'scheduled' | 'live' | 'ended';

export type BallType = 0 | 1 | 2 | 3 | 4 | 6 | 'W' | 'Wd' | 'Nb' | 'Lb' | 'B';

export type WicketType = 'Bowled' | 'Caught' | 'LBW' | 'Run-Out' | 'Stumped' | 'Hit-Wicket' | 'Obstructing';

export type NotificationType = 'match-start' | 'toss-result' | 'wicket-alert' | 'score-update' | 'registration-approved' | 'system-announcement' | 'boundary' | 'milestone';

export interface Team {
  id: string;
  tournamentId: string;
  name: string;
  shortName: string;
  color: string;
  logo: string;
  logoImageUrl: string;
  city: string;
  captain: string;
  sponsors: string[];
  wins: number;
  losses: number;
  ties: number;
  nrr: number;
  points: number;
  matchesPlayed: number;
  // Cumulative totals NRR is computed FROM (not just the final number) — this
  // is what makes Net Run Rate mathematically correct across the whole
  // tournament instead of an average of per-match rates. See finalizeMatch().
  nrrRunsFor: number;
  nrrOversFor: number;
  nrrRunsAgainst: number;
  nrrOversAgainst: number;
  createdAt: number;
}

export interface Player {
  id: string;
  tournamentId: string;
  name: string;
  role: PlayerRole;
  teamId: string;
  photo: string;
  battingStyle: string;
  bowlingStyle: string;
  banned: boolean;
  banReason: string;
  matches: number;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  fifties: number;
  hundreds: number;
  highScore: number;
  wickets: number;
  oversBowled: number;
  runsConceded: number;
  catches: number;
  stumpings: number;
  mvpScore: number;
  tier: 'Gold' | 'Silver' | 'Bronze';
  createdAt: number;
}

export interface Venue {
  id: string;
  tournamentId: string;
  name: string;
  city: string;
  capacity: number;
  pitchType: 'Green' | 'Flat' | 'Dusty' | 'Hard' | 'Spin-Friendly';
  hasFloodlights: boolean;
  latitude?: number;
  longitude?: number;
  createdAt: number;
}

export interface FixtureUmpire {
  id: string;
  name: string;
  city: string;
}

export interface Fixture {
  id: string;
  tournamentId: string;
  round: number;
  stage: 'group' | 'quarter-final' | 'semi-final' | 'final';
  matchNumber: number;
  teamAId: string;
  teamBId: string;
  venueId: string;
  date: string;
  time: string;
  slot: 'Day' | 'Night';
  status: MatchStatus;
  overs: number;
  umpires: FixtureUmpire[];
  result?: MatchResult;
  toss?: TossResult;
  createdAt: number;
  // Optional link to a Series (see Series below) — when set, this fixture
  // is one game of that series rather than (or in addition to) a regular
  // tournament fixture.
  seriesId?: string;
  seriesMatchNumber?: number;
}

// A Series groups several matches between the same two teams into one
// head-to-head contest (e.g. "3-match T20 Series") that's tracked and
// decided separately from the tournament's points table. The series
// result (score line, decided/undecided) is always computed on the fly
// from its linked Fixtures — see utils/series.ts — rather than stored as
// separate mutable state, so it can never drift out of sync with the
// actual match results.
export interface Series {
  id: string;
  tournamentId: string;
  name: string;
  teamAId: string;
  teamBId: string;
  totalMatches: number;
  seriesType: 'best-of' | 'fixed';
  createdAt: number;
}

export interface MatchResult {
  winnerId: string;
  loserTeamId: string;
  teamAScore: number;
  teamBScore: number;
  teamAOvers: string;
  teamBOvers: string;
  margin: string;
  manOfMatch: string;
}

export interface TossResult {
  winner: string;
  call: 'Heads' | 'Tails';
  result: 'Heads' | 'Tails';
  decision: 'Bat First' | 'Bowl First';
}

export interface TournamentOfficial {
  id: string;
  name: string;
  role: 'Organizer' | 'Committee Member';
  whatsapp: string;
}

export interface TournamentBroadcaster {
  id: string;
  name: string;
  whatsapp: string;
}

export interface Tournament {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  banner: string;
  format: TournamentFormat;
  overs: number;
  startDate: string;
  endDate: string;
  venue: string;
  status: 'upcoming' | 'active' | 'completed';
  teamCount: number;
  playersPerTeam: number;
  prizePool: string;
  organizer: string;
  organizerUid: string;
  organizerEmail: string;
  customRules: string[];
  officials: TournamentOfficial[];
  broadcasters: TournamentBroadcaster[];
  createdAt: number;
}

export interface OrganizerProfile {
  uid: string;
  email: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

export interface BallEvent {
  id: string;
  ball: number;
  over: number;
  runs: number;
  extras: number;
  extraType: '' | 'Wide' | 'No-Ball' | 'Leg-Bye' | 'Bye';
  isWicket: boolean;
  wicketType: WicketType | '';
  batsmanId: string;
  bowlerId: string;
  fielderId: string;
  // Only meaningful when wicketType === 'Run-Out': which of the two batters
  // (striker or non-striker) was actually the one run out. Without this the
  // app always assumed the striker was out, which is wrong whenever the
  // non-striker is the one dismissed.
  runOutBatsmanId?: string;
  commentary: string;
  timestamp: number;
}

export interface Innings {
  teamId: string;
  battingOrder: string[];
  currentBatter1: string;
  currentBatter2: string;
  currentBowler: string;
  runs: number;
  wickets: number;
  overs: number;
  balls: number;
  extras: number;
  target: number;
  ballEvents: BallEvent[];
  playerStats: Record<string, PlayerInningsStats>;
  bowlerStats: Record<string, BowlerInningsStats>;
  partnerships: Partnership[];
  fallOfWickets: FallOfWicket[];
}

export interface PlayerInningsStats {
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  wicketType: string;
  bowlerId: string;
  fielderId: string;
  strikeRate: number;
}

export interface BowlerInningsStats {
  overs: number;
  balls: number;
  runs: number;
  wickets: number;
  maidens: number;
  economy: number;
}

export interface Partnership {
  batter1Id: string;
  batter2Id: string;
  runs: number;
  balls: number;
}

export interface FallOfWicket {
  score: number;
  wicket: number;
  batsmanId: string;
  over: string;
}

export interface UndoSnapshot {
  ball: BallEvent;
  innings: 1 | 2;
  prevBatter1: string;
  prevBatter2: string;
  prevBowler: string;
  prevLastOverBowlerId: string;
}

export interface LiveMatch {
  id: string;
  tournamentId: string;
  fixtureId: string;
  teamAId: string;
  teamBId: string;
  status: MatchStatus;
  currentInnings: 1 | 2;
  innings1: Innings;
  innings2: Innings;
  overs: number;
  toss: TossResult;
  undoStack: UndoSnapshot[];
  lastOverBowlerId: string;
  // True right after a No-Ball, cleared after the next ball is resolved.
  // While true, a dismissal on that next ball (other than Run-Out) doesn't
  // count — standard "free hit" rule.
  freeHit?: boolean;
  startedAt: number;
  updatedAt: number;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  role: Role;
  preferredRole: PlayerRole | 'Viewer Only';
  status: 'pending' | 'approved' | 'rejected' | 'banned';
  createdAt: number;
  lastLogin: number;
  assignedTeam?: string;
  assignedMatch?: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  timestamp: number;
  targetPage?: string;
  data?: Record<string, string>;
}

export interface FacebookStream {
  id: string;
  matchId: string;
  matchTitle: string;
  embedUrl: string;
  title: string;
  broadcasterName: string;
  scheduledTime: string;
  status: StreamStatus;
  createdBy: string;
  createdAt: number;
}

export interface AdSlot {
  id: string;
  name: string;
  position: 'dashboard-top' | 'dashboard-mid' | 'fixtures-top' | 'standings-top' | 'scorecard-bottom' | 'live-sidebar';
  adCode: string;
  enabled: boolean;
  createdAt: number;
}

export interface AppState {
  currentPage: string;
  currentTab: string;
  isAdmin: boolean;        // true if user can manage the ACTIVE tournament (Super Admin OR its Organizer)
  isSuperAdmin: boolean;
  hasSetupAccess: boolean; // PIN-based — unlocks Firebase bootstrap Settings ONLY, not tournament management
  authUid: string | null;
  authEmail: string | null;
  userRole: Role;
  user: UserProfile | null;
  tournaments: Tournament[];       // ALL tournaments, across all organizers (public listing)
  activeTournamentId: string | null;
  tournament: Tournament | null;   // derived: tournaments.find(t => t.id === activeTournamentId)
  organizers: OrganizerProfile[];  // organizer accounts + their approval status
  organizerProfile: OrganizerProfile | null; // derived: the signed-in user's own organizer profile
  teams: Team[];                   // derived: filtered to activeTournamentId
  players: Player[];               // derived: filtered to activeTournamentId
  venues: Venue[];                 // derived: filtered to activeTournamentId
  fixtures: Fixture[];             // derived: filtered to activeTournamentId
  series: Series[];                // derived: filtered to activeTournamentId
  liveMatch: LiveMatch | null;     // derived: filtered to activeTournamentId
  liveMatches: LiveMatch[];        // derived: ALL currently-live matches in the active tournament
  activeFixtureId: string | null;  // which fixture the Toss/Scorer/Live pages are pointed at
  notifications: Notification[];
  adSlots: AdSlot[];
  supportWhatsapp: string;
  superAdminEmails: string[];
  theme: 'dark' | 'light';
  lang: 'en' | 'ur';
  isOnline: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline';
  writeQueue: number;
}

export type Page = 
  | 'dashboard'
  | 'tournaments'
  | 'create-tournament'
  | 'organizer-auth'
  | 'teams'
  | 'venues'
  | 'players'
  | 'tournament'
  | 'fixtures'
  | 'series'
  | 'series-detail'
  | 'scorer'
  | 'standings'
  | 'analytics'
  | 'scorecard'
  | 'setup'
  | 'squad'
  | 'toss'
  | 'live'
  | 'global'
  | 'tournament-config'
  | 'shuffle'
  | 'facebook-live'
  | 'user-management'
  | 'data-management'
  | 'notifications'
  | 'ads-manager'
  | 'app-settings';
