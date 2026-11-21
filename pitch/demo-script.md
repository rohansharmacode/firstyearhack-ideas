# Demo script (2 minutes)

Roles: **Speaker** talks. **Driver** runs the laptop. **Boxer** (a judge if they agree, else a teammate) plays.

Setup before judges arrive: game open on the Kinetic dashboard, server running (`cd server && npm run dev`), Snowsight tab with the MOTION_EVENTS query, Streamlit tab, trailer video ready, warehouse warmed up (run any query in the last 5 minutes).

| Time | Speaker says | On screen |
| --- | --- | --- |
| 0:00 | "Remember swinging a controller to punch a cartoon boxer? In 2026 you do not need the controller. Your webcam is enough." | Kinetic dashboard |
| 0:08 | "Pick a sport with your hand. Hover on Boxing." | Boxer dwells on the Boxing tile, it launches |
| 0:15 | "Hold your guard up for two seconds. That measures your shoulders, so tall, short, seated or standing all score the same." | Calibration, "Locked in. Fight!" |
| 0:20 | "The browser reads 33 body points with MediaPipe. We turn them into jab, cross, hook, uppercut, block and slip. No video leaves the laptop." | Round starts vs HEX-7 |
| 0:25 to 0:55 | Light commentary only: "Watch the red ring, the drone is charging. Block! Now counter." | Boxing round |
| 0:55 | "Same engine, different sport." Driver goes Home, opens Goalkeeper. | Reflex Keeper, one or two saves |
| 1:10 | "[IF BUILT] Every punch you threw is now a row in Snowflake." | Snowsight: `SELECT ... FROM MOTION_EVENTS ORDER BY ts DESC` |
| 1:20 | "Snowflake Cortex reads those numbers and writes a Coach Card: three tips, a drill, a badge." | Coach Card ([IF BUILT] in game, else the one from a seeded session) |
| 1:35 | "A Dynamic Table keeps each player's form up to date: speed, fatigue from the first to the last quarter, left-right balance, compared against pro benchmarks." | Streamlit charts |
| 1:45 | "And a coach can ask questions in plain English. That runs on Cortex too, inside Snowflake." | Streamlit Ask the Coach |
| 1:52 | "Built today with JetBrains Air. Old motion gaming, no hardware, real coaching data. Thank you." | Back to the dashboard |

If the game is not posting live events by 17:30, swap the 1:10 line for: "Here is the data from our test sessions in Snowflake" and show the seeded rows (`scripts`, `npm run seed`).

## Fallback lines

**Webcam does not start or tracking is bad (lighting, people behind)**
- "The lab lighting is fighting us, so I will switch to keyboard mode. Same game." Driver presses `D`. Carry on.
- If the game itself breaks: play the 20 s trailer (`docs/art/trailer.md`), then go straight to Snowsight.

**Snowflake is slow (cold warehouse) or Cortex takes long**
- "Cortex is reading the round right now." The server shows a fallback Coach Card if Cortex is slow, so keep talking.
- After 10 seconds: open the Streamlit page instead.

**No internet**
- "The game runs fully in the browser. Snowflake is the part that needs the network." Show the Coach Card and Streamlit screenshots.

**Judge does not want to play**
- A teammate plays. Speaker: "I will let our worst boxer go first."

## Rules for the speaker
- Do not read the slides. The demo is the pitch.
- Say "Snowflake" at least 3 times and point at real rows every time.
- Stop talking during the round for at least 15 seconds. The game is the show.
