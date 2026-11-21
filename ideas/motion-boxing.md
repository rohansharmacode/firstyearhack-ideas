# Motion boxing

**Status:** Front-runner

## Old thing
Motion-controlled boxing games from the 2000s, where you swing a controller to punch.

## 2026 twist
No controller. A browser game uses the webcam and MediaPipe pose tracking to read real punches (jab, hook, uppercut, block). Original avatars and art only: no Nintendo, Wii or Mii IP.

## Snowflake use
- Each punch is an event (type, speed, accuracy, timestamp) sent to a Snowflake table.
- Leaderboard from Snowflake queries.
- AI commentator: Cortex generates live round commentary from the punch stats.
- AI coach: Cortex reads a player's history and gives tips ("your left hook drops your guard").

## JetBrains Air use
<To decide: for example, use Air to generate and refactor the pose-to-punch detection code and the Snowflake ingest code.>

## Demo plan
1. Judge stands in front of the laptop and boxes one short round.
2. Live commentary plays during the round.
3. Leaderboard updates with the judge's score.
4. Coach screen shows tips from Snowflake data.

## Risks
- Pose tracking lag or bad lighting. Fallback: pre-recorded round.
- Snowflake latency for live commentary. Fallback: batch commentary at round end.
