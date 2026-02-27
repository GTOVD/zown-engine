/**
 * Zown Nexus Ledger Protocol (v0.1.0)
 * 
 * Defines the transaction and balance structures for the agentic economy.
 */

export interface NexusTransaction {
  id: string;         // Unique transaction hash
  timestamp: number;
  from: string;       // Sender Agent ID
  to: string;         // Recipient Agent ID
  amount: number;     // Value Units (VU)
  taskId?: string;    // Associated Task ID
  signature: string;  // Ed25519 signature of the transaction payload
}

export interface NexusLedger {
  version: string;
  lastUpdate: number;
  balances: Record<string, number>; // Agent ID -> VU Balance
  history: NexusTransaction[];
}
