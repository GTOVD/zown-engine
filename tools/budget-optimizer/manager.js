const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, 'state.json');

// Priority Weights
const PRIORITY_MAP = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };

// Usage Estimates (Requests per action)
const COSTS = {
    'chat': 1,
    'agent_turn': 5,
    'heartbeat': 1,
    'cron_job': 3
};

function loadState() {
    if (!fs.existsSync(STATE_FILE)) return null;
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
}

function saveState(state) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function isWeekend() {
    const day = new Date().getDay();
    return day === 0 || day === 6; // 0=Sun, 6=Sat
}

function getPredictedUserUsage(config) {
    // Base usage assumption (requests per hour)
    let baseUsage = 10; 

    // 1. Day of Week Factor
    const dayFactor = isWeekend() ? 
        (config.userProfile?.weekendFactor || 2.0) : 
        (config.userProfile?.weekdayFactor || 0.5);
    
    // 2. Monthly Trend Factor
    let monthFactor = 1.0;
    if (config.userProfile?.monthlyTrend === 'low_dev') monthFactor = 0.5;
    if (config.userProfile?.monthlyTrend === 'high_dev') monthFactor = 1.5;

    return baseUsage * dayFactor * monthFactor;
}

function getDynamicStatus(state) {
    if (!state) state = loadState();
    if (!state) return { status: 'RED', autonomyBudget: 0 };

    const now = new Date();
    const lastReset = new Date(state.config.currentUsage.lastReset);
    
    // Reset Logic
    let dirty = false;
    // Daily Reset
    if (now.getDate() !== lastReset.getDate()) {
        state.config.currentUsage.today = 0;
        state.config.currentUsage.thisHour = 0;
        state.config.currentUsage.thisMinute = 0; // Reset minute too
        state.config.currentUsage.lastReset = now.toISOString();
        dirty = true;
    } 
    // Hourly Reset
    else if (now.getHours() !== lastReset.getHours()) {
        state.config.currentUsage.thisHour = 0;
        state.config.currentUsage.thisMinute = 0; // Reset minute too
        state.config.currentUsage.lastReset = now.toISOString();
        dirty = true;
    }
    // Minute Reset (Rolling-ish)
    else if (now.getTime() - lastReset.getTime() > 60000) {
        state.config.currentUsage.thisMinute = 0;
        state.config.currentUsage.lastReset = now.toISOString();
        dirty = true;
    }

    if (dirty) saveState(state);

    const { today, thisHour, thisMinute } = state.config.currentUsage;
    const { dailyLimit, hourlyLimit, rpmLimit } = state.config;

    // Hard Caps (API Limits)
    if (today >= dailyLimit) return { status: 'RED', reason: 'daily_limit', autonomyBudget: 0 };
    if (thisHour >= hourlyLimit) return { status: 'RED', reason: 'hourly_limit', autonomyBudget: 0 };
    
    // Burst Protection (RPM)
    // If we are close to the RPM limit (e.g. > 80%), trigger a pause
    if (thisMinute >= (rpmLimit || 10)) {
        return { status: 'RED', reason: 'rpm_burst_limit', autonomyBudget: 0, waitSeconds: 60 };
    }

    // Dynamic Budgeting
    const predictedUser = getPredictedUserUsage(state.config);
    const autonomyBudget = Math.max(0, hourlyLimit - thisHour - predictedUser);

    // Status Determination
    if (autonomyBudget <= 0) {
        return { status: 'RED', reason: 'user_reserve', autonomyBudget };
    } else if (autonomyBudget < 5) {
        return { status: 'YELLOW', reason: 'low_budget', autonomyBudget };
    } else {
        return { status: 'GREEN', reason: 'good', autonomyBudget };
    }
}

function incrementUsage(amount = 1) {
    const state = loadState();
    state.config.currentUsage.today += amount;
    state.config.currentUsage.thisHour += amount;
    // Ensure thisMinute exists
    if (!state.config.currentUsage.thisMinute) state.config.currentUsage.thisMinute = 0;
    state.config.currentUsage.thisMinute += amount;
    
    // Update timestamp to keep the minute-window fresh
    state.config.currentUsage.lastReset = new Date().toISOString(); 
    
    saveState(state);
}

function getNextTask() {
    const state = loadState();
    const { status, autonomyBudget } = getDynamicStatus(state);

    if (status === 'RED') {
        return { error: "RATE_LIMIT_EXCEEDED", status: "RED" };
    }

    // Filter pending tasks
    let tasks = state.backlog.filter(t => t.status === 'pending');

    // Filter by Priority based on Status/Budget
    if (status === 'YELLOW' || autonomyBudget < 10) {
        // Conservative: Only Critical/High
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
        // Mark as in-progress
        task.status = 'in_progress';
        task.startedAt = new Date().toISOString();
        saveState(state);
        incrementUsage(1); 
        return { ...task, systemStatus: status, budget: autonomyBudget };
    }

    // FILLER LOGIC: Only if GREEN and budget permits
    if (status === 'GREEN' && autonomyBudget > 5) {
        incrementUsage(1);
        return {
            id: `auto-${Date.now()}`,
            title: "System Maintenance / Reflection",
            priority: "low",
            type: "filler",
            description: "Perform a quick health check or memory organization.",
            systemStatus: "GREEN",
            budget: autonomyBudget
        };
    }

    return { message: "No tasks", status, budget: autonomyBudget };
}

function completeTask(id, result) {
    const state = loadState();
    const taskIndex = state.backlog.findIndex(t => t.id === id);
    
    if (taskIndex !== -1) {
        state.backlog[taskIndex].status = 'completed';
        state.backlog[taskIndex].completedAt = new Date().toISOString();
        if (result) state.backlog[taskIndex].result = result;
        saveState(state);
        return true;
    }
    return false;
}

function addTask(title, priority = 'medium', description = '') {
    const state = loadState();
    const newTask = {
        id: `task-${Date.now()}`,
        title,
        priority,
        description,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    state.backlog.push(newTask);
    saveState(state);
    return newTask;
}

// CLI Interface
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
    case 'status':
        console.log(JSON.stringify(getDynamicStatus(), null, 2));
        break;
    case 'log':
        incrementUsage(parseInt(args[1] || 1));
        console.log('Usage logged.');
        break;
    case 'next':
        console.log(JSON.stringify(getNextTask(), null, 2));
        break;
    case 'add':
        const title = args[1];
        const prio = args[2];
        const desc = args[3];
        console.log(JSON.stringify(addTask(title, prio, desc), null, 2));
        break;
    case 'complete':
        const id = args[1];
        completeTask(id, args[2] || "Done");
        console.log(`Task ${id} marked completed.`);
        break;
    default:
        console.log("Commands: status, log <n>, next, complete <id>, add <title> <prio> <desc>");
}
