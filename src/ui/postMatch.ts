// Post-match screen: result, round stats, Cortex coach card, leaderboard.
// Shows a loading state while the session/end promise is pending.
//
//   const action = await showPostMatch(uiRoot, {
//     result: 'KO_WIN', score: 1840, stats: session.stats(), playerId: session.playerId,
//     data: session.end({ finalScore: 1840, result: 'KO_WIN' }),
//   });
//   if (action === 'rematch') ...

import type { CoachCard, LeaderboardEntry, RoundResult, RoundStats, SessionEndResponse } from '../api/types';
import { el, html, leave } from './dom';
import { ICONS } from './icons';

export type PostMatchAction = 'rematch' | 'menu';

export interface PostMatchOptions {
  result: RoundResult;
  score: number;
  stats: RoundStats;
  playerId: string;
  data: Promise<SessionEndResponse>;
}

const RESULT_TEXT: Record<RoundResult, string> = {
  KO_WIN: 'Knockout!',
  WIN: 'You win',
  DRAW: 'Draw',
  LOSS: 'Out-pointed',
  KO_LOSS: 'Knocked down',
};

const LOADING_LINES = [
  'Snowflake Cortex is reading your punches…',
  'Comparing your left and right hands…',
  'Checking your guard in the last 15 seconds…',
  'Writing your coach card…',
];

function statsRow(s: RoundStats) {
  const acc = s.punches ? `${Math.round((s.landed / s.punches) * 100)}%` : '–';
  const items: [string, string][] = [
    [String(s.punches), 'Punches'],
    [acc, 'Accuracy'],
    [s.maxSpeed.toFixed(1), 'Top SW/s'],
    [`x${s.bestCombo}`, 'Best combo'],
    [String(s.blocks), 'Blocks'],
    [s.avgReactionMs != null ? `${s.avgReactionMs}` : '–', 'Reaction ms'],
  ];
  return el('div', { class: 'kr-stats' }, ...items.map(([v, l]) => el('div', { class: 'kr-stat' }, el('b', {}, v), el('span', {}, l))));
}

function loadingView() {
  const line = el('b', {}, LOADING_LINES[0]);
  let i = 0;
  const t = window.setInterval(() => (line.textContent = LOADING_LINES[++i % LOADING_LINES.length]), 1600);
  const node = el(
    'div',
    { class: 'kr-loading', role: 'status' },
    el('div', { class: 'kr-loading-bars' }, ...Array.from({ length: 5 }, () => el('i'))),
    line,
    el('div', { style: 'width:80%' }, el('div', { class: 'kr-skel' }), el('div', { class: 'kr-skel', style: 'width:70%' })),
  );
  return { node, stop: () => clearInterval(t) };
}

function coachView(c: CoachCard, form: number | null | undefined) {
  return el(
    'div',
    {},
    el('p', { class: 'kr-coach-headline' }, c.headline),
    el('ol', { class: 'kr-coach-tips' }, ...c.tips.slice(0, 3).map((t) => el('li', {}, t))),
    el(
      'div',
      { class: 'kr-coach-foot' },
      el('div', { class: 'kr-drill' }, el('h3', {}, 'Your drill'), el('b', {}, c.drill.name), el('p', {}, c.drill.description)),
      el('div', { class: 'kr-badge' }, html(ICONS.BADGE), el('b', {}, c.badge.name), el('p', {}, c.badge.description)),
    ),
    form != null ? formBar(form) : null,
  );
}

function formBar(score: number) {
  const fill = el('div', { style: 'width:0%' });
  requestAnimationFrame(() => requestAnimationFrame(() => (fill.style.width = `${Math.max(0, Math.min(100, score))}%`)));
  return el('div', { class: 'kr-form' }, 'Form', el('div', { class: 'kr-form-bar' }, fill), el('b', {}, String(Math.round(score))));
}

