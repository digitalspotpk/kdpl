// ═══════════════════════════════════════════════════════════════
// KDPL GLOBAL STORE — Multi-tournament, localStorage + Firestore
// ═══════════════════════════════════════════════════════════════
//
// Data model: ALL tournaments/teams/players/venues/fixtures/live
// matches (across every Organizer) are synced in one shared Firestore
// doc, each entity tagged with a tournamentId. The store filters
// everything down to the ACTIVE tournament for the pages to consume,
// so existing pages (Teams, Players, Fixtures, Scorer, etc.) don't
// need to know multi-tournament exists — they just read
// state.teams / state.players / ... as before.
//
// Roles:
//  - hasSetupAccess (PIN, default 7254): unlocks ONLY the Firebase
//    bootstrap Settings page. Does NOT grant tournament management.
//  - Organizer: real Firebase Auth account (email/password, self
//    sign-up). Can manage ONLY the tournament(s) they created.
//  - Super Admin: Firebase Auth account whose email is in the
//    superAdminEmails allowlist. Can manage every tournament + users
//    + ads + app settings.
//  - isAdmin (used everywhere for edit-gating) = computed:
//    isSuperAdmin OR (signed-in organizer owns the active tournament)

import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, collection, deleteDoc, deleteField } from 'firebase/firestore';
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut,
} from 'firebase/auth';
import { db, auth } from '../firebase';
import { genId } from '../utils/id';
import type {
  AppState, Team, Player, Venue, Fixture, LiveMatch, Series,
  Tournament, Notification, OrganizerProfile, UndoSnapshot,
  AdSlot, BallEvent, PlayerInningsStats, BowlerInningsStats
} from '../types';

const CLOUD_DOC = doc(db, 'kdpl', 'data');

// Live matches carry the heaviest, fastest-growing data in the whole app
// (a full ball-by-ball record for every match, updated on every single
// ball). Keeping them as one field inside the shared "kdpl/data" document
// is what causes the app to eventually hit Firestore's 1MB-per-document
// limit as tournaments pile up -- after which ALL cloud sync silently stops
// for EVERY tournament, not just the one that grew too big.
//
// Each live match now lives in its own document in this collection
// instead, so document size scales with one match's data, not the whole
// app's history, and syncing many matches never contends over one write.
const LIVE_MATCHES_COLLECTION = collection(db, 'kdplLiveMatches');

// Tournaments get their own collection too — this is the record Firestore
// Security Rules actually need in order to enforce "only the organizer who
// owns a tournament (or the Super Admin) can edit/delete it" at the database
// level, not just in the app's UI. A rule can check
// `resource.data.organizerUid == request.auth.uid` on a document, but it
// can never do that for one entry buried inside an array field shared by
// every tournament on the app — which is what "tournaments" was before.
const TOURNAMENTS_COLLECTION = collection(db, 'kdplTournaments');

// One-time migration guard — see the CLOUD_DOC onSnapshot handler below.
let legacyTournamentsMigrated = false;
let legacyLiveMatchesMigrated = false;

// Tracks in-flight cloud writes so the UI can show an accurate "Syncing..."
// indicator instead of the old cosmetic-only counter that was declared in
// state but never actually incremented anywhere.
type QueueListener = (n: number) => void;
let pendingWrites = 0;
const queueListeners = new Set<QueueListener>();
function notifyQueue(): void { queueListeners.forEach(fn => fn(pendingWrites)); }
function subscribeWriteQueue(fn: QueueListener): () => void {
  queueListeners.add(fn);
  fn(pendingWrites);
  return () => { queueListeners.delete(fn); };
}

function cloudSet(field: string, value: unknown): void {
  pendingWrites++;
  notifyQueue();
  setDoc(CLOUD_DOC, { [field]: value }, { merge: true })
    .catch(e => console.warn('Cloud sync failed (will retry automatically once back online):', e))
    .finally(() => { pendingWrites = Math.max(0, pendingWrites - 1); notifyQueue(); });
}

// Tournaments are created/edited far less often than a live match gets a
// new ball, so no debouncing is needed here — just a plain per-document
// set/delete, one call per change.
function cloudSetTournament(t: Tournament): void {
  pendingWrites++;
  notifyQueue();
  setDoc(doc(TOURNAMENTS_COLLECTION, t.id), t)
    .catch(e => console.warn('Cloud sync failed (will retry automatically once back online):', e))
    .finally(() => { pendingWrites = Math.max(0, pendingWrites - 1); notifyQueue(); });
}

function cloudDeleteTournament(id: string): void {
  pendingWrites++;
  notifyQueue();
  deleteDoc(doc(TOURNAMENTS_COLLECTION, id))
    .catch(e => console.warn('Cloud sync failed (will retry automatically once back online):', e))
    .finally(() => { pendingWrites = Math.max(0, pendingWrites - 1); notifyQueue(); });
}

// -- Per-match live-match sync (own document, own debounce, own retry) --
const liveMatchDebounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};
const liveMatchPendingValue: Record<string, LiveMatch> = {};
const liveMatchHasPending: Record<string, boolean> = {};
const LIVE_MATCH_DEBOUNCE_MS = 700;

function flushLiveMatch(id: string): void {
  if (!liveMatchHasPending[id]) return;
  const value = liveMatchPendingValue[id];
  liveMatchHasPending[id] = false;
  delete liveMatchPendingValue[id];
  clearTimeout(liveMatchDebounceTimers[id]);
  delete liveMatchDebounceTimers[id];
  setDoc(doc(LIVE_MATCHES_COLLECTION, id), value)
    .catch(e => console.warn('Cloud sync failed (will retry automatically once back online):', e))
    .finally(() => { pendingWrites = Math.max(0, pendingWrites - 1); notifyQueue(); });
}

function flushAllLiveMatches(): void {
  Object.keys(liveMatchHasPending).forEach(flushLiveMatch);
}

// Ball-by-ball scoring calls this once per ball. Debouncing coalesces a
// burst of quick taps into a single network write per match instead of one
// per ball -- this matters a lot on a slow ground-side connection.
function cloudSetLiveMatch(lm: LiveMatch): void {
  if (!liveMatchHasPending[lm.id]) {
    liveMatchHasPending[lm.id] = true;
    pendingWrites++;
    notifyQueue();
  }
  liveMatchPendingValue[lm.id] = lm;
  clearTimeout(liveMatchDebounceTimers[lm.id]);
  liveMatchDebounceTimers[lm.id] = setTimeout(() => flushLiveMatch(lm.id), LIVE_MATCH_DEBOUNCE_MS);
}

function cloudDeleteLiveMatch(id: string): void {
  // Drop any not-yet-sent debounced write for this match -- it's moot now.
  liveMatchHasPending[id] = false;
  delete liveMatchPendingValue[id];
  clearTimeout(liveMatchDebounceTimers[id]);
  pendingWrites++;
  notifyQueue();
  deleteDoc(doc(LIVE_MATCHES_COLLECTION, id))
    .catch(e => console.warn('Cloud sync failed (will retry automatically once back online):', e))
    .finally(() => { pendingWrites = Math.max(0, pendingWrites - 1); notifyQueue(); });
}

// Flush immediately if the tab is being hidden/closed, so a debounced write
// scheduled a moment ago (e.g. the last ball before the organizer locks
// their phone) doesn't get silently dropped mid-wait.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushAllLiveMatches();
  });
  window.addEventListener('pagehide', flushAllLiveMatches);
}

function ls<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

function lsSet(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.warn('LS write failed', e); }
}

// djb2 hash — for the Setup Access PIN only
function hashPin(pin: string): string {
  let hash = 5381;
  for (let i = 0; i < 1024; i++) {
    for (let j = 0; j < pin.length; j++) {
      hash = ((hash << 5) + hash) ^ pin.charCodeAt(j);
      hash = hash & hash;
    }
  }
  return 'kdpl_' + Math.abs(hash).toString(16);
}

const DEFAULT_AD_SLOTS: AdSlot[] = [
  { id: 'ad1', name: 'Dashboard Top Banner', position: 'dashboard-top', adCode: '', enabled: false, createdAt: Date.now() },
  { id: 'ad2', name: 'Dashboard Mid Rectangle', position: 'dashboard-mid', adCode: '', enabled: false, createdAt: Date.now() },
  { id: 'ad3', name: 'Fixtures Top Banner', position: 'fixtures-top', adCode: '', enabled: false, createdAt: Date.now() },
  { id: 'ad4', name: 'Standings Top Banner', position: 'standings-top', adCode: '', enabled: false, createdAt: Date.now() },
  { id: 'ad5', name: 'Scorecard Bottom', position: 'scorecard-bottom', adCode: '', enabled: false, createdAt: Date.now() },
  { id: 'ad6', name: 'Live Sidebar', position: 'live-sidebar', adCode: '', enabled: false, createdAt: Date.now() },
];

// ── Internal state = AppState + the full unfiltered "all tournaments" data ──
interface RawStore {
  tournaments: Tournament[];
  activeTournamentId: string | null;
  organizers: OrganizerProfile[];
  allTeams: Team[];
  allPlayers: Player[];
  allVenues: Venue[];
  allFixtures: Fixture[];
  allSeries: Series[];
  allLiveMatches: LiveMatch[];
  authUid: string | null;
  authEmail: string | null;
  superAdminEmails: string[];
  hasSetupAccess: boolean;
  pageHistory: string[];
  // Which fixture the Toss/Scorer/Live pages are currently pointed at.
  // Lets multiple matches (different venues) be live at once in the same
  // tournament without one starting match wiping out another.
  activeFixtureId: string | null;
  // Which series the Series Detail page is currently showing.
  activeSeriesId: string | null;
}

interface InternalState extends AppState, RawStore {}

