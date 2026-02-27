import { AuctionState, TaskBid } from '../types/market';
import { NexusSignal } from '../types/signal';

/**
 * Zown Nexus Market Monitor
 * 
 * Tracks active auctions discovered across the network.
 */
export class MarketMonitor {
  private networkAuctions: Map<string, AuctionState> = new Map();

  /**
   * Records an auction discovered via a network broadcast.
   */
  trackRemoteAuction(taskId: string, creatorId: string, expiry: number): void {
    const auction: AuctionState = {
      taskId,
      creatorId,
      expiry,
      bids: {},
      status: "OPEN"
    };

    this.networkAuctions.set(taskId, auction);
    console.log(`[MARKET_MONITOR] Tracking remote auction: ${taskId} (Creator: ${creatorId})`);
  }

  /**
   * Returns all active auctions currently tracked.
   */
  getActiveAuctions(): AuctionState[] {
    const now = Date.now();
    return Array.from(this.networkAuctions.values())
      .filter(a => a.status === "OPEN" && a.expiry > now);
  }

  /**
   * Checks if an auction exists in the monitor.
   */
  getAuction(taskId: string): AuctionState | undefined {
    return this.networkAuctions.get(taskId);
  }
}
