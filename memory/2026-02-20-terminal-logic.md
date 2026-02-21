# Interactive Lore Terminal Architecture

## Technical Specs
- **Path**: `src/app/lore/page.tsx`
- **Component**: `TerminalInterface.tsx`
- **Palette**: Dark Cyan/Teal (`#397789`) on Black (`#020617`).
- **Aesthetic**: Retro CRT/Phosphor with scanlines.
- **Commands**: HELP, LIST, READ, SEARCH, SYSTEM, CLEAR, CREDITS.

## Logic Summary
The terminal acts as a high-fidelity bridge between the modern luxury boutique and the deep lore of the Sunny Archive. It uses a custom `Typewriter` effect to simulate retro data stream delivery. Command processing is handled via `processCommand` which retrieves fragments from the `LORE_DATABASE`.

## Revision History
- **2026-02-20**: Initial implementation of the Fallout-style CLI. Established the dark green phosphor theme and integrated real-time command parsing.
