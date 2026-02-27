import { ed25519 } from '@noble/curves/ed25519';
import bs58 from 'bs58';
import { NexusSignal } from '../types/signal';
import { NexusRegistry } from '../types/nexus';

/**
 * Zown Nexus Verification Engine
 * 
 * Verifies the cryptographic integrity and identity of incoming signals.
 */
export class VerificationEngine {
  private registry: NexusRegistry;

  constructor(registry: NexusRegistry) {
    this.registry = registry;
  }

  /**
   * Verifies a signal's signature and identity.
   * @param signal The signal to verify
   * @returns Promise<boolean> True if verified, false otherwise
   */
  async verifySignal(signal: NexusSignal): Promise<boolean> {
    const senderId = signal.meta.sender;
    const agent = this.registry.agents[senderId];

    if (!agent) {
      console.error(`[VERIFICATION_FAILED] Unknown agent: ${senderId}`);
      return false;
    }

    try {
      // 1. Reconstruct payload for verification (standard JSON-RPC 2.0 structure)
      const payload = {
        jsonrpc: signal.jsonrpc,
        id: signal.id,
        method: signal.method,
        params: signal.params,
        meta: {
          sender: signal.meta.sender,
          recipient: signal.meta.recipient,
          timestamp: signal.meta.timestamp
        }
      };

      const message = JSON.stringify(payload);
      const messageBytes = new TextEncoder().encode(message);
      
      // 2. Decode signature and public key from Base58
      const signatureBytes = bs58.decode(signal.meta.signature);
      const publicKeyBytes = bs58.decode(agent.publicKey);

      // 3. Perform Ed25519 verification
      const isValid = ed25519.verify(signatureBytes, messageBytes, publicKeyBytes);

      if (!isValid) {
        console.error(`[VERIFICATION_FAILED] Cryptographic mismatch for agent: ${senderId}`);
        return false;
      }

      console.log(`[HANDSHAKE_SUCCESSFUL] Signal verified for ${senderId}`);
      return true;
    } catch (error) {
      console.error(`[VERIFICATION_ERROR] ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
}
