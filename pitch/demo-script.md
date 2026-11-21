# Demo script (2 minutes)

Roles: **Speaker** talks. **Driver** runs the laptop. **Boxer** (a judge if they agree, else a teammate) plays.

Setup before judges arrive: game open on the calibration screen, Snowsight tab with the leaderboard query, Streamlit tab, backup video ready, warehouse warmed up (run any query in the last 5 minutes).

| Time | Speaker says | On screen |
| --- | --- | --- |
| 0:00 | "Remember swinging a controller to punch a cartoon boxer? In 2026 you do not need the controller. Your webcam is enough." | Title screen |
| 0:10 | "Want to throw a few punches? Stand here, hold your guard up for two seconds." | Calibration gate, Boxer holds stance |
| 0:20 | "The browser reads 33 body points with MediaPipe. We turn wrist speed and elbow angle into jabs, hooks, uppercuts, blocks and slips. Nothing leaves the laptop except the stats." | Round starts |
| 0:25 to 1:05 | Let them box. Light commentary only: "Watch the red ring, that is the drone charging. Block!" / "That hook was 3.1 shoulder-widths per second." | 40 second round |
| 1:05 | "Every punch you threw is now a row in Snowflake." | Driver switches to Snowsight, runs `SELECT ... FROM MOTION_EVENTS WHERE session_id = ...` |
| 1:15 | "Snowflake Cortex reads those rows and writes your Coach Card." | Coach Card in game: 3 tips, 1 drill, a badge |
| 1:30 | "Your score is live on the leaderboard. [IF BUILT] A Dynamic Table keeps a 0 to 100 form score that tracks fatigue across the round." | Leaderboard, then form score |
| 1:45 | "[IF BUILT] And the coach can see everyone: this Streamlit app runs inside Snowflake." | Streamlit page |
| 1:50 | "Built in 7 hours with JetBrains Air. Old motion gaming, no hardware, real coaching data. Thank you." | Back to the game |

## Fallback lines

**Webcam does not start or tracking is bad (lighting, people behind)**
- "The lab lighting is fighting us, so I will switch to keyboard mode. Same game, same data path." Driver presses `D`, uses Space and mouse. Carry on from 1:05.
- If the game itself breaks: "Here is a round we recorded at 15:00." Play the backup video, then go straight to the Snowsight step. The data from that round is already in Snowflake.

**Snowflake is slow (cold warehouse) or Cortex takes long**
- "Cortex is reading 40 punches right now." Keep talking: explain the punch rule (elbow speed over 280 degrees per second, arm over 140 degrees).
- After 10 seconds: open a Coach Card from an earlier session. "This is the one from my round earlier, same pipeline."

**No internet**
- "The game runs fully offline. Snowflake is the part that needs the network." Show screenshots of the query and Coach Card from the deck.

**Judge does not want to play**
- A teammate plays. Speaker: "I will let our worst boxer go first."

## Rules for the speaker
- Do not read the slides. The demo is the pitch.
- Say "Snowflake" at least 3 times and point at real rows every time.
- Stop talking during the round for at least 15 seconds. The game is the show.
