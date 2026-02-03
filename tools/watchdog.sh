#!/bin/bash

# Configuration
LOG_FILE="$HOME/.openclaw/workspace/memory/watchdog.log"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# Check OpenClaw Status with a timeout
if ! timeout 10s openclaw gateway status > /dev/null 2>&1; then
    echo "[$TIMESTAMP] Watchdog: Gateway unresponsive. RESTARTING..." >> "$LOG_FILE"
    
    # 1. Kill Gateway
    pkill -f "openclaw gateway"
    sleep 2

    # 2. Kill Orphaned Child Processes (Chrome, Bird, etc.)
    # Be careful not to kill user's actual Chrome browser if possible
    # OpenClaw usually runs Chrome with specific flags or user-dir, but identifying it is hard.
    # Instead, we focus on known tool binaries if they are stuck.
    # We won't kill Chrome/Node blindly to avoid collateral damage.

    # 3. Restart Gateway
    openclaw gateway restart >> "$LOG_FILE" 2>&1
    
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
