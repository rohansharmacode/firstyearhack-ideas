# Kinetic Ring

**Track:** Retro Remix: Old Tech, New Tricks. **Sponsor prize:** Best Use of Snowflake.

**One line:** 2000s motion sports rebuilt for 2026: no controller, just your webcam. Box a sparring drone or save penalties, and Snowflake turns every move into coaching with Cortex.

## Problem
Motion sports games got millions of people moving, but they needed special hardware, and they only told you your score. They never told you *how* you moved or how to get better. Today almost every laptop has a webcam, and the movement data a game could collect just goes to waste.

## Old to new
| Then (2000s) | Now (Kinetic Ring, 2026) |
| --- | --- |
| Plastic controller with an accelerometer | Your webcam and 33 tracked body points |
| A console under the TV | Any browser, nothing to install |
| One sport per disc | One dashboard, many sports, picked with your hand |
| A score at the end | Every move stored, analysed and coached in Snowflake |

## What we built
- **Kinetic dashboard.** Sport tiles you pick by hovering your hand. No mouse needed.
- **Boxing vs HEX-7.** First-person boxing against an original cyber-drone. Jab, cross, hook, uppercut, guard block and slip. The drone telegraphs its attacks, counters score extra, 60 second round with HP and a K.O.
- **Reflex Keeper.** Penalty saves. The striker telegraphs the kick, ball physics are simulated, your hands and body make the save, and a save plays in slow motion.
- **Original art pack.** Drone concept sheet, animated tiles, splashes, calibration silhouette, K.O. and win/lose cards.
- **Keyboard and mouse fallback** for bad lighting.
- [IF BUILT] **Archery.** Draw, hold, release.

## How it works
1. **Pose tracking in the browser.** MediaPipe Pose Landmarker (Lite) runs on the laptop. A 2 second "guard up" step measures shoulder width, so all speeds are in shoulder-widths per second and every body size scores the same. A 1 Euro filter smooths the points without adding lag.
2. **Motion engine.** Elbow angle, wrist speed and shoulder twist become boxing moves. The keeper maps your hands and torso onto glove and body colliders.
3. **Game.** Three.js arena with hitstop, sparks, camera shake and slow-mo. Every move fires a `motion-event`.
4. **Data.** An Express server takes batched events from the browser and writes them to Snowflake. No Snowflake credentials in the browser. [IF BUILT] The game posts events live.
5. **Coaching.** At round end the server pulls the player's stats from Snowflake and Cortex writes a Coach Card.

## How we used Snowflake
Snowflake is not a side database here: it is the coach.
- **Tables:** `PLAYERS`, `SESSIONS`, `MOTION_EVENTS` (one row per punch, block or slip: type, hand, speed, accuracy, guard, plus a `VARIANT` payload) and `PRO_BENCHMARKS`.
- **Dynamic Table `PLAYER_FORM`** (1 minute target lag): per-player speed, fatigue (first quarter vs last quarter of a session), left/right symmetry and guard percentage, with a percentile against `PRO_BENCHMARKS` that becomes a 0 to 100 form score.
- **Views:** `V_LEADERBOARD`, `V_GLOBAL_STATS`, `V_SESSION_STATS`, `V_SPEED_OVER_TIME`, `V_FATIGUE_CURVE`.
- **Cortex `COMPLETE` coach card:** the round's stats and percentiles go in, JSON comes out: a headline, 3 tips, a drill and a badge. If Cortex is slow, a fallback card keeps the game moving.
- **Ask the Coach:** a plain-English question becomes SQL through Cortex, runs under a read-only role behind a SQL guard, and Cortex explains the result.
- **Streamlit in Snowflake:** a coach dashboard with the live leaderboard, speed and fatigue charts, and Ask the Coach. The data never leaves Snowflake.
- **Cheap to run:** X-Small warehouse, 300 second auto-suspend.
- The backend has 97 automated tests and a mock mode, so it runs without credentials. [IF BUILT] Running on our live Snowflake account.

## How we used JetBrains Air
We built the project in WebStorm with JetBrains Air (Rule 01). Screenshots: <add 3, see `docs/AIR_USAGE.md`>
- **One Air session per person**, scoped to the folders that person owned, so agents never edited each other's code. The shared GitHub repo was the meeting point.
- **Orchestrator and subagents.** The main Air agent read the contracts, fixed shared types first, then split work into parallel subagents with strict file ownership.
- **Effort matched to risk:** high for motion detection and UI feel, medium for the API client, docs and scripts.
- **Contracts first:** Air wrote the front-end to backend contract and the Snowflake schema contract before the code, so three people built in parallel and met in the middle.
- **Verification:** Air ran the build, the motion tests, the server tests and an end-to-end mock run before each push.

## Challenges
- **Depth from one camera.** A webcam sees depth badly, so a jab cannot use forward motion alone. We combine elbow speed, elbow angle and forward distance.
- **People walking behind the player.** We track one person and ignore low-confidence points.
- **Lag.** Pose tracking takes 30 to 70 ms per frame. We drop frames when busy instead of queuing them.
- **Switching sports.** Going back and forth between sports leaked WebGL contexts until each sport cleaned up its renderer on exit.
- **Many agents, one repo.** Several Air sessions worked at once. Contracts and folder ownership kept merges clean.

## What's next
- [IF BUILT] Archery on the same pose engine.
- "Beat the Ghost": box the top player's pace, replayed from Snowflake.
- A cross-sport athlete profile: power (boxing), reflex (goalkeeper), steadiness (archery).
- Real benchmark data from Snowflake Marketplace in place of our seeded `PRO_BENCHMARKS`.
- PE and physio use: track form and fatigue over weeks, not one round.

## Built with
TypeScript, Vite, Three.js, MediaPipe Tasks Vision, Node, Express, Snowflake (tables, views, Dynamic Tables, Cortex `COMPLETE`, Streamlit in Snowflake), Python, JetBrains WebStorm with JetBrains Air.
