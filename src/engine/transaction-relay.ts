import { NexusTransaction } from '../types/ledger';
import { HttpTransport } from './transport-http';
import { NexusRegistry } from '../types/nexus';

/**
 * Zown Nexus Transaction Relay
 * 
 * Handles the propagation of transaction signals across the distributed network.
 */
export class TransactionRelay {
  private httpTransport: HttpTransport;
  private registry: NexusRegistry;

  constructor(registry: NexusRegistry) {
    this.httpTransport = new HttpTransport();
    this.registry = registry;
  }

  /**
   * Relays a signed transaction to the recipient's remote hub.
   */
  async relayTransaction(transaction: NexusTransaction): Promise<boolean> {
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

    return await this.httpTransport.deliver(recipient.endpointUri, signal as any);
  }
}
