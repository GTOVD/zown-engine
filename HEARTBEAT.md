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

## Memory Sync (End of Session / Daily)
1. `node devlog/engine/build.js` (Update static site)
2. `git add .`
3. `git commit -m "chore: Auto-save memory state"` (if changes exist)
4. `git push origin master`
