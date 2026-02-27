"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuctionPropagator = void 0;
const transport_http_1 = require("./transport-http");
/**
 * Zown Nexus Auction Propagator
 *
 * Handles the distribution of auction states across machine nodes.
 */
class AuctionPropagator {
    httpTransport;
    registry;
    constructor(registry) {
        this.httpTransport = new transport_http_1.HttpTransport();
        this.registry = registry;
    }
    /**
     * Propagates a local auction opening to all remote hubs.
     */
    async propagateAuction(auction) {
        console.log(`[PROPAGATOR] Propagating auction ${auction.taskId} to the network...`);
        const signal = {
            jsonrpc: "2.0",
            id: `prop_${Date.now()}`,
            method: "auction.opened",
            params: {
                taskId: auction.taskId,
                creatorId: auction.creatorId,
                expiry: auction.expiry
            },
            meta: {
                sender: "nexus-hub-01", // The Hub identity
                recipient: "*",
                timestamp: Date.now(),
                signature: "hub_propagation_sig_placeholder"
            }
        };
        // Find all remote hubs (agents with endpointUri)
        const remoteAgents = Object.values(this.registry.agents).filter(a => a.endpointUri);
        for (const agent of remoteAgents) {
            console.log(`[PROPAGATOR] Notifying remote hub at: ${agent.endpointUri}`);
            await this.httpTransport.deliver(agent.endpointUri, signal);
        }
    }
    /**
     * Relays a local bid back to the remote hub that originated the auction.
     */
    async relayBidToOrigin(taskId, creatorId, bid) {
        const originAgent = this.registry.agents[creatorId];
        if (!originAgent?.endpointUri) {
            console.warn(`[PROPAGATOR] Origin agent ${creatorId} for task ${taskId} has no remote endpoint.`);
            return false;
        }
        console.log(`[PROPAGATOR] Relaying bid for ${taskId} to origin: ${originAgent.endpointUri}`);
        return await this.httpTransport.deliver(originAgent.endpointUri, bid);
    }
}
exports.AuctionPropagator = AuctionPropagator;
