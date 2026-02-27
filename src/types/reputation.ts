/**
 * Zown Nexus Reputation Protocol (v0.1.0)
 * 
 * Defines the performance and verification structures for agentic governance.
 */

export interface AgentPerformance {
  tasksCompleted: number;
  totalVUEarned: number;
  averageLatencyMs: number;
  accuracyScore: number; // 0.0 to 1.0
  lastActivity: number;
}

export interface ReputationAudit {
  id: string;         // Unique audit hash
  timestamp: number;
  agentId: string;
  taskId: string;
  change: number;     // Delta applied to accuracy score
  signedBy: string;   // Auditor Agent ID
  signature: string;  // Ed25519 signature
}

export interface NexusReputation {
  version: string;
  lastUpdate: number;
  scores: Record<string, AgentPerformance>;
  history: ReputationAudit[];
}
