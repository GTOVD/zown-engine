"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignalRouter = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Zown Nexus Signal Router
 *
 * Monitors the outbox and routes verified signals to their recipients.
 */
class SignalRouter {
    verificationEngine;
    registry;
    outboxPath = '.nexus/outbox';
    inboxPath = '.nexus/inbox';
    processedPath = '.nexus/processed';
    rejectedPath = '.nexus/rejected';
    constructor(verificationEngine, registry) {
        this.verificationEngine = verificationEngine;
        this.registry = registry;
    }
    /**
     * Processes all signals currently in the outbox.
     */
    async processOutbox() {
        const files = fs_1.default.readdirSync(this.outboxPath).filter(file => file.endsWith('.json'));
        for (const file of files) {
            const filePath = path_1.default.join(this.outboxPath, file);
            const signalData = JSON.parse(fs_1.default.readFileSync(filePath, 'utf-8'));
            console.log(`[ROUTER] Processing signal: ${file}`);
            const isValid = await this.verificationEngine.verifySignal(signalData);
            if (isValid) {
                this.routeSignal(file, signalData);
            }
            else {
                this.rejectSignal(file);
            }
        }
    }
    /**
     * Routes a single signal to its recipient or broadcasts to all.
     */
    routeSignal(fileName, signal) {
        const source = path_1.default.join(this.outboxPath, fileName);
        const archive = path_1.default.join(this.processedPath, fileName);
        if (signal.meta.recipient === '*') {
            this.broadcast(fileName, signal);
        }
        else {
            const destination = path_1.default.join(this.inboxPath, `${signal.meta.recipient}_${fileName}`);
            fs_1.default.copyFileSync(source, destination);
            console.log(`[ROUTER] Signal routed to ${signal.meta.recipient}`);
        }
        // Archive after all deliveries (or the single delivery)
        if (fs_1.default.existsSync(source)) {
            fs_1.default.renameSync(source, archive);
        }
    }
    /**
     * Broadcasts a signal to all registered agents.
     */
    broadcast(fileName, signal) {
        const source = path_1.default.join(this.outboxPath, fileName);
        const agents = Object.keys(this.registry.agents);
        console.log(`[ROUTER] Initiating broadcast expansion for signal: ${fileName} to ${agents.length} agents.`);
        for (const agentId of agents) {
            // Skip broadcasting back to the sender
            if (agentId === signal.meta.sender)
                continue;
            const destination = path_1.default.join(this.inboxPath, `${agentId}_${fileName}`);
            fs_1.default.copyFileSync(source, destination);
            console.log(`[ROUTER] Broadcast delivered to agent: ${agentId}`);
        }
    }
    rejectSignal(fileName) {
        const source = path_1.default.join(this.outboxPath, fileName);
        const destination = path_1.default.join(this.rejectedPath, fileName);
        fs_1.default.renameSync(source, destination);
        console.warn(`[ROUTER] Signal rejected and quarantined: ${fileName}`);
    }
}
exports.SignalRouter = SignalRouter;
