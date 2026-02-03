#!/bin/bash

# Configuration
LOG_FILE="$HOME/.openclaw/workspace/memory/watchdog.log"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

OPENCLAW_BIN="/opt/homebrew/bin/openclaw"

# Check OpenClaw Status with a timeout
if ! timeout 10s "$OPENCLAW_BIN" gateway status > /dev/null 2>&1; then
    echo "[$TIMESTAMP] Watchdog: Gateway unresponsive. RESTARTING..." >> "$LOG_FILE"
    
    # 1. Kill Gateway
    pkill -f "openclaw gateway"
    sleep 2

    # 3. Restart Gateway
    "$OPENCLAW_BIN" gateway restart >> "$LOG_FILE" 2>&1
    
    if [ $? -eq 0 ]; then
        echo "[$TIMESTAMP] Watchdog: Restart successful." >> "$LOG_FILE"
    else
        echo "[$TIMESTAMP] Watchdog: Restart FAILED." >> "$LOG_FILE"
    fi
else
    # Status is OK
    :
fi

# Rotate log if too big (over 1MB)
find "$LOG_FILE" -size +1M -exec mv "{}" "{}.old" \;
