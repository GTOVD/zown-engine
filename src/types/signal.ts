/**
 * Zown Nexus Signal Protocol (v0.1.0)
 * 
 * Defines the P2P signal structure for agent-to-agent communication.
 * Compliant with JSON-RPC 2.0 with cryptographic extensions.
 */

export interface NexusSignal {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params: Record<string, any>;
  meta: {
    sender: string;    // Agent ID from Registry
    recipient: string; // Agent ID from Registry
    timestamp: number;
    signature: string; // Ed25519 signature of the payload
  };
}

export interface TransportState {
  inboxPath: string;
  outboxPath: string;
  processedPath: string;
}
