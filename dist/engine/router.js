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
    outboxPath = '.nexus/outbox';
    inboxPath = '.nexus/inbox';
    processedPath = '.nexus/processed';
    rejectedPath = '.nexus/rejected';
    constructor(verificationEngine) {
        this.verificationEngine = verificationEngine;
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
    routeSignal(fileName, signal) {
        const destination = path_1.default.join(this.inboxPath, fileName);
        const archive = path_1.default.join(this.processedPath, fileName);
        const source = path_1.default.join(this.outboxPath, fileName);
        // In a real P2P scenario, this would involve network transport.
        // For local v0.1, we simulate delivery by copying to the inbox.
        fs_1.default.copyFileSync(source, destination);
        fs_1.default.renameSync(source, archive);
        console.log(`[ROUTER] Signal routed to ${signal.meta.recipient} and archived.`);
    }
    rejectSignal(fileName) {
        const source = path_1.default.join(this.outboxPath, fileName);
        const destination = path_1.default.join(this.rejectedPath, fileName);
        fs_1.default.renameSync(source, destination);
        console.warn(`[ROUTER] Signal rejected and quarantined: ${fileName}`);
    }
}
exports.SignalRouter = SignalRouter;
