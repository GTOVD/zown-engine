"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionRelay = void 0;
const transport_http_1 = require("./transport-http");
/**
 * Zown Nexus Transaction Relay
 *
 * Handles the propagation of transaction signals across the distributed network.
 */
class TransactionRelay {
    httpTransport;
    registry;
    constructor(registry) {
        this.httpTransport = new transport_http_1.HttpTransport();
        this.registry = registry;
    }
    /**
     * Relays a signed transaction to the recipient's remote hub.
     */
    async relayTransaction(transaction) {
        const recipient = this.registry.agents[transaction.to];
        if (!recipient?.endpointUri) {
            console.log(`[RELAY] Local transaction detected for ${transaction.to}. No relay required.`);
            return true;
        }
        console.log(`[RELAY] Forwarding transaction ${transaction.id} to remote hub: ${recipient.endpointUri}`);
        // Create the settlement signal
        const signal = {
            jsonrpc: "2.0",
            id: Date.now(),
            method: "task.settle.receive",
            params: {
                transaction
            },
            meta: {
                sender: transaction.from,
                recipient: transaction.to,
                timestamp: Date.now(),
                signature: transaction.signature // Pass-through the original authorization
            }
        };
        return await this.httpTransport.deliver(recipient.endpointUri, signal);
    }
}
exports.TransactionRelay = TransactionRelay;
