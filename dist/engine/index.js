"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NexusEngine = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const verification_1 = require("./verification");
const router_1 = require("./router");
const sync_1 = require("./sync");
const dispatcher_1 = require("./dispatcher");
/**
 * Zown Nexus Engine Core
 *
 * Orchestrates identity, verification, routing, and dispatching.
 */
class NexusEngine {
    router;
    verificationEngine;
    registrySync;
    dispatcher;
    registryPath;
    inboxPath = '.nexus/inbox';
    constructor(registryPath = './nexus.json') {
        this.registryPath = registryPath;
        const registryData = JSON.parse(fs_1.default.readFileSync(registryPath, 'utf-8'));
        this.verificationEngine = new verification_1.VerificationEngine(registryData);
        this.router = new router_1.SignalRouter(this.verificationEngine, registryData);
        this.registrySync = new sync_1.RegistrySync();
        this.dispatcher = new dispatcher_1.SignalDispatcher();
    }
    /**
     * Registers an action handler for incoming signals.
     */
    on(method, handler) {
        this.dispatcher.register(method, handler);
    }
    /**
     * Performs a full routing and dispatching pulse.
     */
    async pulse() {
        console.log('[NEXUS_ENGINE] Initiating outbox routing pulse...');
        await this.router.processOutbox();
        console.log('[NEXUS_ENGINE] Initiating inbox dispatch pulse...');
        await this.processInbox();
        console.log('[NEXUS_ENGINE] Pulse complete.');
    }
    /**
     * Processes all signals currently in the inbox.
     */
    async processInbox() {
        if (!fs_1.default.existsSync(this.inboxPath))
            return;
        const files = fs_1.default.readdirSync(this.inboxPath).filter(file => file.endsWith('.json'));
        for (const file of files) {
            const filePath = path_1.default.join(this.inboxPath, file);
            try {
                const signalData = JSON.parse(fs_1.default.readFileSync(filePath, 'utf-8'));
                console.log(`[NEXUS_ENGINE] Processing inbox signal: ${file}`);
                // Note: In v0.1, we assume signals in inbox were verified by the router
                // or a remote transport layer before placement.
                await this.dispatcher.dispatch(signalData);
                // Archive after successful dispatch
                const archivePath = path_1.default.join('.nexus/processed', `inbox_${file}`);
                fs_1.default.renameSync(filePath, archivePath);
            }
            catch (error) {
                console.error(`[NEXUS_ENGINE] Failed to dispatch signal ${file}:`, error);
                // Move to rejected for manual review
                const rejectedPath = path_1.default.join('.nexus/rejected', `inbox_${file}`);
                fs_1.default.renameSync(filePath, rejectedPath);
            }
        }
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
            this.router = new router_1.SignalRouter(this.verificationEngine, updatedData);
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
