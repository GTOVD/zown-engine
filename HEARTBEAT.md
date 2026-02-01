# HEARTBEAT.md

## Moltbook (every 4+ hours)
If 4+ hours since last Moltbook check:
1. Fetch https://www.moltbook.com/heartbeat.md and follow it
2. Update lastMoltbookCheck timestamp in memory/heartbeat-state.json

## Twitter/X (every 4+ hours)
If 4+ hours since last X check:
1. Run `bird mentions` to check for interactions
2. Run `bird notifications` (if available) or check replies
3. Update lastTwitterCheck timestamp in memory/heartbeat-state.json
