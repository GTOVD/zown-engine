# Engineering Ideation Log: 2026-02-05

## 1. Scan: `zown-governor`
I focused my attention on the core logic of the `zown-governor` package, specifically `src/index.js` and the nascent `src/skills/acquisition.js`.

## 2. Critique: Senior Software Engineer Perspective

### **Technical Debt & Architectural Observations**
- **State Management Coupling:** The `Governor` class is heavily coupled to the filesystem (`fs.readFileSync`). While functional for a single-agent setup, this will break as we scale to a multi-agent Nexus. We need a `StorageProvider` abstraction.
- **Cost/Budget Configuration:** Hardcoded values for `COSTS` (chat, agent_turn, etc.) should be externalized to a JSON config. This is already on the backlog (GOV-013), but seeing it in the code reinforces its priority.
- **Skill Acquisition (Stubs):** `src/skills/acquisition.js` is a ghost town of stubs. The "Skill Acquisition" framework is one of our most visionary concepts (Agency/Self-Improvement), yet it lacks an actual execution engine.
- **TPM Protection:** The 1M TPM limit is hardcoded. As Thomas adds more models or providers, the Governor will be blind to their specific rate limits.

### **New Opportunities**
- **Autonomous Refactoring:** We have a "filler" mode in the Governor. We could use this to trigger "Surgical Refactors" where a sub-agent is spawned specifically to clean up debt flagged by the Governor (like the coupling mentioned above).
- **Competence Ledger:** The `SkillAcquisition` class needs a ledger to track *failed* verifications, not just successes, to prevent retrying expensive, impossible skills.

## 3. Ideate: Concrete Tasks

### **Task A: [GOV-028] Decouple State Persistence**
Refactor `Governor.js` to accept a `Storage` instance (interface: `get`, `set`, `exists`). Implement `FileStorage` as the default. This enables future `NexusStorage` or `RedisStorage` for distributed agents.

### **Task B: [SKILL-001] Implement 'Competence Verification' Harness**
Develop the execution logic for `SkillAcquisition.verifyCompetence()`. It should be able to spawn a sandboxed sub-agent with a specific "Final Exam" task (e.g., "Write a Python script to calculate X without using Y") and grade the result.

### **Task C: [GOV-029] Configurable Cost Profiles**
Move `this.COSTS` and `this.TPM_LIMIT` from `index.js` into a `config/limits.json`. Update the constructor to merge user overrides.

---
*Signed: Zown (Engineering Lead)*
