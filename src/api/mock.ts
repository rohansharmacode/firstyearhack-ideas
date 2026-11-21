// Mock backend used until Person B's API is live (or when it is unreachable).
// The coach card is built from the player's real round stats, so it still feels personal.

import type {
  CoachCard,
  LeaderboardEntry,
  SessionEndRequest,
  SessionEndResponse,
  Sport,
} from './types';

const SEED_NAMES = ['VoltJab', 'Mx. Quickstep', 'NeonNana', 'Byte Brawler', 'Kestrel', 'Glitchfist', 'Lumen', 'Static Sam', 'Orbit', 'Juniper'];
const LB_KEY = 'kr.mockLeaderboard';

function seedBoard(sport: Sport): LeaderboardEntry[] {
  return SEED_NAMES.map((name, i) => ({
    rank: i + 1,
    player_id: `seed-${i}`,
    display_name: name,
    sport,
    score: 2400 - i * 190 + Math.round(Math.sin(i * 7) * 40),
    max_speed: +(4.6 - i * 0.22).toFixed(1),
  }));
}

function loadBoard(sport: Sport): LeaderboardEntry[] {
  try {
    const all = JSON.parse(localStorage.getItem(LB_KEY) ?? '{}') as Record<string, LeaderboardEntry[]>;
    return all[sport] ?? seedBoard(sport);
  } catch {
    return seedBoard(sport);
  }
}

function saveBoard(sport: Sport, board: LeaderboardEntry[]) {
  try {
    const all = JSON.parse(localStorage.getItem(LB_KEY) ?? '{}');
    all[sport] = board;
    localStorage.setItem(LB_KEY, JSON.stringify(all));
  } catch {
    /* storage full or disabled: fine for a mock */
  }
}

function buildCoach(req: SessionEndRequest): CoachCard {
  const s = req.stats;
  const tips: string[] = [];
  const types = Object.entries(s.byType).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
  const top = types[0]?.[0]?.toLowerCase() ?? 'jab';
  const accuracy = s.punches ? Math.round((s.landed / s.punches) * 100) : 0;

  if (s.punches === 0) {
    tips.push('Throw first. Even a soft jab every second keeps the drone honest.');
  } else if (accuracy < 60) {
    tips.push(`Only ${accuracy}% of your punches landed. Wait for the red ring to fade before you fire.`);
  } else {
    tips.push(`${accuracy}% accuracy. Your ${top} is your best weapon, so build combos off it.`);
  }

  if (s.blocks < 3) {
    tips.push(`You blocked ${s.blocks} time${s.blocks === 1 ? '' : 's'}. Bring both gloves to your face when the drone charges.`);
  } else {
    tips.push(`${s.blocks} blocks. Good guard. Now counter straight after each block for the 1.5x window.`);
  }

  if (s.leftRightRatio !== null && (s.leftRightRatio < 0.7 || s.leftRightRatio > 1.4)) {
    const weak = s.leftRightRatio < 1 ? 'left' : 'right';
    tips.push(`Your ${weak} hand is doing less work. Aim for an even split between left and right.`);
  } else if (s.maxSpeed > 0) {
    tips.push(`Peak speed ${s.maxSpeed.toFixed(1)} SW/s, average ${s.avgSpeed.toFixed(1)}. Snap back to guard to keep it up late in the round.`);
  } else {
    tips.push('Snap each punch back to your guard. Returning fast is as important as going out fast.');
  }

  const badge =
    s.maxSpeed >= 4
      ? { name: 'Neon Hammer', description: 'Top-tier hand speed.' }
      : s.blocks >= 6
        ? { name: 'Iron Visor', description: 'Defence first, always.' }
        : s.bestCombo >= 5
          ? { name: 'Chain Reactor', description: 'Combos for days.' }
          : { name: 'Spark Rookie', description: 'First steps in the Kinetic Ring.' };

  return {
    headline: s.punches
      ? `${s.punches} punches, ${s.landed} landed, best combo x${s.bestCombo}.`
      : 'A quiet round. Next time, let your hands go.',
    tips,
    drill: {
      name: 'Guard-Return Jabs',
      description: '3 rounds of 30 s: jab, return both gloves to your cheeks, repeat. Count only jabs that come back to guard.',
    },
    badge,
  };
}

export async function mockSessionEnd(req: SessionEndRequest): Promise<SessionEndResponse> {
  await new Promise((r) => setTimeout(r, 1400)); // pretend Cortex is thinking
  const board = loadBoard(req.sport).filter((e) => e.player_id !== req.player_id || e.score > req.final_score);
  if (!board.some((e) => e.player_id === req.player_id)) {
    board.push({
      rank: 0,
      player_id: req.player_id,
      display_name: req.display_name,
      sport: req.sport,
      score: req.final_score,
      max_speed: req.stats.maxSpeed || null,
    });
  }
  board.sort((a, b) => b.score - a.score);
  board.forEach((e, i) => (e.rank = i + 1));
  saveBoard(req.sport, board.slice(0, 50));

  const s = req.stats;
  const form = Math.round(
    Math.min(100, 40 + (s.punches ? (s.landed / s.punches) * 30 : 0) + Math.min(s.blocks, 6) * 3 + Math.min(s.maxSpeed, 5) * 2),
  );
  return { coach: buildCoach(req), leaderboard: board.slice(0, 10), form_score: form, source: 'mock' };
}
