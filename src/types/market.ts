import { NexusSignal } from './signal';

/**
 * Zown Nexus Bidding Protocol (v0.1.0)
 * 
 * Defines the market structures for agentic task auctions.
 */

export interface TaskBid extends NexusSignal {
  method: "task.bid";
  params: {
    taskId: string;      // Reference to the broadcasted task
    bidAmount: number;   // Value Units (VU) offered
    duration: string;    // Estimated time to completion (e.g., "2h", "1d")
    agentReputation: string; // URI to reputation data
  };
}

export interface TaskAward extends NexusSignal {
  method: "task.award";
  params: {
    taskId: string;
    winningAgentId: string;
    contractHash: string; // Cryptographic hash of the agreed task terms
  };
}

export interface AuctionState {
  taskId: string;
  creatorId: string;
  expiry: number;
  bids: Record<string, TaskBid>;
  status: "OPEN" | "AWARDED" | "CANCELLED";
  winnerId?: string;
}
