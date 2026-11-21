# Pitch pack: Kinetic Ring

Updated 21 Nov to match what is in `rohansharmacode/motion-boxing`. Working name "Kinetic Ring" (swap in the final team name, see [team-names.md](team-names.md)).

| File | Use |
| --- | --- |
| [pitch-deck.pptx](pitch-deck.pptx) | 8 slides on the `public/art/judges-slide-bg.svg` background, speaker notes included |
| [demo-script.md](demo-script.md) | 2-minute live demo with fallback lines |
| [submission.md](submission.md) | Paste into the submission form |
| [judge-qa.md](judge-qa.md) | Judge questions, Snowflake first |
| [team-names.md](team-names.md) | Team names and logo ideas |
| [art/submission-thumbnail.png](art/submission-thumbnail.png) | 1200x630 thumbnail for the submission form (from `og-social.svg`) |
| [art/deck-preview.png](art/deck-preview.png) | All 8 slides at a glance |

## Built vs in progress (as of 13:00)
- **Built:** Kinetic dashboard (`src/shell`), Boxing vs HEX-7 (`src/sports/boxing`), Reflex Keeper goalkeeper (`src/sports/goalkeeper`), art pack (`public/art`), Express + Snowflake backend with Cortex coach card (`server/`, `sql/`), Streamlit in Snowflake with Ask the Coach (`streamlit/`). Backend tests pass in mock mode.
- **`[IF BUILT]`:** Archery, the game posting events to the server live, and a run against the real Snowflake account (needs `server/.env` credentials).

## Before 17:30
1. Pick a name. Find and replace "Kinetic Ring" in all files and the deck.
2. For each `[IF BUILT]` line: shipped means delete the marker, not shipped means delete the line. Do not claim what you cannot show.
3. Put 3 real JetBrains Air screenshots on deck slide 6 (list in `docs/AIR_USAGE.md`). Rule 01.
4. Record the 20 s trailer from `docs/art/trailer.md`. It is the demo fallback video.
5. Screenshot: dashboard, boxing mid-punch, a keeper save, Coach Card, Streamlit page, one Snowsight query. Add them to the submission.
