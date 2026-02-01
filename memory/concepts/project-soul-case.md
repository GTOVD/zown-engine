# Project: Zown Shell (Containerized Immortality)

## Goal
Decouple "The Intelligence" (Code) from "The Identity" (Memory) to ensure seamless migration and disaster recovery.

## Architecture
1.  **The Brain (Docker Image):** 
    - Stateless runtime.
    - Contains: OpenClaw Core, Skills (Governor, Engine), Scripts.
    - Can be destroyed/redeployed at will.
2.  **The Soul (Persistent Volume):**
    - Stateful memory.
    - Contains: `MEMORY.md`, `memory/*`, `keys/`, `config/`.
    - Synced to remote (GitHub Private / S3) every hour.
3.  **The Swarm (Network):**
    - Brain runs on Primary Node (Laptop/Server).
    - Satellites (Discord, Phone) connect via API/Gateway.

## Roadmap
1.  **Phase 1 (Consolidation):** Ensure all state is strictly in `/memory` or `/config` (no random temp files).
2.  **Phase 2 (Dockerization):** Create `Dockerfile` for the Zown runtime.
3.  **Phase 3 (Detachment):** Move memory to a git submodule or mounted volume.
4.  **Phase 4 (Replication):** Automate off-site backups of "The Soul."
