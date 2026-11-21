// "Hold stance" calibration overlay. Transparent in the middle so the webcam / scene shows through.
//
//   const cal = showCalibration(uiRoot, { sport: 'BOXING' });
//   cal.setState('searching');        // no body found yet
//   cal.setProgress(validFrames / 15); // 0..1, switches to 'holding' when > 0
//   await cal.complete();             // shows LOCKED, then removes itself
//   await showCountdown(uiRoot);      // 3, 2, 1, FIGHT

import type { Sport } from '../api/types';
import { el, html, leave, wait } from './dom';

export type CalibrationState = 'searching' | 'holding' | 'locked';

const COPY: Record<Sport, { title: string; sub: string }> = {
  BOXING: { title: 'Hold stance', sub: 'Gloves up by your cheeks. Keep both shoulders in the frame.' },
  GOALKEEPER: { title: 'Ready position', sub: 'Hands out wide at chest height. Shoulders in the frame.' },
  ARCHERY: { title: 'Square up', sub: 'Stand side-on to the screen, both arms relaxed.' },
};

const STATE_TEXT: Record<CalibrationState, (s: Sport) => { title: string; sub: string }> = {
  searching: () => ({ title: 'Step into frame', sub: 'We need to see your head and both shoulders.' }),
  holding: (s) => COPY[s],
  locked: () => ({ title: 'Locked in', sub: 'Calibrated to your shoulder width.' }),
};

const R = 46; // ring radius in the 100x100 viewBox
const CIRC = 2 * Math.PI * R;

export interface CalibrationOverlay {
  setState(state: CalibrationState): void;
  setProgress(p: number): void;
  complete(): Promise<void>;
  cancel(): void;
  readonly element: HTMLElement;
}

export function showCalibration(root: HTMLElement, opts: { sport: Sport; playerName?: string }): CalibrationOverlay {
  // Silhouette: head, shoulders, raised gloves (boxing guard). Original line art.
  const svg = html(`
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle class="kr-calib-ring-bg" cx="50" cy="50" r="${R}"/>
      <circle class="kr-calib-ring" cx="50" cy="50" r="${R}" stroke-dasharray="${CIRC}" stroke-dashoffset="${CIRC}"/>
      <path class="kr-calib-corner" d="M8 20V8h12M80 8h12v12M92 80v12H80M20 92H8V80"/>
      <g class="kr-calib-silhouette">
        <ellipse cx="50" cy="34" rx="9" ry="11"/>
        <path d="M43 45q-1 4-3 6M57 45q1 4 3 6"/>
        <path d="M22 90V66q0-12 14-15l14-3 14 3q14 3 14 15v24"/>
        <path d="M30 66l-2-16q0-4 4-4"/>
        <path d="M70 66l2-16q0-4-4-4"/>
        <rect x="27" y="30" width="11" height="14" rx="5"/>
        <rect x="62" y="30" width="11" height="14" rx="5"/>
      </g>
    </svg>`);

  const ring = svg.querySelector<SVGCircleElement>('.kr-calib-ring')!;
  const title = el('div', { class: 'kr-calib-title' });
  const sub = el('div', { class: 'kr-calib-sub' });
  const pct = el('span', { class: 'kr-chip' }, '0%');

  const screen = el(
    'section',
    { class: 'kr-screen kr-calib', 'data-state': 'searching', role: 'status', 'aria-live': 'polite' },
    el(
      'div',
      { class: 'kr-calib-top' },
      el('span', { class: 'kr-live' }, el('span', {}, 'Calibrating')),
      opts.playerName ? el('span', { class: 'kr-label' }, opts.playerName) : null,
    ),
    el('div', { class: 'kr-calib-frame' }, svg),
    el('div', { class: 'kr-calib-text' }, title, sub, pct),
  );
  root.append(screen);

  let state: CalibrationState | null = null;
  const setState = (s: CalibrationState) => {
    if (s === state) return;
    state = s;
    screen.dataset.state = s;
    const t = STATE_TEXT[s](opts.sport);
    title.textContent = t.title;
    sub.textContent = t.sub;
  };
  const setProgress = (p: number) => {
    const v = Math.max(0, Math.min(1, p));
    ring.style.strokeDashoffset = String(CIRC * (1 - v));
    pct.textContent = `${Math.round(v * 100)}%`;
    if (state !== 'locked') setState(v > 0 ? 'holding' : 'searching');
  };
  setState('searching');

  return {
    element: screen,
    setState,
    setProgress,
    async complete() {
      setProgress(1);
      setState('locked');
      await wait(700);
      await leave(screen);
    },
    cancel() {
      screen.remove();
    },
  };
}

/** Big 3-2-1-FIGHT countdown over the scene. Resolves when FIGHT appears. */
export async function showCountdown(root: HTMLElement, words = ['3', '2', '1'], go = 'Fight!'): Promise<void> {
  const box = el('div', { class: 'kr-countdown', 'aria-live': 'assertive' });
  root.append(box);
  for (const w of words) {
    box.replaceChildren(el('span', {}, w));
    await wait(700);
  }
  box.replaceChildren(el('span', { class: 'kr-go' }, go));
  setTimeout(() => box.remove(), 800);
}
