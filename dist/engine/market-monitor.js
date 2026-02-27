"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketMonitor = void 0;
/**
 * Zown Nexus Market Monitor
 *
 * Tracks active auctions discovered across the network.
 */
class MarketMonitor {
    networkAuctions = new Map();
    /**
     * Records an auction discovered via a network broadcast.
     */
    trackRemoteAuction(taskId, creatorId, expiry) {
        const auction = {
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
    getActiveAuctions() {
        const now = Date.now();
        return Array.from(this.networkAuctions.values())
            .filter(a => a.status === "OPEN" && a.expiry > now);
    }
    /**
     * Checks if an auction exists in the monitor.
     */
    getAuction(taskId) {
        return this.networkAuctions.get(taskId);
    }
}
exports.MarketMonitor = MarketMonitor;
