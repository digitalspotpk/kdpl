import type { Innings, Partnership } from '../types';

// Partnerships are reconstructed from the ball-by-ball record rather than
// maintained as separate mutable state — that keeps them automatically
// correct after every undo/edit instead of needing their own undo logic.
export function computePartnerships(innings: Innings): Partnership[] {
  const partnerships: Partnership[] = [];
  let batter1 = '';
  let batter2 = '';
  let runs = 0;
  let balls = 0;

  for (const ball of innings.ballEvents) {
    // First ball of the innings — seed the opening pair.
    if (!batter1 && !batter2) {
      batter1 = ball.batsmanId;
    } else if (batter1 && !batter2 && ball.batsmanId !== batter1) {
      batter2 = ball.batsmanId;
    }

    runs += ball.runs + ball.extras;
    if (ball.extraType === '' || ball.extraType === 'No-Ball') balls += 1;

    if (ball.isWicket) {
      partnerships.push({ batter1Id: batter1, batter2Id: batter2, runs, balls });
      // Whoever was dismissed drops out; the incoming batter is picked up
      // from ball events once one arrives (see selectNextBatter → next ball).
      const dismissedId = ball.wicketType === 'Run-Out' && ball.runOutBatsmanId ? ball.runOutBatsmanId : ball.batsmanId;
      const survivor = dismissedId === batter1 ? batter2 : batter1;
      batter1 = survivor;
      batter2 = '';
      runs = 0;
      balls = 0;
    }
  }

  // Current, still-in-progress partnership (if the innings hasn't ended)
  if (batter1 || batter2) {
    partnerships.push({ batter1Id: batter1, batter2Id: batter2, runs, balls });
  }

  return partnerships;
}
