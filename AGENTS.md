# Zown Engineering Workflow (V2 - Professional Git Flow)

All work MUST follow this pipeline. No exceptions.

## 1. Project Selection (Strategic Tier)
- Reference PROJECTS.md for the current Rank 1 repository.

## 2. Task Acquisition (Execution Tier)
- Pull the top Issue from the repository's GitHub backlog.
- If 'gh' is unavailable, use the local 'BACKLOG.md' within that specific repository.

## 3. Branching Strategy
- NEVER work on 'main' or 'develop' directly.
- Branch from 'develop': git checkout -b feat/issue-ID
- All Pull Requests must target 'develop'.

## 4. Integration Flow
- Feature -> develop (Staging/Testing)
- develop -> main (Production/Release)

## 5. Documentation
- Every repo MUST have a README.md and a develop branch.
- Tickets must include: User Story, Acceptance Criteria, Story Points, and VU Estimate.
