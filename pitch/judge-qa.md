# Judge Q&A cheat sheet

Short answers. Say the answer first, then one fact. Say "we did not build that, here is how we would" when true.

## Snowflake

**Why Snowflake and not a normal database?**
Because the value is the analysis, not the storage. The coach runs inside Snowflake: SQL sums up the round and Cortex writes the advice, next to the data, with no extra AI service or API key.

**What exactly is in Snowflake?**
`PLAYERS`, `SESSIONS` and `MOTION_EVENTS`. One event row per punch, block or dodge: type, peak speed, reaction time, accuracy, left/right balance, and a `VARIANT` column with detail like elbow angle. [IF BUILT] A Dynamic Table for form score, and a leaderboard view.

**How does data get from the browser to Snowflake?**
The browser batches events every 2 to 3 seconds and posts them to a small backend. The backend does a multi-row INSERT. Credentials stay on the server, never in the browser.

**Why not Snowpipe Streaming?**
For one booth, batched INSERTs are simpler and the data is queryable in under a second, which the coach needs at round end. Snowpipe Streaming is the upgrade path for many players at once.

**Which Cortex function and model?**
`AI_COMPLETE` (say the model you actually used). We send a short text summary of the round, not raw rows, and ask for JSON with 3 tips, 1 drill and a badge.

**How do you stop the AI making things up?**
It only gets numbers we computed in SQL, and the prompt asks it to quote them. Every tip points to a real stat, for example "guard 31% in the last 15 seconds".

**How many rows per round?**
About 40 to 120 events per 60 second round, plus summary ticks at 5 per second if we log them. We do not store video or raw 60 FPS body points.

**What is the Dynamic Table for?** [IF BUILT]
It keeps the form score up to date by itself (target lag 1 minute). It compares speed in the first quarter of the round with the last quarter (fatigue) and left vs right arms (balance).

**What does the Streamlit app add?** [IF BUILT]
A coach or PE teacher view across all players, running inside Snowflake, with an "Ask the Coach" box that calls Cortex.

**What did it cost?**
An X-Small warehouse with 5 minute auto-suspend. A few credits for the whole day (check the real number in Snowsight if asked).

**Privacy?**
No video leaves the laptop. Only movement numbers go to Snowflake, linked to a nickname.

**Did you use a Snowflake free dataset or Cortex Code CLI?**
Answer truthfully. If not: "No, the data is our own movement data. Cortex Code CLI would be our next step for the queries."

## Tech

**How accurate is punch detection?**
Give your real number if you tested it (for example "about 9 in 10 jabs on our team"). Hooks and uppercuts are harder than straight punches. Bad light makes it worse, which is why we have keyboard mode.

**Why MediaPipe and not your own model?**
7 hours. MediaPipe runs in the browser on any laptop at about 30 FPS. Our work is the punch rules, the calibration and the data.

**What about lag?**
Pose tracking is 30 to 70 ms. We use a 1 Euro filter and drop frames when the tracker is busy, so lag does not build up.

## Track and rules

**How is this "old tech, new tricks"?**
The old thing is 2000s motion boxing with a controller. The new tricks: no hardware, AI pose tracking in a browser, and a data-driven AI coach.

**Is this just a copy of an old game?**
No. All names, art and characters are ours: neon gloves and a cyber-drone opponent. We kept the idea, not the game.

**What did JetBrains Air do?**
Give 2 or 3 concrete tasks from submission.md. Be ready to open Air and show the history.

**What would you do with another week?**
Goalkeeper and archery modes, a "beat the ghost" mode from the top player's data, and coaching over weeks for PE or physio.
