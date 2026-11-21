# Kinetic Ring

A 2000s motion-boxing game rebuilt for 2026: no controller, just your webcam.
Every punch is logged to Snowflake, and Snowflake Cortex writes you a personal coach card after each round.

![Kinetic Ring gameplay screenshot](docs/screenshot.png)
<!-- TODO: add docs/screenshot.png (HUD mid-round) before submission -->

## Quick start

```bash
npm install
npm run dev            # client only, mock data (no backend needed)
# open http://localhost:5173
```

Full stack (client + API server):

```bash
npm install && npm --prefix server install
cp .env.example .env                  # set VITE_API_URL=http://localhost:3001
cp server/.env.example server/.env    # SNOWFLAKE_MOCK=1 runs without Snowflake
npm run dev:all
```

Snowflake setup (schema, dynamic table, Streamlit): see [README-snowflake.md](README-snowflake.md).

## Controls

| Input | Action |
| --- | --- |
| Webcam | Stand ~1.5 m back, raise your guard for 2 s to calibrate, then box: jab, cross, hook, uppercut, guard, slip, duck |
| `D` | Keyboard fallback: `J` jab · `K` cross · `H` hook · `U` uppercut · `Space` block · `←` `→` slip |
| `M` | Demo mode (scripted round with mock data, for judging if the venue lighting fails) |
| `R` / `Esc` | Post-match: rematch / home |

UI components demo (every screen with mock data): http://localhost:5173/src/ui/demo.html

## Team

| Who | Owns |
| --- | --- |
| Naman | Browser client: UI, API client, motion classification, pose pipeline |
| Sankar | Express API server, Snowflake schema and analytics, Cortex coach, Streamlit dashboard |
| Rohan | Repo, ideas, pitch and demo script |

## Tech stack

- **Client:** TypeScript, Vite, MediaPipe Pose Landmarker (Lite, in a Web Worker), 1€ filter, framework-free DOM UI
- **Server:** Node, Express 5, zod, `snowflake-sdk` (in-memory mock mode for offline demos)
- **Data and AI:** Snowflake tables + Dynamic Table, Snowflake Cortex `COMPLETE` (coach card, "Ask the Coach"), Streamlit in Snowflake
- **Built with:** JetBrains Air (see [docs/AIR_USAGE.md](docs/AIR_USAGE.md)) in WebStorm

More: [architecture](docs/ARCHITECTURE.md) · [research](motion-sports-research.md) · [original idea list](ideas/)
