# Frontend ↔ backend contract (for Person B)

Types live in `src/api/types.ts`. Field names match the Snowflake tables in `motion-sports-research.md`, so you can insert rows as-is.

The frontend reads `VITE_API_URL` (for example `http://localhost:8787`). If it is empty, or `VITE_USE_MOCK=true`, the frontend uses mock data and never calls the network. If a live call fails, the frontend falls back to mock data and shows an "offline" chip, so the demo never breaks.

CORS: allow the Vite dev origin (`http://localhost:5173`) and `Content-Type: application/json`.

## POST /api/events

Sent every 2 seconds while a round runs, plus once at round end. Also sent with `navigator.sendBeacon` if the tab closes (body is the same JSON, content type `text/plain`; parse it anyway).

```json
{
  "events": [
    {
      "event_id": "uuid",
      "session_id": "uuid",
      "player_id": "uuid",
      "sport": "BOXING",
      "event_ts": "2026-11-21T14:03:12.481Z",
      "round_ms": 12480,
      "event_type": "PUNCH",
      "peak_velocity": 3.1,
      "reaction_ms": null,
      "accuracy_score": 82,
      "symmetry_ratio": null,
      "metrics": { "punchType": "HOOK", "hand": "L", "landed": true }
    }
  ]
}
```

Reply `200` or `204`. Any non-2xx: the client keeps the events and retries on the next tick. `event_id` is unique, so de-duplicate on it.

## POST /api/session/end

Sent once when the round ends, after the last events batch.

```json
{
  "session_id": "uuid",
  "player_id": "uuid",
  "display_name": "Naman",
  "sport": "BOXING",
  "started_at": "2026-11-21T14:02:00.000Z",
  "ended_at": "2026-11-21T14:02:40.000Z",
  "final_score": 1840,
  "result": "KO_WIN",
  "avg_inference_fps": 28.4,
  "stats": { "punches": 42, "landed": 30, "byType": { "JAB": 20, "HOOK": 12 }, "avgSpeed": 2.6, "maxSpeed": 4.1, "blocks": 6, "dodges": 3, "avgReactionMs": 410, "leftRightRatio": 0.8, "bestCombo": 7 }
}
```

`stats` is just the client's own count. Snowflake's numbers from `MOTION_EVENTS` are the real ones.

Expected reply (upsert `PLAYERS` + `SESSIONS`, run the Cortex coach, query the leaderboard):

```json
{
  "coach": {
    "headline": "Fast hands, lazy guard in the last 15 seconds.",
    "tips": ["...", "...", "..."],
    "drill": { "name": "Guard-Return Jabs", "description": "..." },
    "badge": { "name": "Neon Hammer", "description": "..." }
  },
  "leaderboard": [
    { "rank": 1, "player_id": "uuid", "display_name": "Naman", "sport": "BOXING", "score": 1840, "max_speed": 4.1 }
  ],
  "form_score": 78
}
```

Top 10 for the same sport is enough. The UI highlights the row whose `player_id` matches. Cortex can take a few seconds, and the UI shows a loading state while it waits (timeout 20 s, then mock).
