// Telemetry client: listens for 'motion-event' on window, batches every 2 s to
// POST {VITE_API_URL}/api/events, and calls /api/session/end at round end.
// Uses mock data when VITE_API_URL is empty, VITE_USE_MOCK=true, or the API fails.

import { mockSessionEnd } from './mock';
import type {
  MotionEvent,
  MotionEventDetail,
  PunchType,
  RoundResult,
  RoundStats,
  SessionEndRequest,
  SessionEndResponse,
  Sport,
} from './types';

export const MOTION_EVENT = 'motion-event';

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
export const USE_MOCK = !API_URL || import.meta.env.VITE_USE_MOCK === 'true';

const FLUSH_MS = 2000;
const MAX_BUFFER = 5000;
const END_TIMEOUT_MS = 20000;

/** Convenience for sport engines: same as dispatching the CustomEvent yourself. */
export function emitMotionEvent(detail: MotionEventDetail) {
  window.dispatchEvent(new CustomEvent<MotionEventDetail>(MOTION_EVENT, { detail }));
}

const uuid = () =>
  crypto.randomUUID?.() ??
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

/** Stable player id per display name on this browser. */
export function playerIdFor(name: string): string {
  const key = `kr.player.${name.trim().toLowerCase()}`;
  let id = localStorage.getItem(key);
  if (!id) {
    id = uuid();
    localStorage.setItem(key, id);
  }
  return id;
}

async function postJson(path: string, body: unknown, timeoutMs = 8000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`${path} -> ${res.status}`);
    return res;
  } finally {
    clearTimeout(t);
  }
}

export interface SessionOptions {
  displayName: string;
  sport: Sport;
}

export interface EndOptions {
  finalScore: number;
  result: RoundResult;
  avgInferenceFps?: number | null;
}

export class TelemetrySession {
  readonly sessionId = uuid();
  readonly playerId: string;
  readonly displayName: string;
  readonly sport: Sport;
  /** True after a live call failed and we fell back to mock. */
  offline = USE_MOCK;

  private buffer: MotionEvent[] = [];
  private all: MotionEvent[] = [];
  private startedAt = 0;
  private startedAtIso = new Date().toISOString();
  private timer: number | undefined;
  private flushing = false;
  private combo = 0;
  private bestCombo = 0;
  private ended = false;

  constructor(opts: SessionOptions) {
    this.displayName = opts.displayName.trim() || 'Player';
    this.sport = opts.sport;
    this.playerId = playerIdFor(this.displayName);
  }

  /** Call when the round actually starts (after calibration + countdown). */
  start() {
    this.startedAt = performance.now();
    this.startedAtIso = new Date().toISOString();
    window.addEventListener(MOTION_EVENT, this.onEvent);
    window.addEventListener('pagehide', this.onPageHide);
    this.timer = window.setInterval(() => void this.flush(), FLUSH_MS);
  }

  get roundMs() {
    return this.startedAt ? Math.round(performance.now() - this.startedAt) : 0;
  }

  private onEvent = (e: Event) => {
    if (this.ended) return;
    const d = (e as CustomEvent<MotionEventDetail>).detail;
    if (!d?.event_type) return;
    const ev: MotionEvent = {
      event_id: uuid(),
      session_id: this.sessionId,
      player_id: this.playerId,
      sport: this.sport,
      event_ts: new Date().toISOString(),
      round_ms: d.round_ms ?? this.roundMs,
      event_type: d.event_type,
      peak_velocity: d.peak_velocity ?? null,
      reaction_ms: d.reaction_ms ?? null,
      accuracy_score: d.accuracy_score ?? null,
      symmetry_ratio: d.symmetry_ratio ?? null,
      metrics: d.metrics ?? {},
    };
    this.all.push(ev);
    this.buffer.push(ev);
    if (this.buffer.length > MAX_BUFFER) this.buffer.splice(0, this.buffer.length - MAX_BUFFER);

    if (ev.event_type === 'PUNCH') {
      if (ev.metrics.landed === false) this.combo = 0;
      else this.bestCombo = Math.max(this.bestCombo, ++this.combo);
    }
  };

