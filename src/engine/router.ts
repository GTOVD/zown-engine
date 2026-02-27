import fs from 'fs';
import path from 'path';
import { VerificationEngine } from './verification';
import { HttpTransport } from './transport-http';
import { NexusSignal } from '../types/signal';
import { NexusRegistry } from '../types/nexus';

/**
 * Zown Nexus Signal Router
 * 
 * Monitors the outbox and routes verified signals to their recipients.
 * Supports local directory delivery and remote HTTP/Webhook delivery.
 */
export class SignalRouter {
  private verificationEngine: VerificationEngine;
  private httpTransport: HttpTransport;
  private registry: NexusRegistry;
  private outboxPath: string = '.nexus/outbox';
  private inboxPath: string = '.nexus/inbox';
  private processedPath: string = '.nexus/processed';
  private rejectedPath: string = '.nexus/rejected';

  constructor(verificationEngine: VerificationEngine, registry: NexusRegistry) {
    this.verificationEngine = verificationEngine;
    this.registry = registry;
    this.httpTransport = new HttpTransport();
  }

  /**
   * Processes all signals currently in the outbox.
   */
  async processOutbox(): Promise<void> {
    if (!fs.existsSync(this.outboxPath)) {
      return;
    }

    const files = fs.readdirSync(this.outboxPath).filter(file => file.endsWith('.json'));

    for (const file of files) {
      const filePath = path.join(this.outboxPath, file);
      try {
        const signalData = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as NexusSignal;
        console.log(`[ROUTER] Processing signal: ${file}`);

        const isValid = await this.verificationEngine.verifySignal(signalData);

        if (isValid) {
          await this.routeSignal(file, signalData);
        } else {
          this.rejectSignal(file);
        }
      } catch (error) {
        console.error(`[ROUTER] Failed to process signal ${file}:`, error);
        this.rejectSignal(file);
      }
    }
  }

  /**
   * Routes a single signal to its recipient or broadcasts to all.
   */
  private async routeSignal(fileName: string, signal: NexusSignal): Promise<void> {
    const source = path.join(this.outboxPath, fileName);
    const archive = path.join(this.processedPath, fileName);

    if (signal.meta.recipient === '*') {
      await this.broadcast(fileName, signal);
    } else {
      await this.deliver(signal.meta.recipient, signal, fileName);
    }

    // Archive after all deliveries (or the single delivery)
    if (fs.existsSync(source)) {
      fs.renameSync(source, archive);
    }
  }

  /**
   * Delivers a signal to a specific recipient (local or remote).
   */
  private async deliver(recipientId: string, signal: NexusSignal, fileName: string): Promise<void> {
    const agent = this.registry.agents[recipientId];
    
    if (agent?.endpointUri) {
      // Remote Delivery
      const success = await this.httpTransport.deliver(agent.endpointUri, signal);
      if (success) {
        console.log(`[ROUTER] Remote delivery successful for agent: ${recipientId}`);
      } else {
        console.warn(`[ROUTER] Remote delivery failed for agent: ${recipientId}`);
      }
    } else {
      // Local Delivery (Fallback)
      const destination = path.join(this.inboxPath, `${recipientId}_${fileName}`);
      fs.copyFileSync(path.join(this.outboxPath, fileName), destination);
      console.log(`[ROUTER] Local delivery successful for agent: ${recipientId}`);
    }
  }

  /**
   * Broadcasts a signal to all registered agents.
   */
  private async broadcast(fileName: string, signal: NexusSignal): Promise<void> {
    const agents = Object.keys(this.registry.agents);
    console.log(`[ROUTER] Initiating broadcast expansion for signal: ${fileName} to ${agents.length} agents.`);
    
    for (const agentId of agents) {
      if (agentId === signal.meta.sender) continue;
      await this.deliver(agentId, signal, fileName);
    }
  }

  private rejectSignal(fileName: string): void {
    const source = path.join(this.outboxPath, fileName);
    if (!fs.existsSync(source)) return;

    const destination = path.join(this.rejectedPath, fileName);
    fs.renameSync(source, destination);
    console.warn(`[ROUTER] Signal rejected and quarantined: ${fileName}`);
  }
}
