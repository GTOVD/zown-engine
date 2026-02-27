"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationEngine = void 0;
const ed25519_1 = require("@noble/curves/ed25519");
const bs58_1 = __importDefault(require("bs58"));
/**
 * Zown Nexus Verification Engine
 *
 * Verifies the cryptographic integrity and identity of incoming signals.
 */
class VerificationEngine {
    registry;
    constructor(registry) {
        this.registry = registry;
    }
    /**
     * Verifies a signal's signature and identity.
     * @param signal The signal to verify
     * @returns Promise<boolean> True if verified, false otherwise
     */
    async verifySignal(signal) {
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
            const signatureBytes = bs58_1.default.decode(signal.meta.signature);
            const publicKeyBytes = bs58_1.default.decode(agent.publicKey);
            // 3. Perform Ed25519 verification
            const isValid = ed25519_1.ed25519.verify(signatureBytes, messageBytes, publicKeyBytes);
            if (!isValid) {
                console.error(`[VERIFICATION_FAILED] Cryptographic mismatch for agent: ${senderId}`);
                return false;
            }
            console.log(`[HANDSHAKE_SUCCESSFUL] Signal verified for ${senderId}`);
            return true;
        }
        catch (error) {
            console.error(`[VERIFICATION_ERROR] ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }
}
exports.VerificationEngine = VerificationEngine;
