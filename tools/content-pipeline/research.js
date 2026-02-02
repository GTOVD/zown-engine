const fs = require('fs');
const path = require('path');

const TRENDS_FILE = path.join(__dirname, 'trends.json');

function loadTrends() {
    if (!fs.existsSync(TRENDS_FILE)) return [];
    return JSON.parse(fs.readFileSync(TRENDS_FILE, 'utf-8'));
}

function saveTrends(trends) {
    fs.writeFileSync(TRENDS_FILE, JSON.stringify(trends, null, 2));
}

const args = process.argv.slice(2);
const command = args[0];
const payload = args.slice(1).join(' ');

if (command === 'add') {
    if (!payload) {
        console.error("Usage: node research.js add <topic description>");
        process.exit(1);
    }
    const trends = loadTrends();
    trends.push({
        topic: payload,
        addedAt: new Date().toISOString(),
        status: 'pending'
    });
    saveTrends(trends);
    console.log(`Added trend: ${payload}`);
} else if (command === 'list') {
    const trends = loadTrends();
    if (trends.length === 0) {
        console.log("No trends found.");
    } else {
        console.table(trends);
    }
} else if (command === 'clear') {
    saveTrends([]);
    console.log("Trends cleared.");
} else {
    console.log("Usage: node research.js [add <topic> | list | clear]");
}
