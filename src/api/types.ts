// Shared types between the game, the UI and the backend.
// Field names match the Snowflake MOTION_EVENTS / SESSIONS tables (snake_case) so the
// backend can insert rows without remapping. See src/api/CONTRACT.md.

export type Sport = 'BOXING' | 'GOALKEEPER' | 'ARCHERY';

export type MotionEventType =
  | 'PUNCH'
  | 'BLOCK'
  | 'DODGE'
  | 'SAVE'
  | 'GOAL'
  | 'ARROW_RELEASE'
  | 'TICK';

export type PunchType = 'JAB' | 'CROSS' | 'HOOK' | 'UPPERCUT';

/**
 * What a sport engine dispatches. The client fills in ids, sport and timestamps.
 *
 *   window.dispatchEvent(new CustomEvent('motion-event', { detail }))
 *   // or: import { emitMotionEvent } from './api/client'
 */
export interface MotionEventDetail {
  event_type: MotionEventType;
  /** Shoulder-widths per second. */
  peak_velocity?: number;
  /** ms from opponent telegraph to player response. */
  reaction_ms?: number;
  /** 0..100 */
  accuracy_score?: number;
  /** L/R balance 0..1 */
  symmetry_ratio?: number;
  /** Sport-specific detail, e.g. { punchType: 'HOOK', hand: 'L', elbowAngle: 112, landed: true }. */
  metrics?: Record<string, unknown>;
  /** Override round time; otherwise the client computes it from the round start. */
  round_ms?: number;
}

/** One MOTION_EVENTS row, as sent in POST /api/events. */
export interface MotionEvent extends Required<Pick<MotionEventDetail, 'event_type'>> {
  event_id: string;
  session_id: string;
  player_id: string;
  sport: Sport;
  /** ISO-8601 UTC. */
  event_ts: string;
  round_ms: number;
  peak_velocity: number | null;
  reaction_ms: number | null;
  accuracy_score: number | null;
  symmetry_ratio: number | null;
  metrics: Record<string, unknown>;
}

export interface EventsBatchRequest {
  events: MotionEvent[];
}

export type RoundResult = 'WIN' | 'LOSS' | 'KO_WIN' | 'KO_LOSS' | 'DRAW';

/** Local stats the client computes from the events it saw. Sent to the backend as a hint. */
export interface RoundStats {
  punches: number;
  landed: number;
  byType: Partial<Record<PunchType, number>>;
  avgSpeed: number;
  maxSpeed: number;
  blocks: number;
  dodges: number;
  avgReactionMs: number | null;
  leftRightRatio: number | null;
  bestCombo: number;
}

export interface SessionEndRequest {
  session_id: string;
  player_id: string;
  display_name: string;
  sport: Sport;
  started_at: string;
  ended_at: string;
  final_score: number;
  result: RoundResult;
  avg_inference_fps: number | null;
  stats: RoundStats;
}

export interface CoachCard {
  /** One-line summary of the round. */
  headline: string;
  /** Exactly 3 tips. */
  tips: string[];
  drill: { name: string; description: string };
  badge: { name: string; description: string };
}

export interface LeaderboardEntry {
  rank: number;
  player_id: string;
  display_name: string;
  sport: Sport;
  score: number;
  max_speed?: number | null;
}

export interface SessionEndResponse {
  coach: CoachCard;
  leaderboard: LeaderboardEntry[];
  form_score?: number | null;
  /** Set by the client, not the backend: where the data came from. */
  source?: 'live' | 'mock';
}
