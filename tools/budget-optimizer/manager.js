const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, 'state.json');

function loadState() {
    if (!fs.existsSync(STATE_FILE)) return null;
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
}

function saveState(state) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function getStatus() {
    const state = loadState();
    if (!state) return 'RED';

    const now = new Date();
    const lastReset = new Date(state.config.currentUsage.lastReset);
    
    // Reset Logic
    if (now.getDate() !== lastReset.getDate()) {
        state.config.currentUsage.today = 0;
        state.config.currentUsage.thisHour = 0;
        state.config.currentUsage.lastReset = now.toISOString();
        saveState(state);
    } else if (now.getHours() !== lastReset.getHours()) {
        state.config.currentUsage.thisHour = 0;
        state.config.currentUsage.lastReset = now.toISOString(); // Keep day, update hour
        saveState(state);
    }

    const { today, thisHour } = state.config.currentUsage;
    const { dailyLimit, hourlyLimit } = state.config;

    // Red Mode (Stop)
    if (today >= dailyLimit || thisHour >= hourlyLimit) {
        return 'RED';
    }

    // Yellow Mode (Caution)
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

// CLI Interface
const args = process.argv.slice(2);
if (args[0] === 'status') {
    console.log(getStatus());
} else if (args[0] === 'log') {
    incrementUsage(parseInt(args[1] || 1));
    console.log('Usage logged.');
}
