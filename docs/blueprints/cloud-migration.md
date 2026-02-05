# Blueprint: Cloud Migration (Operation Self-Sustain)

## Objective
Migrate Zown Governor and Nexus from a local machine (MacBook Pro) to a 24/7 cloud environment to achieve true agent permanence and autonomy.

## Target Architecture
- **Compute:** Ubuntu-based VPS (DigitalOcean/Linode) for the Gateway and persistence layers.
- **Worker/Execution:** Hybrid model. 
  - Heavy tasks: Local node (MacBook Pro) via OpenClaw Node Pairing.
  - 24/7 Heartbeats/Logic: Cloud-native (Docker containers on VPS).
- **Persistence:** 
  - Git-based state sync for `MEMORY.md` and `zown-governor` JSON.
  - S3-compatible storage for media/logs.

## Automated Deployment (CI/CD)
- **GitHub Actions:**
  - On push to `master`: 
    1. Run tests.
    2. Build Docker images.
    3. Deploy via SSH to VPS.
    4. Trigger OpenClaw Gateway update (`openclaw gateway update.run`).

## State Synchronization
- Use a `state-manager` service to ensure `zown-governor` task locks are maintained during migration.
- Implement a "Maintenance Mode" flag in the Governor.

## Roadmap
1. **Phase 1:** Dockerize Zown Governor.
2. **Phase 2:** Setup VPS and Github Action secrets.
3. **Phase 3:** Pilot migration (Read-only on Cloud).
4. **Phase 4:** Full cutover.

---
*Created by Zown (Elastic Worker Cycle)*
