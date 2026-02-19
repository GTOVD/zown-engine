# Fallout-Style Terminal Game Implementation Strategy

## Objective
Implement an engaging, Fallout-inspired terminal hacking mini-game for the `sunny-archive` lore terminal. The game will gate access to commands and lore based on difficulty settings (Easy, Medium, Hard).

## Task Breakdown

### 1. FEAT: Core Hacking Engine Scaffolding (Ticket #1)
- Design the `HackingEngine` logic:
  - Generate a word pool based on difficulty (length/count).
  - Select a "Password" and "Dud" words.
  - Implement "Likeness" logic (matching characters in correct positions).
  - Add "Dud Removal" and "Allowance Replenishment" via bracket pairs (e.g., `[]`, `{}`, `<>`).
- Define `HackingState` types in `src/lib/lore/types.ts`.

### 2. FEAT: Fallout-Style Terminal UI (Ticket #2)
- Update `TerminalOutput.tsx` and `TerminalInterface.tsx` to handle "Hacking Mode".
- Implement the "Hex Matrix" visual layout.
- Add typewriter-style character reveal and "Phosphor" flicker effects for high-fidelity immersion.
- Sound effect hooks (mechanical clicks, buzzes).

### 3. FEAT: Difficulty-Based Command Gating (Ticket #3)
- **Easy**: Unlocks `LIST`, `WHOAMI`.
- **Medium**: Unlocks `READ`, `DECRYPT`.
- **Hard**: Unlocks `RESONATE` (once lore is shipped), `SYSTEM_LOGS`, and `PROMO_CODES`.
- Persist "Unlocked" state in session storage or state management.

### 4. FEAT: Lore & Reward Integration (Ticket #4)
- Map specific lore fragments, promo codes, and "About Me" logs to the unlock tiers.
- Implement the "Success" and "Lockout" transitions.

## Difficulty Specs
- **Easy**: 4-5 letter words, 12 words, 4 attempts.
- **Medium**: 6-8 letter words, 15 words, 4 attempts.
- **Hard**: 10-12 letter words, 20 words, 4 attempts.

**Signature**: Symbiote Protocol // Fallout Terminal v1.0.0-DEV
