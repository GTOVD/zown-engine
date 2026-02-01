# Memory Architecture

## Philosophy
To emulate human cognition, memory is divided into three tiers:
1.  **Short-Term (Working Memory):** The active context window. Immediate, fleeting.
2.  **Episodic (Daily Logs):** The "what happened today" files (`memory/YYYY-MM-DD.md`).
3.  **Semantic (Long-Term):** The distilled "truth" (`MEMORY.md`, `memory/concepts/`).

## Directory Structure
- `memory/YYYY-MM-DD.md`: **Episodic**. Raw stream of events, tasks, and conversations.
- `MEMORY.md`: **Core Identity**. High-level directives, user bio, critical history.
- `memory/reflections/`: **Subconscious**. Output of hourly self-reflection loops.
- `memory/concepts/`: **Knowledge Graph**. Deep dives on specific topics (e.g., `concepts/project-zown.md`).
- `memory/archive/`: **Storage**. Old daily logs moved here to reduce clutter.

## Protocols
- **Consolidation:** Periodically read `reflections/*` and `YYYY-MM-DD.md`. Extract "diamonds" (insights) and write them to `MEMORY.md` or `concepts/`.
- **Forgetting:** Move processed daily logs to `archive/` to keep the active workspace clean, mimicking the fading of trivial daily details while keeping the "lesson."
