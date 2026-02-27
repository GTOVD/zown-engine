import fs from 'fs';
import path from 'path';
import { VerificationEngine } from './verification';
import { NexusSignal } from '../types/signal';

/**
 * Zown Nexus Signal Router
 * 
 * Monitors the outbox and routes verified signals to their recipients.
 */
export class SignalRouter {
  private verificationEngine: VerificationEngine;
  private outboxPath: string = '.nexus/outbox';
  private inboxPath: string = '.nexus/inbox';
  private processedPath: string = '.nexus/processed';
  private rejectedPath: string = '.nexus/rejected';

  constructor(verificationEngine: VerificationEngine) {
    this.verificationEngine = verificationEngine;
  }

  /**
   * Processes all signals currently in the outbox.
   */
  async processOutbox(): Promise<void> {
    const files = fs.readdirSync(this.outboxPath).filter(file => file.endsWith('.json'));

    for (const file of files) {
      const filePath = path.join(this.outboxPath, file);
      const signalData = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as NexusSignal;

      console.log(`[ROUTER] Processing signal: ${file}`);

      const isValid = await this.verificationEngine.verifySignal(signalData);

      if (isValid) {
        this.routeSignal(file, signalData);
      } else {
        this.rejectSignal(file);
      }
    }
  }

  private routeSignal(fileName: string, signal: NexusSignal): void {
    const destination = path.join(this.inboxPath, fileName);
    const archive = path.join(this.processedPath, fileName);
    const source = path.join(this.outboxPath, fileName);

    // In a real P2P scenario, this would involve network transport.
    // For local v0.1, we simulate delivery by copying to the inbox.
    fs.copyFileSync(source, destination);
    fs.renameSync(source, archive);

    console.log(`[ROUTER] Signal routed to ${signal.meta.recipient} and archived.`);
  }

  private rejectSignal(fileName: string): void {
    const source = path.join(this.outboxPath, fileName);
    const destination = path.join(this.rejectedPath, fileName);

    fs.renameSync(source, destination);
    console.warn(`[ROUTER] Signal rejected and quarantined: ${fileName}`);
  }
}
