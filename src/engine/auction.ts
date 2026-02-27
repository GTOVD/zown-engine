import { AuctionState, TaskBid } from '../types/market';

/**
 * Zown Nexus Auction Engine
 * 
 * Manages the state and logic for agentic task bidding.
 */
export class AuctionEngine {
  private auctions: Map<string, AuctionState> = new Map();

  /**
   * Initializes a new auction for a broadcasted task.
   */
  createAuction(taskId: string, creatorId: string, durationMs: number = 3600000): AuctionState {
    const auction: AuctionState = {
      taskId,
      creatorId,
      expiry: Date.now() + durationMs,
      bids: {},
      status: "OPEN"
    };
    
    this.auctions.set(taskId, auction);
    console.log(`[AUCTION] Market opened for task: ${taskId} (Expires: ${new Date(auction.expiry).toISOString()})`);
    return auction;
  }

  /**
   * Records a bid for an active auction.
   */
  submitBid(taskId: string, bid: TaskBid): boolean {
    const auction = this.auctions.get(taskId);

    if (!auction || auction.status !== "OPEN" || Date.now() > auction.expiry) {
      console.warn(`[AUCTION] Bid rejected: Task ${taskId} is not accepting bids.`);
      return false;
    }

    const bidderId = bid.meta.sender;
    auction.bids[bidderId] = bid;
    
    console.log(`[AUCTION] Bid received from ${bidderId} for task ${taskId}: ${bid.params.bidAmount} VU`);
    return true;
  }

  /**
   * Retrieves the current state of an auction.
   */
  getAuction(taskId: string): AuctionState | undefined {
    return this.auctions.get(taskId);
  }
}
