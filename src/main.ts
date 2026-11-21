// App flow glue. TEMPORARY: uses dev mocks for calibration and the round.
// When the pose pipeline + Three.js boxing engine land, swap runMockCalibration /
// runMockRound for the real ones; the UI and API calls stay the same.

import { createSession } from './api/client';
import { createHud, showCalibration, showCountdown, showPostMatch, showStartScreen } from './ui';
import { runMockCalibration } from './dev/mockCalibration';
import { runMockRound } from './dev/mockRound';

const ROUND_MS = Number(import.meta.env.VITE_ROUND_MS ?? 40000);
const ui = document.getElementById('ui')!;

async function play(name: string, sport: Parameters<typeof createSession>[0]['sport']) {
  const cal = showCalibration(ui, { sport, playerName: name });
  await runMockCalibration(cal);

  const session = createSession({ displayName: name, sport });
  const hud = createHud(ui, { playerName: name, opponentName: 'Unit-07' });
  hud.update({ timeLeftMs: ROUND_MS });
  await showCountdown(ui);
  session.start();

  const { result, score } = await runMockRound(hud, ROUND_MS);
  hud.banner(result.startsWith('KO') ? 'K.O.!' : 'Time!', result.endsWith('WIN') ? 'good' : 'bad');
  await new Promise((r) => setTimeout(r, 1200));
  hud.destroy();

  const data = session.end({ finalScore: score, result });
  return showPostMatch(ui, { result, score, stats: session.stats(), playerId: session.playerId, data });
}

async function main() {
  for (;;) {
    const { name, sport } = await showStartScreen(ui);
    while ((await play(name, sport)) === 'rematch') {
      /* loop */
    }
  }
}

void main();
