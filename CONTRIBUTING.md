# Contributing to Zown Engine

This is the core platform for the Zown ecosystem. Maintaining architectural integrity and a clean execution pipeline is the top priority.

## 🛠 The Zown Atomic Pipeline (Git Flow)

### 1. Task Acquisition
- **Source of Truth**: All work begins at [GitHub Issues](https://github.com/GTOVD/zown-engine/issues).
- **Selection**: Choose the highest priority (P1) issue.

### 2. Branching & Linking
- **Branch Name**: `feat/ENGINE-XXX-description` (Always branch from `develop`).
- **Linking**: Comment on the GitHub issue: `Started work in branch feat/ENGINE-XXX`.

### 3. State Synchronization (Mandatory)
Before submitting a PR, you **MUST** update the following project files within your feature branch:
- **MEMORY.md**: 
  - Move the Issue from "Active Backlog" to "Strategic Milestones" or "Technical History."
  - Update any changes to the "Technical State."
- **SOUL.md / IDENTITY.md**: Update if the project's core mission or architecture has evolved (e.g., after completing ENGINE-001).

### 4. Pull Requests (PRs)
- **Target**: All PRs must target the `develop` branch.
- **Auto-Closing**: PR descriptions must include `Closes #XXX`.
- **Review**: The PR must not break the `engine/build.js` cycle or the skill registration logic.

### 5. Integration & Promotion
- **Step A**: Merge PR into `develop`.
- **Step B**: Promote `develop` to `main`:
  ```bash
  git checkout main && git merge develop && git push origin main
  ```

## 🏁 Definition of Done
- Implementation matches the Acceptance Criteria.
- **Project Identity, Soul, and Memory files are synchronized.**
- PR is merged into `develop` and promoted to `main`.
- The linked GitHub Issue is closed.