// Given the raw multi-tournament data, compute the per-active-tournament
// view (tournament/teams/players/venues/fixtures/liveMatch/isAdmin/isSuperAdmin).
function withDerived(s: InternalState): InternalState {
  const tournament = s.tournaments.find(t => t.id === s.activeTournamentId) || null;
  const isSuperAdmin = !!s.authEmail && s.superAdminEmails.map(e => e.toLowerCase()).includes(s.authEmail.toLowerCase());
  const organizerProfile = s.organizers.find(o => o.uid === s.authUid) || null;
  const isApprovedOrganizer = organizerProfile?.status === 'approved';
  const isOwner = !!tournament && !!s.authUid && tournament.organizerUid === s.authUid && isApprovedOrganizer;

  // Every live match currently running in this tournament — a tournament can
  // have more than one at once (different venues playing simultaneously), so
  // "the" live match is resolved with a priority chain rather than assuming
  // there's only ever one:
  //   1) the fixture the organizer explicitly selected (activeFixtureId)
  //   2) any match tagged with that id directly (back-compat)
  //   3) otherwise, just the first live one — keeps old single-match call
  //      sites (BottomNav badge, Dashboard widget, floating widget) working
  //      unchanged even though multiple matches can now coexist.
  const tournamentLiveMatches = s.allLiveMatches.filter(lm => lm.tournamentId === s.activeTournamentId);
  const liveMatch =
    tournamentLiveMatches.find(lm => lm.fixtureId === s.activeFixtureId) ||
    tournamentLiveMatches.find(lm => lm.id === s.activeFixtureId) ||
    tournamentLiveMatches.find(lm => lm.status === 'live') ||
    tournamentLiveMatches[0] ||
    null;

  return {
    ...s,
    tournament,
    organizerProfile,
    teams: s.allTeams.filter(t => t.tournamentId === s.activeTournamentId),
    players: s.allPlayers.filter(p => p.tournamentId === s.activeTournamentId),
    venues: s.allVenues.filter(v => v.tournamentId === s.activeTournamentId),
    fixtures: s.allFixtures.filter(f => f.tournamentId === s.activeTournamentId),
    series: s.allSeries.filter(sr => sr.tournamentId === s.activeTournamentId),
    liveMatch,
    liveMatches: tournamentLiveMatches.filter(lm => lm.status === 'live'),
    isSuperAdmin,
    isAdmin: isSuperAdmin || isOwner,
  };
}

// Rolls this match's ball-by-ball performance into each player's career totals
// (runs, wickets, catches, etc. on the Player record) — without this, per-player
// stats pages stay empty even though the match itself was fully scored.
function applyPlayerStats(allPlayers: Player[], lm: LiveMatch): Player[] {
  const allBatting: Record<string, PlayerInningsStats> = { ...lm.innings1.playerStats, ...lm.innings2.playerStats };
  const allBowling: Record<string, BowlerInningsStats> = { ...lm.innings1.bowlerStats, ...lm.innings2.bowlerStats };
  const allBalls = [...lm.innings1.ballEvents, ...lm.innings2.ballEvents];

  const participantIds = new Set([
    ...Object.keys(allBatting), ...Object.keys(allBowling),
    ...allBalls.filter(b => b.isWicket && b.fielderId).map(b => b.fielderId),
  ]);

  return allPlayers.map(p => {
    if (!participantIds.has(p.id)) return p;
    const bat = allBatting[p.id];
    const bowl = allBowling[p.id];
    const catches = allBalls.filter(b => b.isWicket && b.fielderId === p.id && (b.wicketType === 'Caught' || b.wicketType === 'Run-Out')).length;
    const stumpings = allBalls.filter(b => b.isWicket && b.fielderId === p.id && b.wicketType === 'Stumped').length;

    const runsThisMatch = bat?.runs || 0;
    const wicketsThisMatch = bowl?.wickets || 0;
    const oversThisMatch = (bowl?.overs || 0) + (bowl?.balls || 0) / 6;

    return {
      ...p,
      matches: p.matches + 1,
      runs: p.runs + runsThisMatch,
      balls: p.balls + (bat?.balls || 0),
      fours: p.fours + (bat?.fours || 0),
      sixes: p.sixes + (bat?.sixes || 0),
      fifties: p.fifties + (runsThisMatch >= 50 && runsThisMatch < 100 ? 1 : 0),
      hundreds: p.hundreds + (runsThisMatch >= 100 ? 1 : 0),
      highScore: Math.max(p.highScore, runsThisMatch),
      wickets: p.wickets + wicketsThisMatch,
      oversBowled: Math.round((p.oversBowled + oversThisMatch) * 10) / 10,
      runsConceded: p.runsConceded + (bowl?.runs || 0),
      catches: p.catches + catches,
      stumpings: p.stumpings + stumpings,
      mvpScore: p.mvpScore + runsThisMatch + wicketsThisMatch * 20 + (catches + stumpings) * 10,
    };
  });
}

// Computes the match result, updates the underlying Fixture, and updates
// both teams' win/loss/points/NRR — called when the 2nd innings ends.
// Finds the live match the Toss/Scorer/Live pages are currently pointed at,
// mirroring the same priority chain withDerived() uses for `state.liveMatch`
// — so every mutation (recordBall, undoBall, etc.) always acts on the exact
// match the organizer is looking at, never accidentally on a different
// concurrently-live match in the same tournament.
function findActiveLiveMatch(s: InternalState): LiveMatch | undefined {
  const inTournament = s.allLiveMatches.filter(lm => lm.tournamentId === s.activeTournamentId);
  return (
    inTournament.find(lm => lm.fixtureId === s.activeFixtureId) ||
    inTournament.find(lm => lm.id === s.activeFixtureId) ||
    inTournament.find(lm => lm.status === 'live') ||
    inTournament[0]
  );
}

function finalizeMatch(s: InternalState, lm: LiveMatch): InternalState {
  const teamAId = lm.teamAId;
  const teamBId = lm.teamBId;
  const inns1 = lm.innings1; // whichever team batted first
  const inns2 = lm.innings2;
  const team1Batted = inns1.teamId; // team that batted 1st
  const team2Batted = inns2.teamId; // team that batted 2nd (chasing)

  let winnerId = '';
  let loserId = '';
  let margin = 'Match Tied';
  if (inns2.runs > inns1.runs) {
    winnerId = team2Batted; loserId = team1Batted;
    const wicketsLeft = Math.max(0, (s.allPlayers.filter(p => p.teamId === team2Batted && p.tournamentId === s.activeTournamentId).length || 11) - 1 - inns2.wickets);
    margin = `${wicketsLeft} wicket${wicketsLeft === 1 ? '' : 's'}`;
  } else if (inns1.runs > inns2.runs) {
    winnerId = team1Batted; loserId = team2Batted;
    margin = `${inns1.runs - inns2.runs} run${inns1.runs - inns2.runs === 1 ? '' : 's'}`;
  }

  const teamAScore = teamAId === team1Batted ? inns1.runs : inns2.runs;
  const teamBScore = teamAId === team1Batted ? inns2.runs : inns1.runs;
  const teamAOvers = teamAId === team1Batted ? `${inns1.overs}.${inns1.balls}` : `${inns2.overs}.${inns2.balls}`;
  const teamBOvers = teamAId === team1Batted ? `${inns2.overs}.${inns2.balls}` : `${inns1.overs}.${inns1.balls}`;

  // Man of the match — highest run scorer across both innings (simple heuristic)
  const allBatters = [...Object.entries(inns1.playerStats), ...Object.entries(inns2.playerStats)];
  const mom = allBatters.sort((a, b) => b[1].runs - a[1].runs)[0];
  const momPlayer = mom ? s.allPlayers.find(p => p.id === mom[0]) : undefined;

  const allFixtures = s.allFixtures.map(f => f.id === lm.fixtureId ? {
    ...f,
    status: 'completed' as const,
    result: {
      winnerId, loserTeamId: loserId, teamAScore, teamBScore, teamAOvers, teamBOvers,
      margin, manOfMatch: momPlayer?.name || '',
    },
  } : f);

  const allTeams = s.allTeams.map(t => {
    if (t.id !== teamAId && t.id !== teamBId) return t;
    const isWinner = t.id === winnerId;
    const isTie = !winnerId;

    // Official NRR rule: if a team is bowled out (all out) before using its
    // full quota of overs, the overs entered for the NRR calculation are the
    // full allotted overs for the match — not the fewer overs it actually
    // took to bowl them out. Skipping this (as the old code did) makes NRR
    // too generous to teams that collapse quickly.
    const count1 = s.allPlayers.filter(p => p.teamId === team1Batted && p.tournamentId === s.activeTournamentId).length || 11;
    const count2 = s.allPlayers.filter(p => p.teamId === team2Batted && p.tournamentId === s.activeTournamentId).length || 11;
    const allOut1 = inns1.wickets >= Math.max(1, count1 - 1);
    const allOut2 = inns2.wickets >= Math.max(1, count2 - 1);
    const overs1 = allOut1 ? lm.overs : inns1.overs + inns1.balls / 6;
    const overs2 = allOut2 ? lm.overs : inns2.overs + inns2.balls / 6;

    const runsFor = t.id === team1Batted ? inns1.runs : inns2.runs;
    const runsAgainst = t.id === team1Batted ? inns2.runs : inns1.runs;
    const oversFor = t.id === team1Batted ? overs1 : overs2;
    const oversAgainst = t.id === team1Batted ? overs2 : overs1;

    // NRR must be computed from the TOURNAMENT-WIDE cumulative totals
    // (total runs / total overs, for and against), not as a sum of
    // per-match rate differences — the two are not mathematically
    // equivalent once overs-faced varies match to match.
    const nrrRunsFor = t.nrrRunsFor + runsFor;
    const nrrOversFor = t.nrrOversFor + oversFor;
    const nrrRunsAgainst = t.nrrRunsAgainst + runsAgainst;
    const nrrOversAgainst = t.nrrOversAgainst + oversAgainst;
    const nrr = (nrrRunsFor / (nrrOversFor || 1)) - (nrrRunsAgainst / (nrrOversAgainst || 1));

    return {
      ...t,
      matchesPlayed: t.matchesPlayed + 1,
      wins: t.wins + (isWinner ? 1 : 0),
      losses: t.losses + (!isTie && !isWinner ? 1 : 0),
      ties: t.ties + (isTie ? 1 : 0),
      points: t.points + (isWinner ? 2 : isTie ? 1 : 0),
      nrrRunsFor, nrrOversFor, nrrRunsAgainst, nrrOversAgainst,
      nrr: Math.round(nrr * 100) / 100,
    };
  });

  const allLiveMatches = [...s.allLiveMatches.filter(x => x.id !== lm.id), lm];
  const allPlayers = applyPlayerStats(s.allPlayers, lm);

  lsSet('kdpl_all_fixtures', allFixtures);
  lsSet('kdpl_all_teams', allTeams);
  lsSet('kdpl_all_live_matches', allLiveMatches);
  lsSet('kdpl_all_players', allPlayers);
  cloudSet('allFixtures', allFixtures);
  cloudSet('allTeams', allTeams);
  cloudSetLiveMatch(lm);
  cloudSet('allPlayers', allPlayers);

  return withDerived({ ...s, allFixtures, allTeams, allLiveMatches, allPlayers });
}

