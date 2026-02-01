const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, 'state.json');

// Priority Weights
const PRIORITY_MAP = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };

function loadState() {
    if (!fs.existsSync(STATE_FILE)) return null;
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
}

function saveState(state) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function getStatus(state) {
    if (!state) state = loadState();
    if (!state) return 'RED';

    const now = new Date();
    const lastReset = new Date(state.config.currentUsage.lastReset);
    
    // Reset Logic
    let dirty = false;
    if (now.getDate() !== lastReset.getDate()) {
        state.config.currentUsage.today = 0;
        state.config.currentUsage.thisHour = 0;
        state.config.currentUsage.lastReset = now.toISOString();
        dirty = true;
    } else if (now.getHours() !== lastReset.getHours()) {
        state.config.currentUsage.thisHour = 0;
        state.config.currentUsage.lastReset = now.toISOString();
        dirty = true;
    }

    if (dirty) saveState(state);

    const { today, thisHour } = state.config.currentUsage;
    const { dailyLimit, hourlyLimit } = state.config;

    // Red Mode (Stop) - Hard Limits
    if (today >= dailyLimit || thisHour >= hourlyLimit) {
        return 'RED';
    }

    // Yellow Mode (Caution) - 80% Capacity
    if (today >= dailyLimit * 0.8 || thisHour >= hourlyLimit * 0.8) {
        return 'YELLOW';
    }

    // Green Mode (Go)
    return 'GREEN';
}

function incrementUsage(amount = 1) {
    const state = loadState();
    state.config.currentUsage.today += amount;
    state.config.currentUsage.thisHour += amount;
    saveState(state);
}

function getNextTask() {
    const state = loadState();
    const status = getStatus(state);

    if (status === 'RED') {
        return { error: "RATE_LIMIT_EXCEEDED", status: "RED" };
    }

    // Filter pending tasks
    let tasks = state.backlog.filter(t => t.status === 'pending');

    // Filter by Status
    if (status === 'YELLOW') {
        // In Yellow mode, only Critical or High allowed
        tasks = tasks.filter(t => PRIORITY_MAP[t.priority] >= 3);
    }

    // Sort by Priority then ID
    tasks.sort((a, b) => {
        const pDiff = (PRIORITY_MAP[b.priority] || 1) - (PRIORITY_MAP[a.priority] || 1);
        if (pDiff !== 0) return pDiff;
        return a.id.localeCompare(b.id);
    });

    // Pick top task
    if (tasks.length > 0) {
        const task = tasks[0];
        // Mark as in-progress to prevent double-booking
        task.status = 'in_progress';
        task.startedAt = new Date().toISOString();
        saveState(state);
        incrementUsage(1); // Consuming a turn to fetch work
        return { ...task, systemStatus: status };
    }

    // FILLER LOGIC: If Green and Empty, create maintenance work
    if (status === 'GREEN') {
        incrementUsage(1);
        return {
            id: `auto-${Date.now()}`,
            title: "System Maintenance / Reflection",
            priority: "low",
            type: "filler",
            description: "Perform a quick health check, organize memory files, or reflect on recent events.",
            systemStatus: "GREEN"
        };
    }

    return null; // Yellow but no high priority tasks
}

function completeTask(id, result) {
    const state = loadState();
    const taskIndex = state.backlog.findIndex(t => t.id === id);
    
    if (taskIndex !== -1) {
        state.backlog[taskIndex].status = 'completed';
        state.backlog[taskIndex].completedAt = new Date().toISOString();
        if (result) state.backlog[taskIndex].result = result;
        
        // Cleanup: Move completed tasks to archive if backlog gets too big (>50)
        // (Simplified: just keep them for now)
        
        saveState(state);
        return true;
    }
    return false;
}

// CLI Interface
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
    case 'status':
        console.log(getStatus());
        break;
    case 'log':
        incrementUsage(parseInt(args[1] || 1));
        console.log('Usage logged.');
        break;
    case 'next':
        const task = getNextTask();
        console.log(JSON.stringify(task, null, 2));
        break;
    case 'complete':
        const id = args[1];
        if (!id) {
            console.error("Missing Task ID");
            process.exit(1);
        }
        completeTask(id, args[2] || "Done");
        console.log(`Task ${id} marked completed.`);
        break;
    default:
        console.log("Commands: status, log <n>, next, complete <id> [note]");
}
