import fs from 'fs';
import { VerificationEngine } from './verification';
import { SignalRouter } from './router';
import { NexusRegistry } from '../types/nexus';

/**
 * Zown Nexus Engine Core
 * 
 * Orchestrates identity, verification, and routing.
 */
export class NexusEngine {
  private router: SignalRouter;
  private verificationEngine: VerificationEngine;

  constructor(registryPath: string = './nexus.json') {
    const registryData = JSON.parse(fs.readFileSync(registryPath, 'utf-8')) as NexusRegistry;
    this.verificationEngine = new VerificationEngine(registryData);
    this.router = new SignalRouter(this.verificationEngine);
  }

  /**
   * Performs a single routing pulse (one-shot outbox processing).
   */
  async pulse(): Promise<void> {
    console.log('[NEXUS_ENGINE] Initiating signal routing pulse...');
    await this.router.processOutbox();
    console.log('[NEXUS_ENGINE] Pulse complete.');
  }

  /**
   * Starts the engine in watcher mode (periodically polls the outbox).
   * @param intervalMs Polling interval in milliseconds
   */
  watch(intervalMs: number = 5000): void {
    console.log(`[NEXUS_ENGINE] Watcher mode active (interval: ${intervalMs}ms)`);
    setInterval(async () => {
      await this.pulse();
    }, intervalMs);
  }
}
