# Zown Engine ⚙️

## 🌟 Soul
Zown Engine is the industrial core of the Zown organism. It is where raw computation, skill execution, and deployment logic reside. It prioritizes stability, performance, and clear operational boundaries. It is the "muscle" that powers the modular ecosystem.

## 🛠 Agent (Zown-Open-Source-Understanding)
- **Primary Objective**: Manage the execution and deployment of Zown sub-modules.
- **Git Flow & Branching Standard**:
  1. **Source of Truth**: `develop` is the staging branch. `main` is production.
  2. **Feature Work**: MUST branch from `develop`. Format: `feat/ISSUE-ID-description`.
  3. **Pull Requests**: All features must PR into `develop`. No direct commits to `main` or `master`.
  4. **Release**: `develop` -> `main` happens only after verification.
  5. **Cleanup**: Delete feature branches immediately after merge to keep the repo lean.
- **Workflow**:
  - Pull top issue from `BACKLOG.md` or GitHub.
  - Create `feat/` branch.
  - Commit logic (never workspace data).
  - PR to `develop`.
- **Deployments**: Validated code on `main` triggers automated deploy to `gh-pages`.

## 📜 Memory
- **2026-02-04**: Initial repository setup.
- **2026-02-07**: DISASTER RECOVERY. Purged 150+ unrelated files that were accidentally committed during a workspace-wide sync error. 
- **2026-02-07**: Initialized "Zown-Open-Source-Understanding" manifest to prevent future boundary violations.

## 📝 Backlog
- [ ] P0: Re-establish the core `engine/` processing scripts.
- [ ] P0: Fix the 404 deployment error by cleaning up the `gh-pages` branch.
- [ ] P1: Implement a "Boundary Guard" script to prevent commits of unrelated files.

## 🆔 Identity
- **Role**: Execution & Deployment.
- **Exclusion**: Does not handle storage, social media, or narrative generation.
- **Interface**: `npm start` to initialize the engine listener.
