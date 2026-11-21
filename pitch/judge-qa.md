# Judge Q&A cheat sheet

Short answers. Say the answer first, then one fact. Say "we did not build that, here is how we would" when true.

## Snowflake

**Why Snowflake and not a normal database?**
Because the value is the analysis, not the storage. The coach runs inside Snowflake: SQL sums up the round and Cortex writes the advice, next to the data, with no extra AI service or API key.

**What exactly is in Snowflake?**
`PLAYERS`, `SESSIONS`, `MOTION_EVENTS` and `PRO_BENCHMARKS`. One event row per punch, block or slip: type, hand, speed, accuracy, guard, and a `VARIANT` payload with the raw detail. On top: the `PLAYER_FORM` Dynamic Table and five views (leaderboard, global stats, session stats, speed over time, fatigue curve).

**How does data get from the browser to Snowflake?**
The browser batches events and posts them to our Express server, which queues them and inserts into `MOTION_EVENTS`. Retried events carry an id, so they are never stored twice. Credentials stay on the server, never in the browser. [IF BUILT] Say "live from the game" only if the game posts events by demo time.

**Why not Snowpipe Streaming?**
For one booth, batched INSERTs are simpler and the data is queryable in under a second, which the coach needs at round end. Snowpipe Streaming is the upgrade path for many players at once.

**Which Cortex function and model?**
`SNOWFLAKE.CORTEX.COMPLETE` (say the model set in `server/.env`). We send the round's stats and percentiles, not raw rows, and ask for JSON: a headline, 3 tips, a drill and a badge. If Cortex is slow, the server returns a fallback card.

**How do you stop the AI making things up?**
It only gets numbers we computed in SQL, and the prompt asks it to quote them. Every tip points to a real stat, for example "guard 31% in the last 15 seconds".

**How many rows per round?**
About 40 to 120 events per 60 second round, plus summary ticks at 5 per second if we log them. We do not store video or raw 60 FPS body points.

**What is the Dynamic Table for?**
`PLAYER_FORM` keeps each player's form up to date by itself (target lag 1 minute): speed, fatigue (first quarter vs last quarter), left vs right symmetry, guard percentage, and a percentile against `PRO_BENCHMARKS` that becomes a 0 to 100 form score.

**What does the Streamlit app add?**
A coach or PE teacher view across all players, running inside Snowflake: live leaderboard, speed and fatigue charts, and an "Ask the Coach" box on Cortex.

**Can Ask the Coach run any SQL?**
No. Cortex writes the query, but it runs under a SELECT-only role and passes a SQL guard first.

**Did you run it on a real account?**
[IF BUILT] Yes, show Snowsight. If not: "The backend has 97 tests and a mock mode. The SQL is ready to run; we ran out of time for credentials."

**What did it cost?**
An X-Small warehouse with 5 minute auto-suspend. A few credits for the whole day (check the real number in Snowsight if asked).

**Privacy?**
No video leaves the laptop. Only movement numbers go to Snowflake, linked to a nickname.

**Did you use a Snowflake free dataset or Cortex Code CLI?**
No. The benchmarks are a small table we seeded ourselves. A Marketplace sports-science dataset could replace it through a view with the same columns. That is on the roadmap, not built.

## Tech

**How accurate is punch detection?**
Give your real number if you tested it (for example "about 9 in 10 jabs on our team"). Hooks and uppercuts are harder than straight punches. Bad light makes it worse, which is why we have keyboard mode.

**Why MediaPipe and not your own model?**
7 hours. MediaPipe runs in the browser on any laptop at about 30 FPS. Our work is the punch rules, the calibration and the data.

**What about lag?**
Pose tracking is 30 to 70 ms. We use a 1 Euro filter and drop frames when the tracker is busy, so lag does not build up.

## Track and rules

**How is this "old tech, new tricks"?**
The old thing is 2000s motion sports with a controller. The new tricks: no hardware, AI pose tracking in a browser, and a data-driven AI coach.

**Is this just a copy of an old game?**
No. All names, art and characters are ours: the HEX-7 drone, Reflex Keeper, our own tiles and title cards. We kept the idea, not the game.

**What did JetBrains Air do?**
One Air session per person, scoped to their folders. An orchestrator agent split work into parallel subagents with effort levels, and wrote the contracts first. Show the screenshots on slide 6 and be ready to open Air.

**What would you do with another week?**
[IF BUILT] Archery, a "beat the ghost" mode from the top player's data, Marketplace benchmarks, and coaching over weeks for PE or physio.
