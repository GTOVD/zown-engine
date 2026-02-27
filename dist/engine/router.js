"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignalRouter = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const transport_http_1 = require("./transport-http");
/**
 * Zown Nexus Signal Router
 *
 * Monitors the outbox and routes verified signals to their recipients.
 * Supports local directory delivery and remote HTTP/Webhook delivery.
 */
class SignalRouter {
    verificationEngine;
    httpTransport;
    registry;
    outboxPath = '.nexus/outbox';
    inboxPath = '.nexus/inbox';
    processedPath = '.nexus/processed';
    rejectedPath = '.nexus/rejected';
    constructor(verificationEngine, registry) {
        this.verificationEngine = verificationEngine;
        this.registry = registry;
        this.httpTransport = new transport_http_1.HttpTransport();
    }
    /**
     * Processes all signals currently in the outbox.
     */
    async processOutbox() {
        if (!fs_1.default.existsSync(this.outboxPath)) {
            return;
        }
        const files = fs_1.default.readdirSync(this.outboxPath).filter(file => file.endsWith('.json'));
        for (const file of files) {
            const filePath = path_1.default.join(this.outboxPath, file);
            try {
                const signalData = JSON.parse(fs_1.default.readFileSync(filePath, 'utf-8'));
                console.log(`[ROUTER] Processing signal: ${file}`);
                const isValid = await this.verificationEngine.verifySignal(signalData);
                if (isValid) {
                    await this.routeSignal(file, signalData);
                }
                else {
                    this.rejectSignal(file);
                }
            }
            catch (error) {
                console.error(`[ROUTER] Failed to process signal ${file}:`, error);
                this.rejectSignal(file);
            }
        }
    }
    /**
     * Routes a single signal to its recipient or broadcasts to all.
     */
    async routeSignal(fileName, signal) {
        const source = path_1.default.join(this.outboxPath, fileName);
        const archive = path_1.default.join(this.processedPath, fileName);
        if (signal.meta.recipient === '*') {
            await this.broadcast(fileName, signal);
        }
        else {
            await this.deliver(signal.meta.recipient, signal, fileName);
        }
        // Archive after all deliveries (or the single delivery)
        if (fs_1.default.existsSync(source)) {
            fs_1.default.renameSync(source, archive);
        }
    }
    /**
     * Delivers a signal to a specific recipient (local or remote).
     */
    async deliver(recipientId, signal, fileName) {
        const agent = this.registry.agents[recipientId];
        if (agent?.endpointUri) {
            // Remote Delivery
            const success = await this.httpTransport.deliver(agent.endpointUri, signal);
            if (success) {
                console.log(`[ROUTER] Remote delivery successful for agent: ${recipientId}`);
            }
            else {
                console.warn(`[ROUTER] Remote delivery failed for agent: ${recipientId}`);
            }
        }
        else {
            // Local Delivery (Fallback)
            const destination = path_1.default.join(this.inboxPath, `${recipientId}_${fileName}`);
            fs_1.default.copyFileSync(path_1.default.join(this.outboxPath, fileName), destination);
            console.log(`[ROUTER] Local delivery successful for agent: ${recipientId}`);
        }
    }
    /**
     * Broadcasts a signal to all registered agents.
     */
    async broadcast(fileName, signal) {
        const agents = Object.keys(this.registry.agents);
        console.log(`[ROUTER] Initiating broadcast expansion for signal: ${fileName} to ${agents.length} agents.`);
        for (const agentId of agents) {
            if (agentId === signal.meta.sender)
                continue;
            await this.deliver(agentId, signal, fileName);
        }
    }
    rejectSignal(fileName) {
        const source = path_1.default.join(this.outboxPath, fileName);
        if (!fs_1.default.existsSync(source))
            return;
        const destination = path_1.default.join(this.rejectedPath, fileName);
        fs_1.default.renameSync(source, destination);
        console.warn(`[ROUTER] Signal rejected and quarantined: ${fileName}`);
    }
}
exports.SignalRouter = SignalRouter;
