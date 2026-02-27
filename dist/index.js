"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const engine_1 = require("./engine");
async function main() {
    const engine = new engine_1.NexusEngine();
    // Check for --watch flag
    if (process.argv.includes('--watch')) {
        engine.watch();
    }
    else {
        await engine.pulse();
    }
}
main().catch(error => {
    console.error('[NEXUS_CLI] Fatal error:', error);
    process.exit(1);
});
