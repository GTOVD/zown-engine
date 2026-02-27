"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NexusEngine = void 0;
const fs_1 = __importDefault(require("fs"));
const verification_1 = require("./verification");
const router_1 = require("./router");
/**
 * Zown Nexus Engine Core
 *
 * Orchestrates identity, verification, and routing.
 */
class NexusEngine {
    router;
    verificationEngine;
    constructor(registryPath = './nexus.json') {
        const registryData = JSON.parse(fs_1.default.readFileSync(registryPath, 'utf-8'));
        this.verificationEngine = new verification_1.VerificationEngine(registryData);
        this.router = new router_1.SignalRouter(this.verificationEngine);
    }
    /**
     * Performs a single routing pulse (one-shot outbox processing).
     */
    async pulse() {
        console.log('[NEXUS_ENGINE] Initiating signal routing pulse...');
        await this.router.processOutbox();
        console.log('[NEXUS_ENGINE] Pulse complete.');
    }
    /**
     * Starts the engine in watcher mode (periodically polls the outbox).
     * @param intervalMs Polling interval in milliseconds
     */
    watch(intervalMs = 5000) {
        console.log(`[NEXUS_ENGINE] Watcher mode active (interval: ${intervalMs}ms)`);
        setInterval(async () => {
            await this.pulse();
        }, intervalMs);
    }
}
exports.NexusEngine = NexusEngine;
