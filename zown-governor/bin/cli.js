#!/usr/bin/env node

const Governor = require('../src/index.js');
const path = require('path');

// Allow overriding state file via env var or arg
// Simple arg parsing for now
const args = process.argv.slice(2);
const command = args[0];

const governor = new Governor();

switch (command) {
    case 'init':
        console.log(JSON.stringify(governor.init(), null, 2));
        break;
    case 'status':
        console.log(JSON.stringify(governor.getDynamicStatus(), null, 2));
        break;
    case 'log':
        governor.incrementUsage(parseInt(args[1] || 1));
        console.log('Usage logged.');
        break;
    case 'next':
        console.log(JSON.stringify(governor.getNextTask(), null, 2));
        break;
    case 'list':
        const statusFilter = args[1];
        console.log(JSON.stringify(governor.getTasks(statusFilter), null, 2));
        break;
    case 'add':
        // zown-governor add "Title" "Priority" "Desc"
        const title = args[1];
        const prio = args[2];
        const desc = args[3];
        console.log(JSON.stringify(governor.addTask(title, prio, desc), null, 2));
        break;
    case 'complete':
        const id = args[1];
        governor.completeTask(id, args[2] || "Done");
        console.log(`Task ${id} marked completed.`);
        break;
    case 'fail':
        const failId = args[1];
        governor.failTask(failId, args[2] || "Failed");
        console.log(`Task ${failId} marked failed.`);
        break;
    default:
        console.log("Zown Governor CLI");
        console.log("Usage:");
        console.log("  zown-governor init");
        console.log("  zown-governor status");
        console.log("  zown-governor log <n>");
        console.log("  zown-governor next");
        console.log("  zown-governor add <title> <priority> <description>");
        console.log("  zown-governor complete <id> [result]");
        console.log("  zown-governor fail <id> [reason]");
}
