// In-round HUD: HP bars, timer, combo counter, punch speed gauge.
//
//   const hud = createHud(uiRoot, { playerName: 'NAMAN', opponentName: 'UNIT-07' });
//   hud.update({ playerHp: 80, opponentHp: 55, timeLeftMs: 31000 });
//   hud.punch({ type: 'HOOK', speed: 3.1, landed: true });   // updates combo + speed gauge
//   hud.playerHit();                                          // red vignette, combo reset
//   hud.banner('Blocked!', 'good');
//   hud.destroy();

import { el, fmtTime } from './dom';

export interface HudOptions {
  playerName: string;
  opponentName?: string;
  maxHp?: number;
  /** Speed that fills the gauge, in shoulder-widths per second. */
  maxSpeed?: number;
}

export interface HudState {
  playerHp: number;
  opponentHp: number;
  timeLeftMs: number;
  combo: number;
}

export interface Hud {
  update(s: Partial<HudState>): void;
  punch(p: { type?: string; speed: number; landed?: boolean }): void;
  playerHit(): void;
  banner(text: string, tone?: 'good' | 'bad'): void;
  setMode(label: string | null): void;
  destroy(): void;
  readonly element: HTMLElement;
}

export function createHud(root: HTMLElement, opts: HudOptions): Hud {
  const maxHp = opts.maxHp ?? 100;
  const maxSpeed = opts.maxSpeed ?? 5;

  const fighter = (name: string, side: 'left' | 'right') => {
    const fill = el('div', { class: 'kr-hp-fill' });
    const lag = el('div', { class: 'kr-hp-lag' });
    const bar = el('div', { class: 'kr-hp', role: 'meter', 'aria-label': `${name} health`, 'aria-valuemin': '0', 'aria-valuemax': String(maxHp) }, lag, fill);
    const num = el('span', { class: 'kr-hp-num' });
    const box = el(
      'div',
      { class: `kr-fighter kr-${side}` },
      el('div', { class: 'kr-fighter-name' }, el('span', {}, name), num),
      bar,
    );
    return { box, bar, fill, lag, num, hp: maxHp };
  };

  const me = fighter(opts.playerName, 'left');
  const foe = fighter(opts.opponentName ?? 'Unit-07', 'right');

  const timerValue = el('div', { class: 'kr-timer-value' }, '0:00');
  const timer = el('div', { class: 'kr-timer' }, timerValue, el('div', { class: 'kr-timer-label' }, 'Round 1'));

  const comboNum = el('div', { class: 'kr-combo-num' }, 'x0');
  const combo = el('div', { class: 'kr-combo' }, comboNum, el('div', { class: 'kr-combo-label' }, 'Combo'));

  const speedType = el('span', { class: 'kr-speed-type' }, '');
  const speedVal = el('div', { class: 'kr-speed-value' }, '0.0', el('small', {}, 'SW/s'));
  const speedFill = el('div');
  const speedBest = el('div', { class: 'kr-speed-best' }, 'Best 0.0');
  const speed = el(
    'div',
    { class: 'kr-speed' },
    el('div', { class: 'kr-speed-head' }, el('span', { class: 'kr-speed-label' }, 'Punch speed'), speedType),
    speedVal,
    el('div', { class: 'kr-speed-bar' }, speedFill),
    speedBest,
  );

  const bannerBox = el('div', { class: 'kr-hud-banner', 'aria-live': 'polite' });
  const modeBox = el('div', { class: 'kr-hud-mode' });
  const vignette = el('div', { class: 'kr-hud-vignette' });

  const hud = el(
    'div',
    { class: 'kr-hud' },
    vignette,
    el('div', { class: 'kr-hud-top' }, me.box, timer, foe.box),
    modeBox,
    bannerBox,
    el('div', { class: 'kr-hud-bottom' }, combo, speed),
  );
  root.append(hud);

  let comboCount = 0;
  let best = 0;
  let speedDecay: number | undefined;

  const setHp = (f: ReturnType<typeof fighter>, hp: number) => {
    const v = Math.max(0, Math.min(maxHp, hp));
    if (v < f.hp) {
      f.bar.classList.remove('kr-hit');
      void f.bar.offsetWidth; // restart animation
      f.bar.classList.add('kr-hit');
    }
    f.hp = v;
    const pct = `${(v / maxHp) * 100}%`;
    f.fill.style.width = pct;
    f.lag.style.width = pct;
    f.num.textContent = String(Math.ceil(v));
    f.bar.setAttribute('aria-valuenow', String(Math.ceil(v)));
    f.bar.classList.toggle('kr-low', v / maxHp <= 0.25);
  };

  const setCombo = (n: number) => {
    const up = n > comboCount;
    comboCount = n;
    comboNum.textContent = `x${n}`;
    combo.classList.toggle('kr-on', n >= 2);
    if (up && n >= 2) {
      comboNum.classList.remove('kr-bump');
      void comboNum.offsetWidth;
      comboNum.classList.add('kr-bump');
    }
  };

  const update = (s: Partial<HudState>) => {
    if (s.playerHp !== undefined) setHp(me, s.playerHp);
    if (s.opponentHp !== undefined) setHp(foe, s.opponentHp);
    if (s.timeLeftMs !== undefined) {
      timerValue.textContent = fmtTime(s.timeLeftMs);
      timer.classList.toggle('kr-urgent', s.timeLeftMs <= 10000);
    }
    if (s.combo !== undefined) setCombo(s.combo);
  };

  update({ playerHp: maxHp, opponentHp: maxHp, timeLeftMs: 0, combo: 0 });

  return {
    element: hud,
    update,
    punch({ type, speed: v, landed = true }) {
      speedType.textContent = type ?? '';
      speedVal.firstChild!.textContent = v.toFixed(1);
      speedFill.style.width = `${Math.min(1, v / maxSpeed) * 100}%`;
      if (v > best) {
        best = v;
        speedBest.textContent = `Best ${best.toFixed(1)}`;
      }
      clearTimeout(speedDecay);
      speedDecay = window.setTimeout(() => (speedFill.style.width = '0%'), 900);
      setCombo(landed ? comboCount + 1 : 0);
    },
    playerHit() {
      setCombo(0);
      vignette.classList.add('kr-hurt');
      setTimeout(() => vignette.classList.remove('kr-hurt'), 180);
    },
    banner(text, tone = 'bad') {
      bannerBox.replaceChildren(el('span', { class: tone === 'good' ? 'kr-good' : '' }, text));
    },
    setMode(label) {
      modeBox.replaceChildren(...(label ? [el('span', { class: 'kr-chip' }, label)] : []));
    },
    destroy() {
      clearTimeout(speedDecay);
      hud.remove();
    },
  };
}
