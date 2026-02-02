FROM node:22-bullseye-slim

# Metadata
LABEL app="zown-runtime"
LABEL description="Dockerized runtime for Zown (OpenClaw Agent)"

# Install system dependencies
# git: for git operations (memory sync)
# python3/build-essential: for potential node-gyp rebuilds
RUN apt-get update && apt-get install -y \
    git \
    python3 \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install OpenClaw globally
RUN npm install -g openclaw

# Setup Workspace Directory
WORKDIR /root/.openclaw/workspace

# Copy dependency definitions
# We copy these to the image to ensure the 'compute' layer has necessary libs pre-installed
# However, the run-time volume mount might overlay this, so we rely on 'npm install' 
# running in the container or pre-installing in the volume. 
# For true decoupling, the image provides the CAPABILITY (libs), the volume provides the CONFIG.

COPY package.json package-lock.json* ./

# Install dependencies defined in package.json
RUN npm install

# The actual workspace files (Memory, Soul, Tools) will be mounted at runtime
# to strictly separate Compute (this image) from Memory (the volume).

# Entrypoint
# Starts the OpenClaw gateway. 
# Ensure you have configured the gateway or mapped the ports.
CMD ["openclaw", "gateway", "start"]
