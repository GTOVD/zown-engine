# Zown Runtime Deployment Guide

This directory contains scripts and configuration for deploying the Zown Runtime (OpenClaw Agent) to a remote VPS (Cloud Provider).

## Prerequisites

1.  **VPS**: A fresh Ubuntu 22.04/24.04 server (e.g., DigitalOcean Droplet, AWS EC2, Hetzner).
    *   Minimum: 2GB RAM, 2 vCPU.
2.  **Domain**: (Optional) For accessing the Gateway remotely.

## Deployment Steps

### 1. Verify Configuration
Ensure `config/openclaw.json` exists in the root of your workspace and contains valid credentials (this file is git-ignored).

### 2. Transfer Files
Upload the project to your VPS. Replace `user@host` with your server details.

```bash
# From the workspace root:
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'deploy/config' ./ user@host:~/zown-runtime/
```

### 3. Initialize Server
SSH into your server and run the setup script.

```bash
ssh user@host
cd ~/zown-runtime
chmod +x deploy/setup.sh
./deploy/setup.sh
```

### 4. Launch "The Soul"
Start the containerized runtime.

```bash
docker compose up -d --build
```

### 5. Verify
Check logs to ensure the agent is alive.
```bash
docker compose logs -f
```

## Architecture
- **Volume Mapping**: The current directory (`~/zown-runtime`) is mounted to `/root/.openclaw/workspace` inside the container. This ensures `MEMORY.md` and `memory/` are persistent.
- **Config**: Mapped from `./config` to `/root/.openclaw/config`.

## Maintenance
To update the agent:
1.  Rsync new files.
2.  `docker compose restart zown`.
