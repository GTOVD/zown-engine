# Engineering Ideation Log - 2026-02-04

## Target: `zown-governor/src/index.js`

### Critique
I reviewed the `Governor` class, specifically the `incrementUsage` and `getDynamicStatus` methods.

**Identified Issue:**
The `incrementUsage` method blindly increments the counters (`today`, `thisHour`, `thisMinute`) without checking if the time window has shifted. 
- `getDynamicStatus` contains the logic to reset these counters based on `lastReset` timestamp.
- However, `incrementUsage` reads state, adds to the *existing* numbers, and then updates `lastReset`.
- **Scenario:** 
  1. `thisHour` is 10 at 1:59 PM.
  2. No activity until 3:00 PM.
  3. `incrementUsage(1)` is called.
  4. It loads `thisHour` (10), adds 1 -> 11.
  5. It saves `thisHour` as 11 and `lastReset` as 3:00 PM.
  6. **Result:** The 10 requests from 1:00 PM are effectively carried over to 3:00 PM, artificially inflating the usage and potentially triggering false rate limits.

**Architecture Note:**
The reset logic should be extracted into a private method (e.g., `_applyTimeResets(state)`) and called by both `getDynamicStatus` and `incrementUsage` to ensure consistency.

### Ideation
**Task:** Refactor `zown-governor` to centralize time-based counter resetting logic.
**Goal:** Ensure usage metrics are accurate regardless of the interval between calls.

### Ticket
**ID:** task-1770192040329
**Title:** Fix incrementUsage logic to respect time resets
**Priority:** Critical