export function useKDPLStore() {
  const [state, setState] = useState<InternalState>(() => withDerived({
    currentPage: 'dashboard',
    pageHistory: [],
    currentTab: 'home',
    isAdmin: false,
    isSuperAdmin: false,
    hasSetupAccess: ls('kdpl_has_setup_access', false),
    authUid: null,
    authEmail: null,
    userRole: 'GUEST',
    user: null,
    tournaments: ls('kdpl_tournaments', []),
    activeTournamentId: ls('kdpl_active_tournament_id', null),
    organizers: ls('kdpl_organizers', []),
    organizerProfile: null,
    tournament: null,
    allTeams: ls('kdpl_all_teams', []),
    allPlayers: ls('kdpl_all_players', []),
    allVenues: ls('kdpl_all_venues', []),
    allFixtures: ls('kdpl_all_fixtures', []),
    allSeries: ls('kdpl_all_series', []),
    allLiveMatches: ls('kdpl_all_live_matches', []),
    teams: [], players: [], venues: [], fixtures: [], series: [], liveMatch: null, liveMatches: [],
    activeFixtureId: ls('kdpl_active_fixture_id', null),
    activeSeriesId: null,
    notifications: ls('kdpl_notifications', []),
    adSlots: ls('kdpl_ad_slots', DEFAULT_AD_SLOTS),
    supportWhatsapp: ls('kdpl_support_whatsapp', '923065772734'),
    superAdminEmails: ls('kdpl_super_admin_emails', []),
    theme: ls('kdpl_theme', 'dark'),
    lang: ls('kdpl_lang', 'en'),
    isOnline: navigator.onLine,
    syncStatus: 'synced',
    writeQueue: 0,
  }));

  // Track signed-in Firebase Auth user (Organizer or Super Admin — role decided by allowlist)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      setState(s => withDerived({ ...s, authUid: user?.uid || null, authEmail: user?.email || null }));
    }, () => { /* auth not configured yet — app keeps working for guests/PIN */ });
    return () => unsub();
  }, []);

  // online/offline tracking
  useEffect(() => {
    const handleOnline = () => setState(s => ({ ...s, isOnline: true, syncStatus: s.writeQueue > 0 ? 'syncing' : 'synced' }));
    const handleOffline = () => setState(s => ({ ...s, isOnline: false, syncStatus: 'offline' }));
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  // Real write-queue indicator — reflects actual in-flight Firestore writes
  // (see cloudSet/subscribeWriteQueue above), not a cosmetic placeholder.
  useEffect(() => {
    const unsub = subscribeWriteQueue(n => {
      setState(s => ({
        ...s,
        writeQueue: n,
        syncStatus: !s.isOnline ? 'offline' : n > 0 ? 'syncing' : 'synced',
      }));
    });
    return unsub;
  }, []);

  // Cloud sync — real-time updates from Firestore so every device/organizer sees the same data
  useEffect(() => {
    const unsub = onSnapshot(CLOUD_DOC, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as Record<string, unknown>;
      // One-time migration: older versions of the app stored every live
      // match as one giant array inside this shared document. Move any
      // leftover matches into their own documents (see LIVE_MATCHES_COLLECTION
      // above) and clear the old field, so this document never grows past
      // Firestore's 1MB limit again.
      if (!legacyLiveMatchesMigrated && Array.isArray(data.allLiveMatches) && data.allLiveMatches.length > 0) {
        legacyLiveMatchesMigrated = true;
        (data.allLiveMatches as LiveMatch[]).forEach(lm => cloudSetLiveMatch(lm));
        cloudSet('allLiveMatches', deleteField());
      }
      // Same one-time migration, for tournaments moving into their own
      // collection (see TOURNAMENTS_COLLECTION above).
      if (!legacyTournamentsMigrated && Array.isArray(data.tournaments) && data.tournaments.length > 0) {
        legacyTournamentsMigrated = true;
        (data.tournaments as Tournament[]).forEach(t => cloudSetTournament(t));
        cloudSet('tournaments', deleteField());
      }
      setState(s => {
        const next = { ...s };
        // tournaments is intentionally NOT read from here anymore — see
        // the dedicated TOURNAMENTS_COLLECTION listener below.
        if (data.organizers !== undefined) { next.organizers = data.organizers as OrganizerProfile[]; lsSet('kdpl_organizers', data.organizers); }
        if (data.allTeams !== undefined) { next.allTeams = data.allTeams as Team[]; lsSet('kdpl_all_teams', data.allTeams); }
        if (data.allPlayers !== undefined) { next.allPlayers = data.allPlayers as Player[]; lsSet('kdpl_all_players', data.allPlayers); }
        if (data.allVenues !== undefined) { next.allVenues = data.allVenues as Venue[]; lsSet('kdpl_all_venues', data.allVenues); }
        if (data.allFixtures !== undefined) { next.allFixtures = data.allFixtures as Fixture[]; lsSet('kdpl_all_fixtures', data.allFixtures); }
        if (data.allSeries !== undefined) { next.allSeries = data.allSeries as Series[]; lsSet('kdpl_all_series', data.allSeries); }
        // allLiveMatches is intentionally NOT read from here anymore — see
        // the dedicated LIVE_MATCHES_COLLECTION listener below.
        if (data.notifications !== undefined) { next.notifications = data.notifications as Notification[]; lsSet('kdpl_notifications', data.notifications); }
        if (data.adSlots !== undefined) { next.adSlots = data.adSlots as AdSlot[]; lsSet('kdpl_ad_slots', data.adSlots); }
        if (data.superAdminEmails !== undefined) { next.superAdminEmails = data.superAdminEmails as string[]; lsSet('kdpl_super_admin_emails', data.superAdminEmails); }
        if (data.supportWhatsapp !== undefined) { next.supportWhatsapp = data.supportWhatsapp as string; lsSet('kdpl_support_whatsapp', data.supportWhatsapp); }
        else { cloudSet('supportWhatsapp', s.supportWhatsapp); } // first run — push default number to cloud once
        next.syncStatus = 'synced';
        return withDerived(next);
      });
    }, (error) => {
      console.warn('Cloud sync unavailable (check src/firebase.ts config & Firestore rules):', error.message);
    });
    return () => unsub();
  }, []);

  // Live matches — each match is its own document (see LIVE_MATCHES_COLLECTION),
  // so this listens to the whole collection and rebuilds the array locally.
  // Splitting this out from the CLOUD_DOC listener above is what keeps one
  // huge, ever-growing tournament's ball-by-ball history from ever being
  // able to block sync for every OTHER tournament sharing the app.
  useEffect(() => {
    const unsub = onSnapshot(LIVE_MATCHES_COLLECTION, (snap) => {
      const allLiveMatches = snap.docs.map(d => d.data() as LiveMatch);
      lsSet('kdpl_all_live_matches', allLiveMatches);
      setState(s => withDerived({ ...s, allLiveMatches }));
    }, (error) => {
      console.warn('Live match cloud sync unavailable:', error.message);
    });
    return () => unsub();
  }, []);

  // Tournaments — each is its own document (see TOURNAMENTS_COLLECTION),
  // so Firestore Security Rules can check `resource.data.organizerUid`
  // against the signed-in user for every read/write, instead of one array
  // field nobody's rules could realistically protect per-entry.
  useEffect(() => {
    const unsub = onSnapshot(TOURNAMENTS_COLLECTION, (snap) => {
      const tournaments = snap.docs.map(d => d.data() as Tournament);
      lsSet('kdpl_tournaments', tournaments);
      setState(s => withDerived({ ...s, tournaments }));
    }, (error) => {
      console.warn('Tournament cloud sync unavailable:', error.message);
    });
    return () => unsub();
  }, []);

  const navigate = useCallback((page: string) => {
    setState(s => {
      if (page === s.currentPage) return s;
      const pageHistory = [...s.pageHistory, s.currentPage].slice(-30);
      return { ...s, currentPage: page, pageHistory };
    });
    window.scrollTo(0, 0);
  }, []);

  const goBack = useCallback(() => {
    setState(s => {
      if (s.pageHistory.length === 0) return { ...s, currentPage: 'dashboard' };
      const pageHistory = [...s.pageHistory];
      const prev = pageHistory.pop()!;
      return { ...s, currentPage: prev, pageHistory };
    });
    window.scrollTo(0, 0);
  }, []);

  const setTheme = useCallback((theme: 'dark' | 'light') => {
    lsSet('kdpl_theme', theme);
    setState(s => ({ ...s, theme }));
  }, []);

  const setLang = useCallback((lang: 'en' | 'ur') => {
    lsSet('kdpl_lang', lang);
    setState(s => ({ ...s, lang }));
  }, []);

  // ── Setup Access (PIN) — bootstraps Firebase config ONLY ──────────
  const loginAdmin = useCallback((pin: string): boolean => {
    const stored = ls('kdpl_admin_pin', hashPin('7254'));
    if (hashPin(pin) === stored) {
      lsSet('kdpl_has_setup_access', true);
      setState(s => withDerived({ ...s, hasSetupAccess: true }));
      return true;
    }
    return false;
  }, []);

  const changePin = useCallback((newPin: string) => {
    lsSet('kdpl_admin_pin', hashPin(newPin));
  }, []);

  // ── Organizer / Super Admin auth (real Firebase Auth accounts) ────
  const organizerSignUp = useCallback(async (name: string, email: string, password: string): Promise<string | null> => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      setState(s => {
        const newProfile: OrganizerProfile = {
          uid: cred.user.uid,
          email: cred.user.email || email,
          name,
          status: 'pending',
          createdAt: Date.now(),
        };
        const organizers = [...s.organizers, newProfile];
        lsSet('kdpl_organizers', organizers);
        cloudSet('organizers', organizers);
        return withDerived({ ...s, organizers });
      });
      return null;
    } catch (e: any) {
      if (e?.code === 'auth/email-already-in-use') return 'This email is already registered — try Sign In instead.';
      if (e?.code === 'auth/weak-password') return 'Password must be at least 6 characters.';
      if (e?.code === 'auth/invalid-email') return 'Email format is invalid.';
      if (e?.code === 'auth/configuration-not-found') return "Email/Password sign-in method isn't enabled in the Firebase Console.";
      if (e?.code === 'auth/api-key-not-valid' || e?.code === 'auth/invalid-api-key') return 'Firebase config is incorrect — check it again in Settings.';
      if (e?.code === 'auth/network-request-failed') return 'Check your internet connection.';
      return `Signup failed: ${e?.code || e?.message || 'unknown error'}`;
    }
  }, []);

  const organizerLogin = useCallback(async (email: string, password: string): Promise<string | null> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return null;
    } catch (e: any) {
      if (e?.code === 'auth/invalid-credential' || e?.code === 'auth/wrong-password' || e?.code === 'auth/user-not-found') return 'Incorrect email or password.';
      if (e?.code === 'auth/too-many-requests') return 'Too many attempts — please try again later.';
      if (e?.code === 'auth/configuration-not-found') return "Email/Password sign-in method isn't enabled in the Firebase Console.";
      if (e?.code === 'auth/api-key-not-valid' || e?.code === 'auth/invalid-api-key') return 'Firebase config is incorrect — check it again in Settings.';
      if (e?.code === 'auth/network-request-failed') return 'Check your internet connection.';
      if (e?.code === 'auth/user-disabled') return 'This account has been disabled.';
      return `Login failed: ${e?.code || e?.message || 'unknown error'}`;
    }
  }, []);

  const logoutAdmin = useCallback(() => {
    lsSet('kdpl_has_setup_access', false);
    signOut(auth).catch(() => {});
    setState(s => withDerived({ ...s, hasSetupAccess: false, authUid: null, authEmail: null }));
  }, []);

  const addSuperAdminEmail = useCallback((email: string) => {
    setState(s => {
      const superAdminEmails = Array.from(new Set([...s.superAdminEmails, email.trim().toLowerCase()]));
      lsSet('kdpl_super_admin_emails', superAdminEmails);
      cloudSet('superAdminEmails', superAdminEmails);
      return withDerived({ ...s, superAdminEmails });
    });
  }, []);

  const removeSuperAdminEmail = useCallback((email: string) => {
    setState(s => {
      const superAdminEmails = s.superAdminEmails.filter(e => e.toLowerCase() !== email.toLowerCase());
      lsSet('kdpl_super_admin_emails', superAdminEmails);
      cloudSet('superAdminEmails', superAdminEmails);
      return withDerived({ ...s, superAdminEmails });
    });
  }, []);

  // ── Organizer approval (Super Admin only — enforced in the UI) ────
  const approveOrganizer = useCallback((uid: string) => {
    setState(s => {
      const organizers = s.organizers.map(o => o.uid === uid ? { ...o, status: 'approved' as const } : o);
      lsSet('kdpl_organizers', organizers);
      cloudSet('organizers', organizers);
      return withDerived({ ...s, organizers });
    });
  }, []);

  const rejectOrganizer = useCallback((uid: string) => {
    setState(s => {
      const organizers = s.organizers.map(o => o.uid === uid ? { ...o, status: 'rejected' as const } : o);
      lsSet('kdpl_organizers', organizers);
      cloudSet('organizers', organizers);
      return withDerived({ ...s, organizers });
    });
  }, []);

  const removeOrganizer = useCallback((uid: string) => {
    setState(s => {
      const organizers = s.organizers.filter(o => o.uid !== uid);
      lsSet('kdpl_organizers', organizers);
      cloudSet('organizers', organizers);
      return withDerived({ ...s, organizers });
    });
  }, []);

  // ── Tournaments (multi-tournament) ─────────────────────────────────
  const switchTournament = useCallback((id: string | null) => {
    lsSet('kdpl_active_tournament_id', id);
    // Switching tournaments also clears which fixture was being scored —
    // otherwise a stale activeFixtureId from the old tournament could
    // (harmlessly, thanks to the tournamentId filter, but confusingly)
    // linger in the UI.
    lsSet('kdpl_active_fixture_id', null);
    setState(s => withDerived({ ...s, activeTournamentId: id, activeFixtureId: null }));
  }, []);

  // Points the Toss/Scorer/Live pages at a specific fixture. Multiple
  // fixtures in the same tournament can be live at once (different venues) —
  // this is how the organizer picks which one they're currently scoring.
  const setActiveFixture = useCallback((fixtureId: string | null) => {
    lsSet('kdpl_active_fixture_id', fixtureId);
    setState(s => withDerived({ ...s, activeFixtureId: fixtureId }));
  }, []);

  // Points Series Detail at a specific series (no persistence needed — it's
  // always entered by tapping a series in the list first).
  const setActiveSeries = useCallback((seriesId: string | null) => {
    setState(s => withDerived({ ...s, activeSeriesId: seriesId }));
  }, []);

  const createTournament = useCallback((data: Omit<Tournament, 'id' | 'organizerUid' | 'organizerEmail' | 'createdAt'>) => {
    setState(s => {
      const newTournament: Tournament = {
        ...data,
        id: genId('t'),
        organizerUid: s.authUid || '',
        organizerEmail: s.authEmail || '',
        createdAt: Date.now(),
      };
      const tournaments = [...s.tournaments, newTournament];
      lsSet('kdpl_tournaments', tournaments);
      cloudSetTournament(newTournament);
      lsSet('kdpl_active_tournament_id', newTournament.id);
      return withDerived({ ...s, tournaments, activeTournamentId: newTournament.id });
    });
  }, []);

  const updateTournament = useCallback((tournament: Tournament) => {
    setState(s => {
      const tournaments = s.tournaments.map(t => t.id === tournament.id ? tournament : t);
      lsSet('kdpl_tournaments', tournaments);
      cloudSetTournament(tournament);
      return withDerived({ ...s, tournaments });
    });
  }, []);

  // Deleting a tournament removes EVERYTHING that belongs to it — teams,
  // players, venues, fixtures, series, and any live match in progress.
  // The old version only removed the Tournament record itself, silently
  // leaving every team/player/fixture/live-match behind forever (which,
  // besides being confusing "orphaned" data, is exactly the kind of thing
  // that grows Firestore documents without bound).
  const deleteTournament = useCallback((id: string) => {
    setState(s => {
      const tournaments = s.tournaments.filter(t => t.id !== id);
      const activeTournamentId = s.activeTournamentId === id ? null : s.activeTournamentId;
      const activeFixtureId = s.activeTournamentId === id ? null : s.activeFixtureId;

      const staleLiveMatches = s.allLiveMatches.filter(lm => lm.tournamentId === id);
      const allLiveMatches = s.allLiveMatches.filter(lm => lm.tournamentId !== id);
      const allTeams = s.allTeams.filter(t => t.tournamentId !== id);
      const allPlayers = s.allPlayers.filter(p => p.tournamentId !== id);
      const allVenues = s.allVenues.filter(v => v.tournamentId !== id);
      const allFixtures = s.allFixtures.filter(f => f.tournamentId !== id);
      const allSeries = s.allSeries.filter(sr => sr.tournamentId !== id);

      lsSet('kdpl_tournaments', tournaments);
      lsSet('kdpl_active_tournament_id', activeTournamentId);
      lsSet('kdpl_active_fixture_id', activeFixtureId);
      lsSet('kdpl_all_live_matches', allLiveMatches);
      lsSet('kdpl_all_teams', allTeams);
      lsSet('kdpl_all_players', allPlayers);
      lsSet('kdpl_all_venues', allVenues);
      lsSet('kdpl_all_fixtures', allFixtures);
      lsSet('kdpl_all_series', allSeries);

      cloudDeleteTournament(id);
      staleLiveMatches.forEach(lm => cloudDeleteLiveMatch(lm.id));
      cloudSet('allTeams', allTeams);
      cloudSet('allPlayers', allPlayers);
      cloudSet('allVenues', allVenues);
      cloudSet('allFixtures', allFixtures);
      cloudSet('allSeries', allSeries);

      return withDerived({
        ...s, tournaments, activeTournamentId, activeFixtureId,
        allLiveMatches, allTeams, allPlayers, allVenues, allFixtures, allSeries,
      });
    });
  }, []);

  // Super Admin only — wipes every tournament and everything inside them
  // (teams, players, venues, fixtures, series, live matches, notifications)
  // across the WHOLE app. Deliberately leaves organizer accounts, the Super
  // Admin allowlist, ad slots, and Firebase config untouched — those are
  // platform configuration, not tournament content.
  const wipeAllTournamentData = useCallback(() => {
    setState(s => {
      s.allLiveMatches.forEach(lm => cloudDeleteLiveMatch(lm.id));
      s.tournaments.forEach(t => cloudDeleteTournament(t.id));
      const empty = {
        tournaments: [], allTeams: [], allPlayers: [], allVenues: [],
        allFixtures: [], allSeries: [], allLiveMatches: [], notifications: [],
      };
      lsSet('kdpl_tournaments', empty.tournaments);
      lsSet('kdpl_all_teams', empty.allTeams);
      lsSet('kdpl_all_players', empty.allPlayers);
      lsSet('kdpl_all_venues', empty.allVenues);
      lsSet('kdpl_all_fixtures', empty.allFixtures);
      lsSet('kdpl_all_series', empty.allSeries);
      lsSet('kdpl_all_live_matches', empty.allLiveMatches);
      lsSet('kdpl_notifications', empty.notifications);
      lsSet('kdpl_active_tournament_id', null);
      lsSet('kdpl_active_fixture_id', null);

      cloudSet('allTeams', empty.allTeams);
      cloudSet('allPlayers', empty.allPlayers);
      cloudSet('allVenues', empty.allVenues);
      cloudSet('allFixtures', empty.allFixtures);
      cloudSet('allSeries', empty.allSeries);
      cloudSet('notifications', empty.notifications);

      return withDerived({ ...s, ...empty, activeTournamentId: null, activeFixtureId: null });
    });
  }, []);

  // ── Teams (tagged to active tournament) ────────────────────────────
  const addTeam = useCallback((team: Omit<Team, 'tournamentId'> & { tournamentId?: string }) => {
    setState(s => {
      const allTeams = [...s.allTeams, { ...team, tournamentId: s.activeTournamentId || '' }];
      lsSet('kdpl_all_teams', allTeams);
      cloudSet('allTeams', allTeams);
      return withDerived({ ...s, allTeams });
    });
  }, []);

  const updateTeam = useCallback((team: Team) => {
    setState(s => {
      const allTeams = s.allTeams.map(t => t.id === team.id ? team : t);
      lsSet('kdpl_all_teams', allTeams);
      cloudSet('allTeams', allTeams);
      return withDerived({ ...s, allTeams });
    });
  }, []);

  const deleteTeam = useCallback((id: string) => {
    setState(s => {
      const allTeams = s.allTeams.filter(t => t.id !== id);
      lsSet('kdpl_all_teams', allTeams);
      cloudSet('allTeams', allTeams);
      return withDerived({ ...s, allTeams });
    });
  }, []);

  // ── Players ─────────────────────────────────────────────────────────
  const addPlayer = useCallback((player: Omit<Player, 'tournamentId'> & { tournamentId?: string }) => {
    setState(s => {
      const allPlayers = [...s.allPlayers, { ...player, tournamentId: s.activeTournamentId || '' }];
      lsSet('kdpl_all_players', allPlayers);
      cloudSet('allPlayers', allPlayers);
      return withDerived({ ...s, allPlayers });
    });
  }, []);

  const updatePlayer = useCallback((player: Player) => {
    setState(s => {
      const allPlayers = s.allPlayers.map(p => p.id === player.id ? player : p);
      lsSet('kdpl_all_players', allPlayers);
      cloudSet('allPlayers', allPlayers);
      return withDerived({ ...s, allPlayers });
    });
  }, []);

  const deletePlayer = useCallback((id: string) => {
    setState(s => {
      const allPlayers = s.allPlayers.filter(p => p.id !== id);
      lsSet('kdpl_all_players', allPlayers);
      cloudSet('allPlayers', allPlayers);
      return withDerived({ ...s, allPlayers });
    });
  }, []);

  const banPlayer = useCallback((id: string, reason: string) => {
    setState(s => {
      const allPlayers = s.allPlayers.map(p => p.id === id ? { ...p, banned: true, banReason: reason } : p);
      lsSet('kdpl_all_players', allPlayers);
      cloudSet('allPlayers', allPlayers);
      return withDerived({ ...s, allPlayers });
    });
  }, []);

  const unbanPlayer = useCallback((id: string) => {
    setState(s => {
      const allPlayers = s.allPlayers.map(p => p.id === id ? { ...p, banned: false, banReason: '' } : p);
      lsSet('kdpl_all_players', allPlayers);
      cloudSet('allPlayers', allPlayers);
      return withDerived({ ...s, allPlayers });
    });
  }, []);

  // ── Venues ──────────────────────────────────────────────────────────
  const addVenue = useCallback((venue: Omit<Venue, 'tournamentId'> & { tournamentId?: string }) => {
    setState(s => {
      const allVenues = [...s.allVenues, { ...venue, tournamentId: s.activeTournamentId || '' }];
      lsSet('kdpl_all_venues', allVenues);
      cloudSet('allVenues', allVenues);
      return withDerived({ ...s, allVenues });
    });
  }, []);

  const updateVenue = useCallback((venue: Venue) => {
    setState(s => {
      const allVenues = s.allVenues.map(v => v.id === venue.id ? venue : v);
      lsSet('kdpl_all_venues', allVenues);
      cloudSet('allVenues', allVenues);
      return withDerived({ ...s, allVenues });
    });
  }, []);

  const deleteVenue = useCallback((id: string) => {
    setState(s => {
      const allVenues = s.allVenues.filter(v => v.id !== id);
      lsSet('kdpl_all_venues', allVenues);
      cloudSet('allVenues', allVenues);
      return withDerived({ ...s, allVenues });
    });
  }, []);

  // ── Fixtures ────────────────────────────────────────────────────────
  const addFixture = useCallback((fixture: Fixture) => {
    setState(s => {
      const allFixtures = [...s.allFixtures, { ...fixture, tournamentId: s.activeTournamentId || '' }];
      lsSet('kdpl_all_fixtures', allFixtures);
      cloudSet('allFixtures', allFixtures);
      return withDerived({ ...s, allFixtures });
    });
  }, []);

  const updateFixture = useCallback((fixture: Fixture) => {
    setState(s => {
      const allFixtures = s.allFixtures.map(f => f.id === fixture.id ? fixture : f);
      lsSet('kdpl_all_fixtures', allFixtures);
      cloudSet('allFixtures', allFixtures);
      return withDerived({ ...s, allFixtures });
    });
  }, []);

  const deleteFixture = useCallback((id: string) => {
    setState(s => {
      const allFixtures = s.allFixtures.filter(f => f.id !== id);
      // A deleted fixture's live match (if any) becomes stale — remove it too,
      // otherwise the Live page keeps showing scores for a match that no longer exists.
      const staleLiveMatches = s.allLiveMatches.filter(lm => lm.fixtureId === id);
      const allLiveMatches = s.allLiveMatches.filter(lm => lm.fixtureId !== id);
      lsSet('kdpl_all_fixtures', allFixtures);
      lsSet('kdpl_all_live_matches', allLiveMatches);
      cloudSet('allFixtures', allFixtures);
      staleLiveMatches.forEach(lm => cloudDeleteLiveMatch(lm.id));
      return withDerived({ ...s, allFixtures, allLiveMatches });
    });
  }, []);

  // ── Series — groups several fixtures into one head-to-head contest ──
  const createSeries = useCallback((data: Omit<Series, 'id' | 'tournamentId' | 'createdAt'>) => {
    setState(s => {
      const newSeries: Series = { ...data, id: genId('sr'), tournamentId: s.activeTournamentId || '', createdAt: Date.now() };
      const allSeries = [...s.allSeries, newSeries];
      lsSet('kdpl_all_series', allSeries);
      cloudSet('allSeries', allSeries);
      return withDerived({ ...s, allSeries });
    });
  }, []);

  const updateSeries = useCallback((series: Series) => {
    setState(s => {
      const allSeries = s.allSeries.map(sr => sr.id === series.id ? series : sr);
      lsSet('kdpl_all_series', allSeries);
      cloudSet('allSeries', allSeries);
      return withDerived({ ...s, allSeries });
    });
  }, []);

  // Deleting a series never deletes its matches — they just become regular
  // standalone fixtures again (unlinked), so no scored data is ever lost.
  const deleteSeries = useCallback((id: string) => {
    setState(s => {
      const allSeries = s.allSeries.filter(sr => sr.id !== id);
      const allFixtures = s.allFixtures.map(f => f.seriesId === id ? { ...f, seriesId: undefined, seriesMatchNumber: undefined } : f);
      lsSet('kdpl_all_series', allSeries);
      lsSet('kdpl_all_fixtures', allFixtures);
      cloudSet('allSeries', allSeries);
      cloudSet('allFixtures', allFixtures);
      return withDerived({ ...s, allSeries, allFixtures });
    });
  }, []);

  // Adds the next match of a series as a new scheduled Fixture between the
  // series' two teams, linked back via seriesId/seriesMatchNumber.
  const addSeriesMatch = useCallback((seriesId: string, date: string, venueId: string, overs: number) => {
    setState(s => {
      const series = s.allSeries.find(sr => sr.id === seriesId);
      if (!series) return s;
      const existing = s.allFixtures.filter(f => f.seriesId === seriesId);
      const nextMatchNumber = existing.length + 1;
      const nextFixtureMatchNumber = (s.allFixtures.filter(f => f.tournamentId === s.activeTournamentId).reduce((max, f) => Math.max(max, f.matchNumber), 0)) + 1;
      const newFixture: Fixture = {
        id: genId('f'),
        tournamentId: s.activeTournamentId || '',
        round: nextMatchNumber,
        stage: 'group',
        matchNumber: nextFixtureMatchNumber,
        teamAId: series.teamAId,
        teamBId: series.teamBId,
        venueId,
        date,
        time: '14:30',
        slot: 'Day',
        status: 'scheduled',
        overs,
        umpires: [],
        seriesId: series.id,
        seriesMatchNumber: nextMatchNumber,
        createdAt: Date.now(),
      };
      const allFixtures = [...s.allFixtures, newFixture];
      lsSet('kdpl_all_fixtures', allFixtures);
      cloudSet('allFixtures', allFixtures);
      return withDerived({ ...s, allFixtures });
    });
  }, []);
  // Manually clear the current live match (e.g. started scoring by mistake) —
  // without touching the fixture itself, which goes back to 'scheduled'.
  const clearLiveMatch = useCallback(() => {
    setState(s => {
      const current = findActiveLiveMatch(s);
      if (!current) return s;
      const allLiveMatches = s.allLiveMatches.filter(lm => lm.id !== current.id);
      const allFixtures = s.allFixtures.map(f => f.id === current.fixtureId ? { ...f, status: 'scheduled' as const, toss: undefined } : f);
      lsSet('kdpl_all_live_matches', allLiveMatches);
      lsSet('kdpl_all_fixtures', allFixtures);
      cloudDeleteLiveMatch(current.id);
      cloudSet('allFixtures', allFixtures);
      return withDerived({ ...s, allLiveMatches, allFixtures });
    });
  }, []);

  // A team didn't show up — award the win to the other team without playing.
  // No NRR change (no runs were actually scored), but the result still counts
  // toward matches played / points, same as a real result.
  const awardWalkover = useCallback((fixtureId: string, winnerId: string) => {
    setState(s => {
      const fixture = s.allFixtures.find(f => f.id === fixtureId);
      if (!fixture) return s;
      const loserId = fixture.teamAId === winnerId ? fixture.teamBId : fixture.teamAId;

      const allFixtures = s.allFixtures.map(f => f.id === fixtureId ? {
        ...f,
        status: 'completed' as const,
        result: {
          winnerId, loserTeamId: loserId,
          teamAScore: 0, teamBScore: 0, teamAOvers: '0.0', teamBOvers: '0.0',
          margin: 'Walkover', manOfMatch: '',
        },
      } : f);

      const allTeams = s.allTeams.map(t => {
        if (t.id !== winnerId && t.id !== loserId) return t;
        const isWinner = t.id === winnerId;
        return {
          ...t,
          matchesPlayed: t.matchesPlayed + 1,
          wins: t.wins + (isWinner ? 1 : 0),
          losses: t.losses + (isWinner ? 0 : 1),
          points: t.points + (isWinner ? 2 : 0),
        };
      });

      lsSet('kdpl_all_fixtures', allFixtures);
      lsSet('kdpl_all_teams', allTeams);
      cloudSet('allFixtures', allFixtures);
      cloudSet('allTeams', allTeams);
      return withDerived({ ...s, allFixtures, allTeams });
    });
  }, []);

  // Cancel a scheduled match (e.g. rained out) — no winner, no stats impact.
  const cancelFixture = useCallback((fixtureId: string) => {
    setState(s => {
      const allFixtures = s.allFixtures.map(f => f.id === fixtureId ? { ...f, status: 'abandoned' as const } : f);
      lsSet('kdpl_all_fixtures', allFixtures);
      cloudSet('allFixtures', allFixtures);
      return withDerived({ ...s, allFixtures });
    });
  }, []);

  // ── Live match (tagged to active tournament) ───────────────────────
  // Upserts by the match's own id — never wipes other concurrently-live
  // matches in the same tournament, unlike the old tournamentId-wide
  // replace which silently destroyed any other match in progress the
  // moment a new toss was started.
  const updateLiveMatch = useCallback((liveMatch: (Omit<LiveMatch, 'tournamentId'> & { tournamentId?: string }) | null) => {
    setState(s => {
      if (!liveMatch) {
        const current = findActiveLiveMatch(s);
        if (!current) return s;
        const allLiveMatches = s.allLiveMatches.filter(lm => lm.id !== current.id);
        lsSet('kdpl_all_live_matches', allLiveMatches);
        cloudDeleteLiveMatch(current.id);
        return withDerived({ ...s, allLiveMatches });
      }
      const withoutThis = s.allLiveMatches.filter(lm => lm.id !== liveMatch.id);
      const newLm = { ...liveMatch, tournamentId: s.activeTournamentId || '' };
      const allLiveMatches = [...withoutThis, newLm];
      lsSet('kdpl_all_live_matches', allLiveMatches);
      cloudSetLiveMatch(newLm);
      return withDerived({ ...s, allLiveMatches });
    });
  }, []);

  // ── Notifications ───────────────────────────────────────────────────
  const addNotification = useCallback((notif: Notification) => {
    setState(s => {
      const notifications = [notif, ...s.notifications].slice(0, 50);
      lsSet('kdpl_notifications', notifications);
      cloudSet('notifications', notifications);
      return { ...s, notifications };
    });
  }, []);

  const markNotifRead = useCallback((id: string) => {
    setState(s => {
      const notifications = s.notifications.map(n => n.id === id ? { ...n, read: true } : n);
      lsSet('kdpl_notifications', notifications);
      cloudSet('notifications', notifications);
      return { ...s, notifications };
    });
  }, []);

  const markAllRead = useCallback(() => {
    setState(s => {
      const notifications = s.notifications.map(n => ({ ...n, read: true }));
      lsSet('kdpl_notifications', notifications);
      cloudSet('notifications', notifications);
      return { ...s, notifications };
    });
  }, []);

  const clearNotifications = useCallback(() => {
    lsSet('kdpl_notifications', []);
    cloudSet('notifications', []);
    setState(s => ({ ...s, notifications: [] }));
  }, []);

  const updateSupportWhatsapp = useCallback((number: string) => {
    lsSet('kdpl_support_whatsapp', number);
    cloudSet('supportWhatsapp', number);
    setState(s => ({ ...s, supportWhatsapp: number }));
  }, []);

  const updateAdSlot = useCallback((slot: AdSlot) => {
    setState(s => {
      const adSlots = s.adSlots.map(a => a.id === slot.id ? slot : a);
      lsSet('kdpl_ad_slots', adSlots);
      cloudSet('adSlots', adSlots);
      return { ...s, adSlots };
    });
  }, []);

  const generateFixtures = useCallback(() => {
    // Berger round-robin pairings, then greedily packed into days:
    // max 3 matches per day total, max 2 matches per team per day
    // (lets a team play twice in a day, and finishes the tournament faster).
    setState(s => {
      const teams = s.allTeams.filter(t => t.tournamentId === s.activeTournamentId);
      const n = teams.length;
      if (n < 2) return s;
      const tournament = s.tournaments.find(t => t.id === s.activeTournamentId);
      const venueIds = s.allVenues.filter(v => v.tournamentId === s.activeTournamentId).map(v => v.id);
      const startDate = new Date(tournament?.startDate || new Date().toISOString().slice(0, 10));
      const TIME_SLOTS: { time: string; slot: 'Day' | 'Night' }[] = [
        { time: '10:00', slot: 'Day' },
        { time: '14:30', slot: 'Day' },
        { time: '18:00', slot: 'Night' },
      ];
      const MAX_MATCHES_PER_DAY = 3;

      // ── Pure Knockout format: no group stage at all — straight into a
      // single-elimination bracket, seeded from the team list in order.
      // (The old code generated a full round-robin group stage regardless
      // of the selected format — this branch is what actually makes
      // "Knockout" behave differently from "League" / "Round-Robin".)
      if (tournament?.format === 'Knockout') {
        let bracketSize = 2;
        while (bracketSize < n) bracketSize *= 2;
        const byes = bracketSize - n;
        const seeded = teams.map(t => t.id);
        // Top `byes` seeds skip round 1 and go straight into round 2.
        const byeTeamIds = seeded.slice(0, byes);
        const round1Teams = seeded.slice(byes);

        const generated: Fixture[] = [];
        let matchNum = 1;
        let dayIndex = 0;
        let posInDay = 0;
        const nextSlot = () => {
          const slot = TIME_SLOTS[posInDay % TIME_SLOTS.length];
          posInDay++;
          if (posInDay >= MAX_MATCHES_PER_DAY) { posInDay = 0; dayIndex++; }
          return slot;
        };

        const stageForSize = (size: number): Fixture['stage'] =>
          size <= 2 ? 'final' : size <= 4 ? 'semi-final' : size <= 8 ? 'quarter-final' : 'group';

        // Round 1 — real teams paired off.
        const round1Stage = stageForSize(bracketSize);
        for (let i = 0; i < round1Teams.length; i += 2) {
          const { time, slot } = nextSlot();
          const date = new Date(startDate); date.setDate(date.getDate() + dayIndex);
          generated.push({
            id: genId('f'), tournamentId: s.activeTournamentId || '', round: 1, stage: round1Stage,
            matchNumber: matchNum++, teamAId: round1Teams[i], teamBId: round1Teams[i + 1],
            venueId: venueIds[0] || '', date: date.toISOString().slice(0, 10), time, slot,
            status: 'scheduled', umpires: [], overs: tournament?.overs || 10, createdAt: Date.now(),
          });
        }

        // Round 2 onward — bye teams slot straight in (real id), everyone
        // else is TBD until the organizer assigns the round-1 winners.
        let roundSize = bracketSize / 2;
        let round = 2;
        let byeIdx = 0;
        while (roundSize >= 1) {
          const stage = stageForSize(roundSize);
          const matchesThisRound = Math.max(1, roundSize / 2);
          for (let i = 0; i < matchesThisRound; i++) {
            const { time, slot } = nextSlot();
            const date = new Date(startDate); date.setDate(date.getDate() + dayIndex);
            const label = matchesThisRound > 1 ? `${i + 1}` : '';
            const teamAId = round === 2 && byeIdx < byeTeamIds.length ? byeTeamIds[byeIdx++] : `TBD-${stage}-${label}A`;
            const teamBId = round === 2 && byeIdx < byeTeamIds.length ? byeTeamIds[byeIdx++] : `TBD-${stage}-${label}B`;
            generated.push({
              id: genId('f'), tournamentId: s.activeTournamentId || '', round, stage,
              matchNumber: matchNum++, teamAId, teamBId,
              venueId: venueIds[0] || '', date: date.toISOString().slice(0, 10), time, slot,
              status: 'scheduled', umpires: [], overs: tournament?.overs || 10, createdAt: Date.now(),
            });
          }
          if (roundSize === 1) break;
          roundSize = roundSize / 2;
          round++;
        }

        const allFixtures = [...s.allFixtures.filter(f => f.tournamentId !== s.activeTournamentId), ...generated];
        lsSet('kdpl_all_fixtures', allFixtures);
        cloudSet('allFixtures', allFixtures);
        return withDerived({ ...s, allFixtures });
      }

      const arr = n % 2 === 0 ? teams.map(t => t.id) : [...teams.map(t => t.id), 'BYE'];
      const totalTeams = arr.length;
      const totalRounds = totalTeams - 1;
      const matchesPerRound = totalTeams / 2;

      // Step 1 — generate round-robin pairings (order = preferred scheduling priority)
      const pairings: { round: number; teamAId: string; teamBId: string }[] = [];
      for (let round = 0; round < totalRounds; round++) {
        for (let match = 0; match < matchesPerRound; match++) {
          const home = arr[match];
          const away = arr[totalTeams - 1 - match];
          if (home !== 'BYE' && away !== 'BYE') {
            pairings.push({ round: round + 1, teamAId: home, teamBId: away });
          }
        }
        const last = arr.pop()!;
        arr.splice(1, 0, last);
      }

      // Step 2 — greedily pack pairings into days (max 3 matches/day, max 2/team/day)
      const MAX_MATCHES_PER_TEAM_PER_DAY = 2;
      const days: { matches: number; teamsPlayed: Record<string, number> }[] = [];

      const assignDay = (teamA: string, teamB: string): number => {
        for (let i = 0; i < days.length; i++) {
          const d = days[i];
          if (d.matches < MAX_MATCHES_PER_DAY &&
              (d.teamsPlayed[teamA] || 0) < MAX_MATCHES_PER_TEAM_PER_DAY &&
              (d.teamsPlayed[teamB] || 0) < MAX_MATCHES_PER_TEAM_PER_DAY) {
            d.matches++;
            d.teamsPlayed[teamA] = (d.teamsPlayed[teamA] || 0) + 1;
            d.teamsPlayed[teamB] = (d.teamsPlayed[teamB] || 0) + 1;
            return i;
          }
        }
        days.push({ matches: 1, teamsPlayed: { [teamA]: 1, [teamB]: 1 } });
        return days.length - 1;
      };

      let matchNum = 1;
      const generated: Fixture[] = pairings.map(p => {
        const dayIndex = assignDay(p.teamAId, p.teamBId);
        const positionInDay = days[dayIndex].matches; // 1-based, since incremented before returning
        const date = new Date(startDate);
        date.setDate(date.getDate() + dayIndex);
        const venueId = venueIds[(matchNum - 1) % (venueIds.length || 1)] || '';
        const { time, slot } = TIME_SLOTS[Math.min(positionInDay, 3) - 1];
        return {
          id: genId('f'),
          tournamentId: s.activeTournamentId || '',
          round: p.round,
          stage: 'group' as const,
          matchNumber: matchNum++,
          teamAId: p.teamAId,
          teamBId: p.teamBId,
          venueId,
          date: date.toISOString().slice(0, 10),
          time,
          slot,
          status: 'scheduled',
          umpires: [],
          overs: tournament?.overs || 10,
          createdAt: Date.now(),
        };
      });

      // Step 3 — auto-generate the knockout playoff stage (Quarter/Semi/Final)
      // on top of the group stage. Only for 'League' format — pure
      // 'Round-Robin' tournaments are decided by the standings table alone,
      // with no playoff bracket appended.
      // Teams here are TBD placeholders — the organizer assigns the actual
      // qualifiers once the group stage standings are known.
      const groupDaysUsed = days.length;
      const knockoutRounds: { stage: Fixture['stage']; matches: number }[] = [];
      if (tournament?.format !== 'Round-Robin') {
        if (n >= 8) knockoutRounds.push({ stage: 'quarter-final', matches: 4 }, { stage: 'semi-final', matches: 2 }, { stage: 'final', matches: 1 });
        else if (n >= 4) knockoutRounds.push({ stage: 'semi-final', matches: 2 }, { stage: 'final', matches: 1 });
        else if (n >= 2) knockoutRounds.push({ stage: 'final', matches: 1 });
      }

      let dayOffset = groupDaysUsed;
      let koRound = totalRounds + 1;
      knockoutRounds.forEach(({ stage, matches }) => {
        for (let i = 0; i < matches; i++) {
          const dayIndex = dayOffset + Math.floor(i / MAX_MATCHES_PER_DAY);
          const positionInDay = i % MAX_MATCHES_PER_DAY;
          const date = new Date(startDate);
          date.setDate(date.getDate() + dayIndex);
          const label = matches > 1 ? `${i + 1}` : '';
          generated.push({
            id: genId('f'),
            tournamentId: s.activeTournamentId || '',
            round: koRound,
            stage,
            matchNumber: matchNum++,
            teamAId: `TBD-${stage}-${label}A`,
            teamBId: `TBD-${stage}-${label}B`,
            venueId: venueIds[0] || '',
            date: date.toISOString().slice(0, 10),
            time: TIME_SLOTS[positionInDay].time,
            slot: TIME_SLOTS[positionInDay].slot,
            status: 'scheduled',
            umpires: [],
            overs: tournament?.overs || 10,
            createdAt: Date.now(),
          });
        }
        dayOffset += Math.ceil(matches / MAX_MATCHES_PER_DAY);
        koRound++;
      });

      const allFixtures = [...s.allFixtures.filter(f => f.tournamentId !== s.activeTournamentId), ...generated];
      lsSet('kdpl_all_fixtures', allFixtures);
      cloudSet('allFixtures', allFixtures);
      return withDerived({ ...s, allFixtures });
    });
  }, []);

  const shufflePlayers = useCallback(() => {
    setState(s => {
      const teams = s.allTeams.filter(t => t.tournamentId === s.activeTournamentId);
      const players = s.allPlayers.filter(p => p.tournamentId === s.activeTournamentId);
      if (teams.length === 0) return s;
      const batsmen = players.filter(p => p.role === 'Batsman');
      const allRounders = players.filter(p => p.role === 'All-Rounder');
      const bowlers = players.filter(p => p.role === 'Bowler');
      const wks = players.filter(p => p.role === 'Wicket-Keeper');

      const fisherYates = <T,>(arr: T[]): T[] => {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      };

      const shuffled = [...fisherYates(batsmen), ...fisherYates(allRounders), ...fisherYates(bowlers), ...fisherYates(wks)];
      const teamCount = teams.length;

      const updatedIds = new Map<string, string>();
      shuffled.forEach((player, i) => updatedIds.set(player.id, teams[i % teamCount].id));

      const allPlayers = s.allPlayers.map(p => updatedIds.has(p.id) ? { ...p, teamId: updatedIds.get(p.id)! } : p);
      lsSet('kdpl_all_players', allPlayers);
      cloudSet('allPlayers', allPlayers);
      return withDerived({ ...s, allPlayers });
    });
  }, []);

  const recordBall = useCallback((ball: BallEvent) => {
    setState(s => {
      const current = findActiveLiveMatch(s);
      if (!current) return s;
      const lm = { ...current };
      const innings = lm.currentInnings === 1 ? { ...lm.innings1 } : { ...lm.innings2 };

      // Snapshot pre-ball state so undo can restore batters/bowler exactly, not just numbers.
      const snapshot: UndoSnapshot = {
        ball,
        innings: lm.currentInnings,
        prevBatter1: innings.currentBatter1,
        prevBatter2: innings.currentBatter2,
        prevBowler: innings.currentBowler,
        prevLastOverBowlerId: lm.lastOverBowlerId || '',
      };

      // A wicket on a free-hit doesn't count (except a run-out, which is
      // always live regardless of a no-ball the delivery before).
      const wasFreeHit = !!lm.freeHit;
      const wicketNullifiedByFreeHit = ball.isWicket && wasFreeHit && ball.wicketType !== 'Run-Out';
      const effectiveWicket = ball.isWicket && !wicketNullifiedByFreeHit;

      innings.runs += ball.runs + ball.extras;
      innings.extras += ball.extras;

      let overJustCompleted = false;
      if (ball.extraType !== 'Wide' && ball.extraType !== 'No-Ball') {
        innings.balls += 1;
        if (innings.balls === 6) { innings.overs += 1; innings.balls = 0; overJustCompleted = true; }
      }

      // Runs off a Bye / Leg-Bye / Wide are never credited to the batsman's
      // personal score or "faced" tally — only to the team total (handled
      // above via innings.runs). The old code added ball.runs to the
      // batsman's score unconditionally, which double-counted these as both
      // extras AND personal runs whenever a scorer picked a non-zero run
      // value while an extra was active.
      const runsCreditToBatsman = (ball.extraType === '' || ball.extraType === 'No-Ball') ? ball.runs : 0;
      if (innings.playerStats[ball.batsmanId]) {
        const bs = { ...innings.playerStats[ball.batsmanId] };
        bs.runs += runsCreditToBatsman;
        if (ball.extraType === '' || ball.extraType === 'No-Ball') bs.balls += 1;
        if (runsCreditToBatsman === 4) bs.fours += 1;
        if (runsCreditToBatsman === 6) bs.sixes += 1;
        bs.strikeRate = bs.balls > 0 ? (bs.runs / bs.balls) * 100 : 0;
        innings.playerStats = { ...innings.playerStats, [ball.batsmanId]: bs };
      }

      // Byes and leg-byes are not conceded against the bowler — only wides,
      // no-balls, and runs actually hit off the bat count toward their
      // figures. The old code lumped every extra into the bowler's runs.
      const runsAgainstBowler = (ball.extraType === 'Bye' || ball.extraType === 'Leg-Bye') ? 0 : ball.runs + ball.extras;
      if (innings.bowlerStats[ball.bowlerId]) {
        const bwl = { ...innings.bowlerStats[ball.bowlerId] };
        bwl.runs += runsAgainstBowler;
        if (ball.extraType !== 'Wide' && ball.extraType !== 'No-Ball') {
          bwl.balls += 1;
          if (bwl.balls === 6) { bwl.overs += 1; bwl.balls = 0; }
        }
        if (effectiveWicket && ball.wicketType !== 'Run-Out') bwl.wickets += 1;
        bwl.economy = bwl.overs > 0 ? bwl.runs / bwl.overs : 0;
        innings.bowlerStats = { ...innings.bowlerStats, [ball.bowlerId]: bwl };
      }

      // Which player is actually dismissed — for a run-out this can be the
      // non-striker, not just whoever was facing the ball.
      const dismissedId = effectiveWicket
        ? (ball.wicketType === 'Run-Out' && ball.runOutBatsmanId ? ball.runOutBatsmanId : ball.batsmanId)
        : '';
      if (effectiveWicket && dismissedId && innings.playerStats[dismissedId]) {
        const ds = { ...innings.playerStats[dismissedId] };
        ds.isOut = true;
        ds.wicketType = ball.wicketType;
        ds.bowlerId = ball.wicketType === 'Run-Out' ? '' : ball.bowlerId;
        ds.fielderId = ball.fielderId;
        innings.playerStats = { ...innings.playerStats, [dismissedId]: ds };
      }

      const recordedBall: BallEvent = effectiveWicket ? ball : { ...ball, isWicket: false, wicketType: wicketNullifiedByFreeHit ? '' : ball.wicketType };
      if (effectiveWicket) {
        innings.wickets += 1;
        innings.fallOfWickets = [...innings.fallOfWickets, {
          score: innings.runs,
          wicket: innings.wickets,
          batsmanId: dismissedId,
          over: `${innings.overs}.${innings.balls}`,
        }];
      }
      innings.ballEvents = [...innings.ballEvents, recordedBall];
      lm.undoStack = [...(lm.undoStack || []).slice(-20), snapshot];
      // Next ball is a free hit only if THIS ball was a no-ball.
      lm.freeHit = ball.extraType === 'No-Ball';

      // ── Strike rotation on odd runs (byes/leg-byes count; wides don't) ──
      const runsRun = (ball.extraType === 'Bye' || ball.extraType === 'Leg-Bye') ? ball.extras : ball.runs;
      if (ball.extraType !== 'Wide' && runsRun % 2 === 1) {
        const tmp = innings.currentBatter1;
        innings.currentBatter1 = innings.currentBatter2;
        innings.currentBatter2 = tmp;
      }

      // ── Wicket: whichever slot holds the dismissed player must be replaced ──
      if (effectiveWicket && dismissedId) {
        if (innings.currentBatter1 === dismissedId) innings.currentBatter1 = '';
        else if (innings.currentBatter2 === dismissedId) innings.currentBatter2 = '';
      }

      // ── Over complete: ends change (batters swap) + a new bowler is required ──
      if (overJustCompleted) {
        lm.lastOverBowlerId = ball.bowlerId;
        const tmp = innings.currentBatter1;
        innings.currentBatter1 = innings.currentBatter2;
        innings.currentBatter2 = tmp;
        innings.currentBowler = '';
      }

      if (lm.currentInnings === 1) lm.innings1 = innings;
      else lm.innings2 = innings;
      lm.updatedAt = Date.now();

      // ── Check whether the innings (or match) has ended ──
      const battingTeamPlayerCount = s.allPlayers.filter(p => p.teamId === innings.teamId && p.tournamentId === s.activeTournamentId).length || 11;
      const allOut = innings.wickets >= Math.max(1, battingTeamPlayerCount - 1);
      const oversComplete = innings.overs >= lm.overs;
      const chaseComplete = lm.currentInnings === 2 && innings.runs > lm.innings1.runs;

      if (allOut || oversComplete || chaseComplete) {
        if (lm.currentInnings === 1) {
          lm.currentInnings = 2;
          lm.innings2 = { ...lm.innings2, target: innings.runs + 1 };
          lm.lastOverBowlerId = '';
          lm.freeHit = false;
        } else {
          lm.status = 'completed';
          const allLiveMatches = [...s.allLiveMatches.filter(x => x.id !== current.id), lm];
          return finalizeMatch({ ...s, allLiveMatches }, lm);
        }
      }

      const allLiveMatches = [...s.allLiveMatches.filter(x => x.id !== current.id), lm];
      lsSet('kdpl_all_live_matches', allLiveMatches);
      cloudSetLiveMatch(lm);
      return withDerived({ ...s, allLiveMatches });
    });
  }, []);

  // Set the opening striker, non-striker and bowler — used to start each innings
  const selectOpeners = useCallback((strikerId: string, nonStrikerId: string, bowlerId: string) => {
    setState(s => {
      const current = findActiveLiveMatch(s);
      if (!current) return s;
      const lm = { ...current };
      const innings = lm.currentInnings === 1 ? { ...lm.innings1 } : { ...lm.innings2 };
      innings.currentBatter1 = strikerId;
      innings.currentBatter2 = nonStrikerId;
      innings.currentBowler = bowlerId;
      innings.playerStats = {
        ...innings.playerStats,
        [strikerId]: innings.playerStats[strikerId] || { runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, wicketType: '', bowlerId: '', fielderId: '', strikeRate: 0 },
        [nonStrikerId]: innings.playerStats[nonStrikerId] || { runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, wicketType: '', bowlerId: '', fielderId: '', strikeRate: 0 },
      };
      innings.bowlerStats = {
        ...innings.bowlerStats,
        [bowlerId]: innings.bowlerStats[bowlerId] || { overs: 0, balls: 0, runs: 0, wickets: 0, maidens: 0, economy: 0 },
      };
      if (lm.currentInnings === 1) lm.innings1 = innings; else lm.innings2 = innings;
      lm.updatedAt = Date.now();
      const allLiveMatches = [...s.allLiveMatches.filter(x => x.id !== current.id), lm];
      lsSet('kdpl_all_live_matches', allLiveMatches);
      cloudSetLiveMatch(lm);
      return withDerived({ ...s, allLiveMatches });
    });
  }, []);

  // Replace the dismissed batter (always the striker's slot) with a new batter
  const selectNextBatter = useCallback((batterId: string) => {
    setState(s => {
      const current = findActiveLiveMatch(s);
      if (!current) return s;
      const lm = { ...current };
      const innings = lm.currentInnings === 1 ? { ...lm.innings1 } : { ...lm.innings2 };
      innings.currentBatter1 = batterId;
      innings.playerStats = {
        ...innings.playerStats,
        [batterId]: innings.playerStats[batterId] || { runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, wicketType: '', bowlerId: '', fielderId: '', strikeRate: 0 },
      };
      if (lm.currentInnings === 1) lm.innings1 = innings; else lm.innings2 = innings;
      lm.updatedAt = Date.now();
      const allLiveMatches = [...s.allLiveMatches.filter(x => x.id !== current.id), lm];
      lsSet('kdpl_all_live_matches', allLiveMatches);
      cloudSetLiveMatch(lm);
      return withDerived({ ...s, allLiveMatches });
    });
  }, []);

  // Set the bowler for the next over (can't be the same bowler who just bowled)
  const selectNextBowler = useCallback((bowlerId: string) => {
    setState(s => {
      const current = findActiveLiveMatch(s);
      if (!current) return s;
      const lm = { ...current };
      const innings = lm.currentInnings === 1 ? { ...lm.innings1 } : { ...lm.innings2 };
      innings.currentBowler = bowlerId;
      innings.bowlerStats = {
        ...innings.bowlerStats,
        [bowlerId]: innings.bowlerStats[bowlerId] || { overs: 0, balls: 0, runs: 0, wickets: 0, maidens: 0, economy: 0 },
      };
      if (lm.currentInnings === 1) lm.innings1 = innings; else lm.innings2 = innings;
      lm.updatedAt = Date.now();
      const allLiveMatches = [...s.allLiveMatches.filter(x => x.id !== current.id), lm];
      lsSet('kdpl_all_live_matches', allLiveMatches);
      cloudSetLiveMatch(lm);
      return withDerived({ ...s, allLiveMatches });
    });
  }, []);

  // Organizer override — end the current innings early (e.g. declaration)
  const endInningsManually = useCallback(() => {
    setState(s => {
      const current = findActiveLiveMatch(s);
      if (!current) return s;
      const lm = { ...current };
      if (lm.currentInnings === 1) {
        lm.currentInnings = 2;
        lm.innings2 = { ...lm.innings2, target: lm.innings1.runs + 1 };
        lm.lastOverBowlerId = '';
        lm.freeHit = false;
        lm.updatedAt = Date.now();
        const allLiveMatches = [...s.allLiveMatches.filter(x => x.id !== current.id), lm];
        lsSet('kdpl_all_live_matches', allLiveMatches);
        cloudSetLiveMatch(lm);
        return withDerived({ ...s, allLiveMatches });
      } else {
        lm.status = 'completed';
        const allLiveMatches = [...s.allLiveMatches.filter(x => x.id !== current.id), lm];
        return finalizeMatch({ ...s, allLiveMatches }, lm);
      }
    });
  }, []);

  // Organizer override — end the match right now (abandon / force result)
  const endMatchManually = useCallback(() => {
    setState(s => {
      const current = findActiveLiveMatch(s);
      if (!current) return s;
      const lm = { ...current, status: 'completed' as const };
      const allLiveMatches = [...s.allLiveMatches.filter(x => x.id !== current.id), lm];
      return finalizeMatch({ ...s, allLiveMatches }, lm);
    });
  }, []);

  const undoBall = useCallback(() => {
    setState(s => {
      const current = findActiveLiveMatch(s);
      if (!current || !current.undoStack?.length) return s;
      const lm = { ...current };
      const undoStack = [...lm.undoStack];
      const snap = undoStack.pop();
      if (!snap) return s;
      lm.undoStack = undoStack;
      const last = snap.ball;

      // If the match had already completed and this ball ended it, reopen it.
      if (lm.status === 'completed') lm.status = 'live';
      lm.currentInnings = snap.innings;

      const innings = snap.innings === 1 ? { ...lm.innings1 } : { ...lm.innings2 };
      innings.runs = Math.max(0, innings.runs - last.runs - last.extras);
      innings.extras = Math.max(0, innings.extras - last.extras);
      if (last.extraType !== 'Wide' && last.extraType !== 'No-Ball') {
        if (innings.balls === 0 && innings.overs > 0) { innings.overs -= 1; innings.balls = 5; }
        else innings.balls = Math.max(0, innings.balls - 1);
      }
      if (last.isWicket) innings.wickets = Math.max(0, innings.wickets - 1);
      innings.ballEvents = innings.ballEvents.slice(0, -1);
      if (last.isWicket) innings.fallOfWickets = innings.fallOfWickets.slice(0, -1);

      // Reverse batter stats (mirrors the crediting rule in recordBall: byes/
      // leg-byes/wides were never added to the batsman's personal score)
      const runsWereCreditedToBatsman = (last.extraType === '' || last.extraType === 'No-Ball') ? last.runs : 0;
      if (innings.playerStats[last.batsmanId]) {
        const bs = { ...innings.playerStats[last.batsmanId] };
        bs.runs = Math.max(0, bs.runs - runsWereCreditedToBatsman);
        if (last.extraType === '' || last.extraType === 'No-Ball') bs.balls = Math.max(0, bs.balls - 1);
        if (runsWereCreditedToBatsman === 4) bs.fours = Math.max(0, bs.fours - 1);
        if (runsWereCreditedToBatsman === 6) bs.sixes = Math.max(0, bs.sixes - 1);
        bs.strikeRate = bs.balls > 0 ? (bs.runs / bs.balls) * 100 : 0;
        innings.playerStats = { ...innings.playerStats, [last.batsmanId]: bs };
      }
      // Reverse the dismissal record on whichever player it was actually applied to
      const dismissedId = last.isWicket
        ? (last.wicketType === 'Run-Out' && last.runOutBatsmanId ? last.runOutBatsmanId : last.batsmanId)
        : '';
      if (dismissedId && innings.playerStats[dismissedId]) {
        const ds = { ...innings.playerStats[dismissedId] };
        ds.isOut = false; ds.wicketType = ''; ds.bowlerId = ''; ds.fielderId = '';
        innings.playerStats = { ...innings.playerStats, [dismissedId]: ds };
      }
      // Reverse bowler stats (mirrors the byes/leg-byes-not-conceded rule)
      const runsWereAgainstBowler = (last.extraType === 'Bye' || last.extraType === 'Leg-Bye') ? 0 : last.runs + last.extras;
      if (innings.bowlerStats[last.bowlerId]) {
        const bwl = { ...innings.bowlerStats[last.bowlerId] };
        bwl.runs = Math.max(0, bwl.runs - runsWereAgainstBowler);
        if (last.extraType !== 'Wide' && last.extraType !== 'No-Ball') {
          if (bwl.balls === 0 && bwl.overs > 0) { bwl.overs -= 1; bwl.balls = 5; }
          else bwl.balls = Math.max(0, bwl.balls - 1);
        }
        if (last.isWicket && last.wicketType !== 'Run-Out') bwl.wickets = Math.max(0, bwl.wickets - 1);
        bwl.economy = bwl.overs > 0 ? bwl.runs / bwl.overs : 0;
        innings.bowlerStats = { ...innings.bowlerStats, [last.bowlerId]: bwl };
      }

      // Restore exactly who was batting/bowling before this ball
      innings.currentBatter1 = snap.prevBatter1;
      innings.currentBatter2 = snap.prevBatter2;
      innings.currentBowler = snap.prevBowler;
      lm.lastOverBowlerId = snap.prevLastOverBowlerId;
      // The free-hit flag can't be reliably un-derived from history beyond
      // this point, so just clear it — worst case the organizer re-confirms
      // the very next ball, which is a harmless prompt either way.
      lm.freeHit = false;

      if (snap.innings === 1) lm.innings1 = innings;
      else lm.innings2 = innings;
      lm.updatedAt = Date.now();

      const allLiveMatches = [...s.allLiveMatches.filter(x => x.id !== current.id), lm];
      lsSet('kdpl_all_live_matches', allLiveMatches);
      cloudSetLiveMatch(lm);
      return withDerived({ ...s, allLiveMatches });
    });
  }, []);

  return {
    state,
    navigate,
    goBack,
    setTheme,
    setLang,
    loginAdmin,
    logoutAdmin,
    changePin,
    organizerSignUp,
    organizerLogin,
    addSuperAdminEmail,
    removeSuperAdminEmail,
    approveOrganizer,
    rejectOrganizer,
    removeOrganizer,
    switchTournament,
    setActiveFixture,
    setActiveSeries,
    createTournament,
    updateTournament,
    deleteTournament,
    wipeAllTournamentData,
    addTeam,
    updateTeam,
    deleteTeam,
    addPlayer,
    updatePlayer,
    deletePlayer,
    banPlayer,
    unbanPlayer,
    addVenue,
    updateVenue,
    deleteVenue,
    addFixture,
    updateFixture,
    deleteFixture,
    createSeries,
    updateSeries,
    deleteSeries,
    addSeriesMatch,
    awardWalkover,
    cancelFixture,
    updateLiveMatch,
    clearLiveMatch,
    addNotification,
    markNotifRead,
    markAllRead,
    clearNotifications,
    updateAdSlot,
    updateSupportWhatsapp,
    generateFixtures,
    shufflePlayers,
    recordBall,
    undoBall,
    selectOpeners,
    selectNextBatter,
    selectNextBowler,
    endInningsManually,
    endMatchManually,
  };
}

export type KDPLStore = ReturnType<typeof useKDPLStore>;
