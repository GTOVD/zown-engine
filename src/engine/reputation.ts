import fs from 'fs';
import { NexusReputation, AgentPerformance, ReputationAudit } from '../types/reputation';

/**
 * Zown Nexus Reputation Engine
 * 
 * Tracks and verifies agent performance across the network.
 */
export class ReputationEngine {
  private reputationPath: string = './reputation.json';

  /**
   * Records a performance audit and updates agent scores.
   */
  applyAudit(audit: ReputationAudit): void {
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

  getReputation(): NexusReputation {
    return JSON.parse(fs.readFileSync(this.reputationPath, 'utf-8')) as NexusReputation;
  }

  private initializeAgent(agentId: string): AgentPerformance {
    return {
      tasksCompleted: 0,
      totalVUEarned: 0,
      averageLatencyMs: 0,
      accuracyScore: 1.0,
      lastActivity: Date.now()
    };
  }

  private saveReputation(reputation: NexusReputation): void {
    fs.writeFileSync(this.reputationPath, JSON.stringify(reputation, null, 2));
  }
}
