# Kinetic Ring

**Track:** Retro Remix: Old Tech, New Tricks. **Sponsor prize:** Best Use of Snowflake.

**One line:** A 2000s motion boxing game rebuilt for 2026: no controller, just your webcam, with every punch logged to Snowflake and an AI coach built on Snowflake Cortex.

## Problem
Motion sports games got millions of people moving, but they needed special hardware, and they only told you your score. They never told you *how* you moved or how to get better. Today, almost every laptop has a webcam, and the data a game could collect about your movement just goes to waste.

## Old to new
| Then (2000s) | Now (Kinetic Ring, 2026) |
| --- | --- |
| Plastic controller with an accelerometer | Your webcam and 33 tracked body points |
| A console under the TV | Any browser, nothing to install |
| A score at the end | Every punch stored, analysed and coached |
| Local high-score table | Live leaderboard for the whole room |

## How it works
1. **Pose tracking in the browser.** MediaPipe Pose Landmarker (Lite) runs on the laptop. A 2 second "hold your guard" step measures shoulder width so seated and standing players score the same. A 1 Euro filter smooths the points without adding lag.
2. **Punch detection.** We turn elbow angle, wrist speed and shoulder twist into jab, cross, hook, uppercut, block and slip. Speeds are in shoulder-widths per second.
3. **Game.** Three.js renders neon gloves and an original cyber-drone opponent that telegraphs attacks. Block, slip and counter. 60 second round. All art is original.
4. **Data.** The browser sends batches of events every few seconds to a small backend, which writes them to Snowflake. No Snowflake credentials in the browser.
5. **Coaching.** At round end, SQL sums up the round and Snowflake Cortex writes a Coach Card.

## How we used Snowflake
Snowflake is not a side database here: it is the brain of the game.
- **`MOTION_EVENTS` table:** one row per punch, block or dodge, with speed, reaction time, accuracy, left/right balance and a `VARIANT` column for sport-specific detail.
- **Cortex AI coach:** `AI_COMPLETE` gets the round summary (for example "right cross 26% faster than left jab, guard dropped from 72% to 31% in the last 15 seconds") and returns JSON: 3 tips, 1 drill, a play-style badge.
- **Leaderboard:** a SQL view over sessions, queried live by the game.
- [IF BUILT] **Dynamic Table form score:** keeps a 0 to 100 form score and a fatigue measure (speed in the first quarter vs the last quarter, with `NTILE(4)`) up to date with a 1 minute target lag.
- [IF BUILT] **Streamlit in Snowflake:** a coach dashboard with speed-over-time curves and an "Ask the Coach" box that sends a question to Cortex.
- [IF USED] **Cortex Code CLI:** we used it to scaffold the DDL and queries.

## How we used JetBrains Air
We built the whole project in WebStorm with JetBrains Air.
- <fill in: e.g. Air generated the first version of the punch detector from our rules, then we tuned the numbers by hand>
- <fill in: e.g. Air wrote the Snowflake ingest endpoint and the batch INSERT>
- <fill in: e.g. Air found and fixed a memory leak from ImageBitmap frames>
- <fill in: e.g. Air wrote the Cortex prompt and the Coach Card JSON parser>
Keep this honest and specific: one line per real task.

## Challenges
- **Depth from one camera.** A webcam sees depth badly, so a jab cannot use forward motion alone. We combined elbow speed, elbow angle and forward distance.
- **People walking behind the player.** We track one person and ignore points with low confidence.
- **Lag.** Pose tracking takes 30 to 70 ms per frame. We drop frames when busy instead of queuing them.
- **Snowflake cold start.** The first query can take seconds, so we keep the warehouse warm and show a "Coach is analysing" animation.
- <add the real one that cost you the most time>

## What's next
- Goalkeeper mode (penalty saves) and Archery mode on the same pose engine.
- "Beat the Ghost": replay the top player's pace from Snowflake as your opponent.
- A cross-sport athlete profile: power (boxing), reflex (goalkeeper), steadiness (archery).
- Physio and PE use: track form and fatigue over weeks, not one round.

## Built with
TypeScript, Vite, Three.js, MediaPipe Tasks Vision, Node, Snowflake (tables, views, Cortex AI, [IF BUILT] Dynamic Tables, Streamlit in Snowflake), JetBrains WebStorm with JetBrains Air.
