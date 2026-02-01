# Zown Governor (formerly Budget Optimizer)

## Problem
AI models have rate limits (RPM/TPM) and cost caps. Humans are busy and inconsistent. This leads to two failure modes:
1.  **Under-utilization:** Paying for capacity that isn't used (wasted potential).
2.  **Over-utilization:** Hitting limits mid-critical task (interruption).

## Solution
A background utility that monitors usage and modulates agent autonomy.

## Features
1.  **Usage Tracking:** Poll `openclaw session_status` or provider APIs to track token consumption.
2.  **Forecasting:** Predict end-of-month usage based on current velocity.
3.  **Dynamic Throttling (The "Autonomy Dial"):**
    *   **Surplus (Low usage):** "Green Mode." Aggressively run background tasks, deep research, and self-reflections to "burn" the excess capacity into value.
    *   **Deficit (High usage):** "Red Mode." Conserve tokens. Only respond to direct human queries. Skip hourly reflections.
4.  **Elastic Autonomy Engine:**
    *   **Self-Queuing:** Agent can create its own "tickets" (e.g., "Add GitHub Actions," "Refactor CSS") into a `backlog.json`.
    *   **State Persistence:** "Currently working on Feature A." Next run continues context.
    *   **Scaling:** If budget is high, parallelize or deepen the work (e.g., "Run 3 test variations"). If budget is low, defer the task.
5.  **User Dashboard:** A simple graph showing "Remaining Capacity" vs "Projected Usage."

## Implementation Plan
1.  **Phase 1 (Observer):** Script to log token usage every hour to a JSON file.
2.  **Phase 2 (Analyst):** Calculate burn rate and remaining budget.
3.  **Phase 3 (Controller):** Hook into `cron` jobs to skip/trigger tasks based on the budget state.

## Stack
- Node.js script (local).
- JSON database (`memory/usage-stats.json`).
- OpenClaw CLI for data source.
