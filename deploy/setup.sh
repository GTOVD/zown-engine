#!/bin/bash

# Zown Runtime (Soul Case) Deployment Script
# Usage: ./setup.sh

set -e

echo ">>> Initializing Zown Runtime Deployment..."

# 1. Update System
echo ">>> Updating system..."
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl git build-essential python3

# 2. Install Docker
if ! command -v docker &> /dev/null; then
    echo ">>> Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    # Add user to docker group
    sudo usermod -aG docker $USER
    echo ">>> Docker installed. You may need to logout and login again for group changes to take effect."
else
    echo ">>> Docker already installed."
fi

# 3. Install Docker Compose (if not part of docker cli)
if ! docker compose version &> /dev/null; then
    echo ">>> Docker Compose plugin missing, checking legacy..."
    if ! command -v docker-compose &> /dev/null; then
        echo ">>> Installing Docker Compose..."
        sudo apt-get install -y docker-compose-plugin
    fi
fi

# 4. Setup Workspace
echo ">>> Setting up workspace..."
mkdir -p ~/zown-runtime
cd ~/zown-runtime

# 5. Clone/Copy Repo (Placeholder)
# We assume this script is part of the repo or the user manually uploads files.
# If this is a fresh VPS, we need to pull the code.
# For now, we'll prompt the user or assume files are present.

if [ ! -f "docker-compose.yml" ]; then
    echo ">>> WARNING: docker-compose.yml not found in $(pwd)."
    echo ">>> Please upload 'docker-compose.yml', 'Dockerfile', and 'config/' to this directory."
else
    echo ">>> Deployment files found."
fi

# 6. Start Service
echo ">>> ready to start."
echo "Run: docker compose up -d"
