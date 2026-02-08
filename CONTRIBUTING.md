# Contributing to Zown Engine

Thank you for contributing to the **Zown Engine**! This is the core platform for the Zown ecosystem, and maintaining its integrity is paramount.

## 🛠 Engineering Workflow (Atomic Pipeline V2)

All work must follow the professional Git Flow to ensure stability:

### 1. Branching Strategy
- **NEVER** work on `main` or `develop` directly.
- Branch from `develop`: `git checkout -b feat/issue-ID-description`.
- All Pull Requests must target `develop`.

### 2. Integration Flow
- **Feature -> develop**: For staging, testing, and verification.
- **develop -> main**: For production releases and version tagging.

### 3. Commit Messages
- Use Conventional Commits:
  - `feat:` for new features.
  - `fix:` for bug fixes.
  - `docs:` for documentation updates.
  - `chore:` for maintenance.

### 4. Pull Requests
- Provide a clear description of changes.
- Ensure all CI/CD checks (if applicable) pass.
- Update `MEMORY.md` if the change affects core project logic or history.

### 🏁 Definition of Done
- Implementation complete and verified.
- PR merged into `develop`.
- `develop` promoted to `main`.
- Documentation and memory files updated.

## Development Setup

1. Clone the repository.
2. Run `npm install`.
3. Start the dev environment (e.g., `npm run dev`).

Thank you for building the future with us.
