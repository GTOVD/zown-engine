# Zown Engine ⚙️

## 🌟 Soul
Zown Engine is the industrial core of the Zown organism. It is where raw computation, skill execution, and deployment logic reside. It prioritizes stability, performance, and clear operational boundaries. It is the "muscle" that powers the modular ecosystem.

## 🛠 Agent (Zown-Open-Source-Understanding)
- **Primary Objective**: Manage the execution and deployment of Zown sub-modules.
- **Tech Stack**: Node.js, Docker, GitHub Actions.
- **Rules**:
  1. Never commit non-engine workspace data (e.g., global `memory/` or other repos) to this repository.
  2. All feature work must happen on `feat/` branches branched from `develop`.
  3. Validated deployments must target the `gh-pages` branch for hosting.

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
