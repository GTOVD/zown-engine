import fs from 'fs';
import path from 'path';
import { VerificationEngine } from './verification';
import { NexusSignal } from '../types/signal';
import { NexusRegistry } from '../types/nexus';

/**
 * Zown Nexus Signal Router
 * 
 * Monitors the outbox and routes verified signals to their recipients.
 */
export class SignalRouter {
  private verificationEngine: VerificationEngine;
  private registry: NexusRegistry;
  private outboxPath: string = '.nexus/outbox';
  private inboxPath: string = '.nexus/inbox';
  private processedPath: string = '.nexus/processed';
  private rejectedPath: string = '.nexus/rejected';

  constructor(verificationEngine: VerificationEngine, registry: NexusRegistry) {
    this.verificationEngine = verificationEngine;
    this.registry = registry;
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

  /**
   * Routes a single signal to its recipient or broadcasts to all.
   */
  private routeSignal(fileName: string, signal: NexusSignal): void {
    const source = path.join(this.outboxPath, fileName);
    const archive = path.join(this.processedPath, fileName);

    if (signal.meta.recipient === '*') {
      this.broadcast(fileName, signal);
    } else {
      const destination = path.join(this.inboxPath, `${signal.meta.recipient}_${fileName}`);
      fs.copyFileSync(source, destination);
      console.log(`[ROUTER] Signal routed to ${signal.meta.recipient}`);
    }

    // Archive after all deliveries (or the single delivery)
    if (fs.existsSync(source)) {
      fs.renameSync(source, archive);
    }
  }

  /**
   * Broadcasts a signal to all registered agents.
   */
  private broadcast(fileName: string, signal: NexusSignal): void {
    const source = path.join(this.outboxPath, fileName);
    const agents = Object.keys(this.registry.agents);

    console.log(`[ROUTER] Initiating broadcast expansion for signal: ${fileName} to ${agents.length} agents.`);
    
    for (const agentId of agents) {
      // Skip broadcasting back to the sender
      if (agentId === signal.meta.sender) continue;

      const destination = path.join(this.inboxPath, `${agentId}_${fileName}`);
      fs.copyFileSync(source, destination);
      console.log(`[ROUTER] Broadcast delivered to agent: ${agentId}`);
    }
  }

  private rejectSignal(fileName: string): void {
    const source = path.join(this.outboxPath, fileName);
    const destination = path.join(this.rejectedPath, fileName);

    fs.renameSync(source, destination);
    console.warn(`[ROUTER] Signal rejected and quarantined: ${fileName}`);
  }
}
