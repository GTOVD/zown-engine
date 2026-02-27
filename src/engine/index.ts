import fs from 'fs';
import { VerificationEngine } from './verification';
import { SignalRouter } from './router';
import { RegistrySync } from './sync';
import { NexusRegistry } from '../types/nexus';

/**
 * Zown Nexus Engine Core
 * 
 * Orchestrates identity, verification, and routing.
 */
export class NexusEngine {
  private router: SignalRouter;
  private verificationEngine: VerificationEngine;
  private registrySync: RegistrySync;
  private registryPath: string;

  constructor(registryPath: string = './nexus.json') {
    this.registryPath = registryPath;
    const registryData = JSON.parse(fs.readFileSync(registryPath, 'utf-8')) as NexusRegistry;
    this.verificationEngine = new VerificationEngine(registryData);
    this.router = new SignalRouter(this.verificationEngine);
    this.registrySync = new RegistrySync();
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
   * Synchronizes the local registry with the remote Hub.
   */
  async sync(): Promise<void> {
    console.log('[NEXUS_ENGINE] Initiating registry synchronization...');
    try {
      const remoteRegistry = await this.registrySync.fetchRemoteRegistry();
      this.registrySync.syncLocalRegistry(remoteRegistry);
      
      // Refresh engines with new registry data
      const updatedData = JSON.parse(fs.readFileSync(this.registryPath, 'utf-8')) as NexusRegistry;
      this.verificationEngine = new VerificationEngine(updatedData);
      this.router = new SignalRouter(this.verificationEngine);
      
      console.log('[NEXUS_ENGINE] Synchronization successful.');
    } catch (error) {
      console.error('[NEXUS_ENGINE] Synchronization failed:', error);
    }
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
