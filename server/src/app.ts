import { randomUUID } from 'node:crypto';
import cors from 'cors';
import express, { type Express } from 'express';
import { createAskRouter } from './ask';
import type { AppConfig } from './config';
import type { Cortex } from './cortex';
import { HttpError, db, errorHandler, notFoundHandler, zodDetails } from './errors';
import { EventQueue, QueueFullError } from './eventQueue';
import type { Logger } from './logger';
import { computePercentiles } from './percentile';
import type { Repo } from './repo/types';
import { CreatePlayerBody, EndSessionBody, EventBatch, IdSchema, StartSessionBody } from './schemas';
import { BenchmarkCache, SessionService } from './sessionService';
import type { MotionEvent } from './types';
import { raceTimeout } from './util';

export interface AppDeps {
  repo: Repo;
  cortex: Cortex;
  config: AppConfig;
  log: Logger;
}

export interface AppHandle {
  app: Express;
  queue: EventQueue;
  /** Stop accepting background work and try to flush buffered events. */
  shutdown(flushTimeoutMs?: number): Promise<void>;
}

export function createApp({ repo, cortex, config, log }: AppDeps): AppHandle {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', false);
  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: '1mb' }));

  const queue = new EventQueue(repo, config.events, log);
  const benchmarks = new BenchmarkCache(repo, log);
  const sessions = new SessionService({
    repo,
    cortex,
    queue,
    benchmarks,
    log,
    coachTimeoutMs: config.coachTimeoutMs,
    flushWaitMs: config.sessionEndFlushWaitMs,
  });

  // Snowflake ping is cached briefly so health checks don't hammer the warehouse.
  let lastPing: { at: number; ok: boolean } | null = null;
  async function snowflakeStatus(): Promise<'up' | 'down' | 'mock'> {
    if (repo.mode === 'mock') return 'mock';
    if (!lastPing || Date.now() - lastPing.at > 5000) {
      lastPing = { at: Date.now(), ok: await repo.ping() };
    }
    return lastPing.ok ? 'up' : 'down';
  }

  app.get('/api/health', async (_req, res) => {
    const snowflake = await snowflakeStatus();
    res.json({ ok: true, mode: repo.mode, snowflake, queueDepth: queue.depth });
  });

  app.post('/api/players', async (req, res) => {
    const { name } = CreatePlayerBody.parse(req.body);
    const player_id = await db(repo.createPlayer(name));
    res.status(201).json({ player_id });
  });

  app.post('/api/session/start', async (req, res) => {
    const { player_id, sport } = StartSessionBody.parse(req.body);
    const player = await db(repo.getPlayer(player_id));
    if (!player) throw new HttpError(404, 'player_not_found', `Unknown player_id ${player_id}`);
    const session_id = await db(repo.createSession(player_id, sport));
    res.status(201).json({ session_id });
  });

  app.post('/api/events', async (req, res) => {
    const body: unknown = req.body;
    if (!Array.isArray(body)) {
      throw new HttpError(400, 'validation_error', 'Body must be a JSON array of events');
    }
    if (body.length > config.events.maxBatch) {
      throw new HttpError(413, 'batch_too_large', `At most ${config.events.maxBatch} events per request (got ${body.length})`);
    }
    const parsed = EventBatch.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, 'validation_error', 'One or more events are invalid', zodDetails(parsed.error));
    }
    if (parsed.data.length === 0) {
      res.status(202).json({ accepted: 0, queued: false });
      return;
    }
    const events: MotionEvent[] = parsed.data.map((e) => ({
      event_id: randomUUID(),
      session_id: e.session_id,
      player_id: e.player_id,
      sport: e.sport,
      event_ts: new Date(e.event_ts).toISOString(),
      event_type: e.event_type,
      hand: e.hand,
      speed_mps: e.speed_mps,
      accuracy: e.accuracy ?? null,
      reaction_ms: e.reaction_ms ?? null,
      guard_up: e.guard_up ?? null,
      points: e.points ?? 0,
      payload: e.payload ?? null,
    }));

    let written: Promise<unknown>;
    try {
      written = queue.enqueue(events);
    } catch (err) {
      if (err instanceof QueueFullError) {
        throw new HttpError(503, 'queue_full', 'Event buffer is full (database unavailable); retry later');
      }
      throw err;
    }
    // queued:false = already committed when we answered; queued:true = buffered, written in the background.
    const outcome = await raceTimeout(written, config.events.ackWaitMs, 'pending' as const);
    res.status(202).json({ accepted: events.length, queued: outcome !== 'written' });
  });

  app.post('/api/session/end', async (req, res) => {
    const { session_id } = EndSessionBody.parse(req.body);
    res.json(await sessions.end(session_id));
  });

  app.get('/api/leaderboard', async (_req, res) => {
    res.json(await db(repo.leaderboard(10)));
  });

  app.get('/api/player/:id/stats', async (req, res) => {
    const id = IdSchema.safeParse(req.params.id);
    if (!id.success) throw new HttpError(400, 'validation_error', 'Invalid player id', zodDetails(id.error));
    const player = await db(repo.getPlayer(id.data));
    if (!player) throw new HttpError(404, 'player_not_found', `Unknown player_id ${id.data}`);
    const [history, metrics, bms] = await Promise.all([
      db(repo.playerSessions(id.data, 50)),
      db(repo.playerMetrics(id.data)),
      benchmarks.get('boxing'),
    ]);
    res.json({
      player: { player_id: player.player_id, name: player.name },
      sessions: history,
      percentiles: computePercentiles(metrics, bms),
    });
  });

  app.use(createAskRouter({ repo, cortex, config, log }));

  app.use(notFoundHandler);
  app.use(errorHandler(log));

  return {
    app,
    queue,
    async shutdown(flushTimeoutMs = 5000) {
      const flushed = await queue.flush(flushTimeoutMs);
      if (!flushed) log.warn('shutdown: some events were still buffered and are lost', { depth: queue.depth });
      queue.stop();
    },
  };
}