  /** Engines can reset the combo when the player gets hit. */
  breakCombo() {
    this.combo = 0;
  }

  private onPageHide = () => {
    if (USE_MOCK || !this.buffer.length) return;
    navigator.sendBeacon?.(`${API_URL}/api/events`, JSON.stringify({ events: this.buffer }));
    this.buffer = [];
  };

  async flush(): Promise<void> {
    if (this.flushing || !this.buffer.length) return;
    const batch = this.buffer;
    this.buffer = [];
    if (USE_MOCK) {
      if (import.meta.env.DEV) console.debug(`[api:mock] /api/events x${batch.length}`, batch);
      return;
    }
    this.flushing = true;
    try {
      await postJson('/api/events', { events: batch });
    } catch (err) {
      console.warn('[api] events batch failed, will retry', err);
      this.offline = true;
      this.buffer = batch.concat(this.buffer); // retry next tick
    } finally {
      this.flushing = false;
    }
  }

  stats(): RoundStats {
    const punches = this.all.filter((e) => e.event_type === 'PUNCH');
    const speeds = punches.map((e) => e.peak_velocity).filter((v): v is number => v != null);
    const reactions = this.all.map((e) => e.reaction_ms).filter((v): v is number => v != null);
    const byType: Partial<Record<PunchType, number>> = {};
    let left = 0;
    let right = 0;
    for (const p of punches) {
      const t = p.metrics.punchType as PunchType | undefined;
      if (t) byType[t] = (byType[t] ?? 0) + 1;
      if (p.metrics.hand === 'L') left++;
      if (p.metrics.hand === 'R') right++;
    }
    return {
      punches: punches.length,
      landed: punches.filter((p) => p.metrics.landed !== false).length,
      byType,
      avgSpeed: speeds.length ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0,
      maxSpeed: speeds.length ? Math.max(...speeds) : 0,
      blocks: this.all.filter((e) => e.event_type === 'BLOCK').length,
      dodges: this.all.filter((e) => e.event_type === 'DODGE').length,
      avgReactionMs: reactions.length ? Math.round(reactions.reduce((a, b) => a + b, 0) / reactions.length) : null,
      leftRightRatio: right ? +(left / right).toFixed(2) : null,
      bestCombo: this.bestCombo,
    };
  }

  /** Stop listening, flush the last batch, then ask the backend for the coach card + leaderboard. */
  async end(opts: EndOptions): Promise<SessionEndResponse> {
    if (this.ended) throw new Error('session already ended');
    this.ended = true;
    window.removeEventListener(MOTION_EVENT, this.onEvent);
    window.removeEventListener('pagehide', this.onPageHide);
    clearInterval(this.timer);

    const req: SessionEndRequest = {
      session_id: this.sessionId,
      player_id: this.playerId,
      display_name: this.displayName,
      sport: this.sport,
      started_at: this.startedAtIso,
      ended_at: new Date().toISOString(),
      final_score: Math.round(opts.finalScore),
      result: opts.result,
      avg_inference_fps: opts.avgInferenceFps ?? null,
      stats: this.stats(),
    };

    if (USE_MOCK) return mockSessionEnd(req);

    // Wait for any in-flight batch, then send what's left (one retry).
    while (this.flushing) await new Promise((r) => setTimeout(r, 50));
    await this.flush();
    if (this.buffer.length) await this.flush();

    try {
      const res = await postJson('/api/session/end', req, END_TIMEOUT_MS);
      const data = (await res.json()) as SessionEndResponse;
      return { ...data, source: 'live' };
    } catch (err) {
      console.warn('[api] session/end failed, using mock coach', err);
      this.offline = true;
      return mockSessionEnd(req);
    }
  }
}

/** Shortcut: new TelemetrySession(opts). */
export function createSession(opts: SessionOptions) {
  return new TelemetrySession(opts);
}