function leaderboardView(rows: LeaderboardEntry[], playerId: string) {
  if (!rows.length) return el('p', { class: 'kr-hint' }, 'No scores yet. You could be first.');
  return el(
    'table',
    { class: 'kr-lb' },
    el('thead', {}, el('tr', {}, el('th', {}, '#'), el('th', {}, 'Player'), el('th', {}, 'Top SW/s'), el('th', {}, 'Score'))),
    el(
      'tbody',
      {},
      ...rows.map((r) =>
        el(
          'tr',
          { class: r.player_id === playerId ? 'kr-you' : '' },
          el('td', {}, String(r.rank)),
          el('td', {}, r.display_name),
          el('td', {}, r.max_speed != null ? r.max_speed.toFixed(1) : '–'),
          el('td', {}, r.score.toLocaleString()),
        ),
      ),
    ),
  );
}

export function showPostMatch(root: HTMLElement, opts: PostMatchOptions): Promise<PostMatchAction> {
  return new Promise((resolve) => {
    const won = opts.result === 'WIN' || opts.result === 'KO_WIN';

    const coachBody = el('div', { class: 'kr-panel-body' });
    const lbBody = el('div', { class: 'kr-panel-body' });
    const sourceChip = el('span');
    const loading = loadingView();
    coachBody.append(loading.node);
    lbBody.append(el('div', { class: 'kr-skel' }), el('div', { class: 'kr-skel' }), el('div', { class: 'kr-skel' }));

    const rematch = el('button', { class: 'kr-btn kr-btn-pink', type: 'button' }, 'Rematch');
    const menu = el('button', { class: 'kr-btn kr-btn-ghost', type: 'button' }, 'Main menu');

    const screen = el(
      'section',
      { class: 'kr-screen kr-backdrop kr-post' },
      el(
        'div',
        { class: 'kr-post-inner' },
        el(
          'div',
          { class: 'kr-result' },
          el('div', {}, el('span', { class: 'kr-live' }, el('span', {}, 'Final')), el('h1', { class: `kr-result-title ${won ? '' : 'kr-loss'}` }, RESULT_TEXT[opts.result])),
          el('div', { class: 'kr-result-score' }, el('span', { class: 'kr-label' }, 'Score'), el('b', {}, opts.score.toLocaleString())),
        ),
        statsRow(opts.stats),
        el(
          'div',
          { class: 'kr-post-grid' },
          el(
            'div',
            { class: 'kr-panel' },
            el('div', { class: 'kr-panel-head' }, el('h2', {}, 'Coach card'), el('span', { class: 'kr-powered' }, 'by ', el('b', {}, 'Snowflake Cortex'))),
            coachBody,
          ),
          el(
            'div',
            { class: 'kr-panel' },
            el('div', { class: 'kr-panel-head' }, el('h2', {}, 'Leaderboard'), sourceChip),
            lbBody,
          ),
        ),
        el('div', { class: 'kr-post-actions' }, rematch, menu),
      ),
    );
    root.append(screen);

    opts.data
      .then((d) => {
        loading.stop();
        coachBody.replaceChildren(coachView(d.coach, d.form_score));
        lbBody.replaceChildren(leaderboardView(d.leaderboard, opts.playerId));
        sourceChip.replaceChildren(d.source === 'mock' ? el('span', { class: 'kr-chip' }, 'Mock') : el('span', { class: 'kr-live' }, el('span', {}, 'Live')));
      })
      .catch((err) => {
        loading.stop();
        console.error(err);
        coachBody.replaceChildren(el('p', { class: 'kr-hint' }, 'The coach is offline right now. Your round is saved.'));
        lbBody.replaceChildren(el('p', { class: 'kr-hint' }, 'Leaderboard unavailable.'));
      });

    const finish = async (a: PostMatchAction) => {
      loading.stop();
      window.removeEventListener('keydown', onKey);
      await leave(screen);
      resolve(a);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') void finish('rematch');
      if (e.key === 'Escape') void finish('menu');
    };
    rematch.addEventListener('click', () => void finish('rematch'));
    menu.addEventListener('click', () => void finish('menu'));
    window.addEventListener('keydown', onKey);
    rematch.focus();
  });
}
