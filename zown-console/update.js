const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '../state.json');
const OUTPUT_FILE = path.join(__dirname, 'data.json');

// Cost assumptions (Mock)
const COST_PER_CREDIT = 0.001; // $0.001 per governor token

function generateData() {
    if (!fs.existsSync(STATE_FILE)) {
        console.error("State file not found!");
        return;
    }

    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    
    // Calculate Burn
    const dailyCredits = state.config.currentUsage.today;
    const dailyBurn = dailyCredits * COST_PER_CREDIT;
    
    // Mock Revenue (Randomized for demo, trending up)
    const dailyRevenue = Math.max(0, (Math.random() * 0.5) + (dailyBurn * 1.2)); // Slight profit mocked

    const data = {
        timestamp: new Date().toISOString(),
        financials: {
            burn: dailyBurn.toFixed(4),
            revenue: dailyRevenue.toFixed(4),
            profit: (dailyRevenue - dailyBurn).toFixed(4),
            currency: "USD"
        },
        governor: {
            usage: state.config.currentUsage,
            limits: {
                daily: state.config.dailyLimit,
                hourly: state.config.hourlyLimit
            },
            status: state.config.currentUsage.thisHour >= state.config.hourlyLimit ? "THROTTLED" : "ACTIVE"
        },
        tasks: {
            pending: state.backlog.filter(t => t.status === 'pending').length,
            completed: state.backlog.filter(t => t.status === 'completed').length,
            in_progress: state.backlog.filter(t => t.status === 'in_progress').length,
            list: state.backlog
        }
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
    console.log("Dashboard data updated.");
}

generateData();
