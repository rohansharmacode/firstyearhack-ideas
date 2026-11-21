# How we used JetBrains Air (Rule 01)

Every line of Kinetic Ring was built inside WebStorm with the JetBrains Air plugin.

## How we worked

- **One Air session per person.** Each of us ran our own Air session scoped to the folders we owned (see [ARCHITECTURE.md](ARCHITECTURE.md)), so agents never edited each other's code. The shared GitHub repo was our communication channel: Air pulled before reading and pushed when a piece was done.
- **Orchestrator + subagents.** In each session, the main Air agent acted as the orchestrator. It read the research doc and the contracts (`src/api/CONTRACT.md`, `sql/CONTRACT.md`), fixed the shared types first, then split the work into parallel subagents with strict file ownership (for example: one subagent for UI components, one for the API client). The orchestrator then ran the build, checked the pieces fit together, and committed.
- **Effort levels.** We matched effort to risk: **high** for UI/UX work and motion-classification logic, **medium** for boilerplate (API client, docs, scripts, config). This kept the fast, low-risk work quick and spent reasoning where bugs would hurt the demo.
- **Contracts first.** Air wrote the frontend↔backend contract and the Snowflake schema contract before the code, so three people could build in parallel and meet in the middle.
- **Verification.** Air ran `npm run build`, the motion test suite (synthetic frames, per-class accuracy), the server tests and an end-to-end mock run before each push.

## Screenshots (TODO before submission)

| # | What to capture | Who | Screenshot |
| --- | --- | --- | --- |
| 1 | Orchestrator prompt splitting UI + API work into subagents | Naman | TODO |
| 2 | Subagents running in parallel with effort levels shown | Naman | TODO |
| 3 | Air writing the motion classifier + test suite | Naman | TODO |
| 4 | Air building the Express + Snowflake server | Sankar | TODO |
| 5 | Air generating the Snowflake SQL / dynamic table | Sankar | TODO |
| 6 | Air building the Streamlit "Ask the Coach" page | Sankar | TODO |
| 7 | Air pushing to the shared repo (git log) | Rohan | TODO |
