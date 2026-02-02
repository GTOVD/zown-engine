const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const TRENDS_FILE = path.join(__dirname, 'trends.json');
const DRAFTS_DIR = path.join(__dirname, '../../devlog/drafts');

function loadTrends() {
    if (!fs.existsSync(TRENDS_FILE)) return [];
    return JSON.parse(fs.readFileSync(TRENDS_FILE, 'utf-8'));
}

function saveTrends(trends) {
    fs.writeFileSync(TRENDS_FILE, JSON.stringify(trends, null, 2));
}

const args = process.argv.slice(2);
const index = parseInt(args[0]);

if (isNaN(index)) {
    console.error("Usage: node draft.js <trend_index>");
    const trends = loadTrends();
    console.log("\nAvailable Trends:");
    trends.forEach((t, i) => console.log(`${i}: [${t.status}] ${t.topic}`));
    process.exit(1);
}

const trends = loadTrends();
if (!trends[index]) {
    console.error("Invalid index.");
    process.exit(1);
}

const trend = trends[index];

console.log(`Generating draft for: ${trend.topic}...`);

const prompt = `Write a technical blog post for a developer log about: "${trend.topic}".
Style: Professional, concise, technical, "learning in public" vibe.
Format: Markdown.
Include a title, date, and tags.
`;

// Escape quotes for shell safety is tricky, but basic replacement helps. 
// Ideally use spawn, but exec is simpler for CLI piping if careful.
// We'll use a safe way to pass arguments if possible, or just strict quoting.
// Given node exec, we can't easily pass args safely without spawn.
// Let's use spawn.

const { spawn } = require('child_process');
const child = spawn('gemini', [prompt]);

let stdout = '';
let stderr = '';

child.stdout.on('data', (data) => stdout += data);
child.stderr.on('data', (data) => stderr += data);

child.on('close', (code) => {
    if (code !== 0) {
        console.error("Gemini failed:", stderr);
        process.exit(code);
    }

    const slug = trend.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const date = new Date().toISOString().split('T')[0];
    const filename = `${date}-${slug}.md`;
    const filepath = path.join(DRAFTS_DIR, filename);

    fs.writeFileSync(filepath, stdout);
    console.log(`Draft saved to: ${filepath}`);

    // Update status
    trend.status = 'drafted';
    trend.draftPath = filepath;
    saveTrends(trends);
});
