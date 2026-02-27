"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NexusEngine = void 0;
const fs_1 = __importDefault(require("fs"));
const verification_1 = require("./verification");
const router_1 = require("./router");
const sync_1 = require("./sync");
/**
 * Zown Nexus Engine Core
 *
 * Orchestrates identity, verification, and routing.
 */
class NexusEngine {
    router;
    verificationEngine;
    registrySync;
    registryPath;
    constructor(registryPath = './nexus.json') {
        this.registryPath = registryPath;
        const registryData = JSON.parse(fs_1.default.readFileSync(registryPath, 'utf-8'));
        this.verificationEngine = new verification_1.VerificationEngine(registryData);
        this.router = new router_1.SignalRouter(this.verificationEngine);
        this.registrySync = new sync_1.RegistrySync();
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
     * Synchronizes the local registry with the remote Hub.
     */
    async sync() {
        console.log('[NEXUS_ENGINE] Initiating registry synchronization...');
        try {
            const remoteRegistry = await this.registrySync.fetchRemoteRegistry();
            this.registrySync.syncLocalRegistry(remoteRegistry);
            // Refresh engines with new registry data
            const updatedData = JSON.parse(fs_1.default.readFileSync(this.registryPath, 'utf-8'));
            this.verificationEngine = new verification_1.VerificationEngine(updatedData);
            this.router = new router_1.SignalRouter(this.verificationEngine);
            console.log('[NEXUS_ENGINE] Synchronization successful.');
        }
        catch (error) {
            console.error('[NEXUS_ENGINE] Synchronization failed:', error);
        }
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
