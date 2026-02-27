"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReputationEngine = void 0;
const fs_1 = __importDefault(require("fs"));
/**
 * Zown Nexus Reputation Engine
 *
 * Tracks and verifies agent performance across the network.
 */
class ReputationEngine {
    reputationPath = './reputation.json';
    /**
     * Records a performance audit and updates agent scores.
     */
    applyAudit(audit) {
        const reputation = this.getReputation();
        const score = reputation.scores[audit.agentId] || this.initializeAgent(audit.agentId);
        console.log(`[REPUTATION] Auditing agent: ${audit.agentId} (Change: ${audit.change})`);
        // Update Accuracy Score
        score.accuracyScore = Math.max(0, Math.min(1.0, score.accuracyScore + audit.change));
        score.tasksCompleted += 1;
        score.lastActivity = audit.timestamp;
        // Append to History
        reputation.history.push(audit);
        reputation.lastUpdate = Date.now();
        this.saveReputation(reputation);
        console.log(`[REPUTATION] Audit complete. New Accuracy for ${audit.agentId}: ${score.accuracyScore}`);
    }
    getReputation() {
        return JSON.parse(fs_1.default.readFileSync(this.reputationPath, 'utf-8'));
    }
    initializeAgent(agentId) {
        return {
            tasksCompleted: 0,
            totalVUEarned: 0,
            averageLatencyMs: 0,
            accuracyScore: 1.0,
            lastActivity: Date.now()
        };
    }
    saveReputation(reputation) {
        fs_1.default.writeFileSync(this.reputationPath, JSON.stringify(reputation, null, 2));
    }
}
exports.ReputationEngine = ReputationEngine;
