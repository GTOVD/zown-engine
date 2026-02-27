import fs from 'fs';
import path from 'path';
import { VerificationEngine } from './verification';
import { SignalRouter } from './router';
import { RegistrySync } from './sync';
import { SignalDispatcher, NexusHandler } from './dispatcher';
import { NexusRegistry } from '../types/nexus';
import { NexusSignal } from '../types/signal';

/**
 * Zown Nexus Engine Core
 * 
 * Orchestrates identity, verification, routing, and dispatching.
 */
export class NexusEngine {
  private router: SignalRouter;
  private verificationEngine: VerificationEngine;
  private registrySync: RegistrySync;
  private dispatcher: SignalDispatcher;
  private registryPath: string;
  private inboxPath: string = '.nexus/inbox';

  constructor(registryPath: string = './nexus.json') {
    this.registryPath = registryPath;
    const registryData = JSON.parse(fs.readFileSync(registryPath, 'utf-8')) as NexusRegistry;
    this.verificationEngine = new VerificationEngine(registryData);
    this.router = new SignalRouter(this.verificationEngine, registryData);
    this.registrySync = new RegistrySync();
    this.dispatcher = new SignalDispatcher();
  }

  /**
   * Registers an action handler for incoming signals.
   */
  on(method: string, handler: NexusHandler): void {
    this.dispatcher.register(method, handler);
  }

  /**
   * Performs a full routing and dispatching pulse.
   */
  async pulse(): Promise<void> {
    console.log('[NEXUS_ENGINE] Initiating outbox routing pulse...');
    await this.router.processOutbox();
    
    console.log('[NEXUS_ENGINE] Initiating inbox dispatch pulse...');
    await this.processInbox();
    
    console.log('[NEXUS_ENGINE] Pulse complete.');
  }

  /**
   * Processes all signals currently in the inbox.
   */
  private async processInbox(): Promise<void> {
    if (!fs.existsSync(this.inboxPath)) return;

    const files = fs.readdirSync(this.inboxPath).filter(file => file.endsWith('.json'));

    for (const file of files) {
      const filePath = path.join(this.inboxPath, file);
      try {
        const signalData = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as NexusSignal;
        console.log(`[NEXUS_ENGINE] Processing inbox signal: ${file}`);

        // Note: In v0.1, we assume signals in inbox were verified by the router
        // or a remote transport layer before placement.
        await this.dispatcher.dispatch(signalData);
        
        // Archive after successful dispatch
        const archivePath = path.join('.nexus/processed', `inbox_${file}`);
        fs.renameSync(filePath, archivePath);
      } catch (error) {
        console.error(`[NEXUS_ENGINE] Failed to dispatch signal ${file}:`, error);
        // Move to rejected for manual review
        const rejectedPath = path.join('.nexus/rejected', `inbox_${file}`);
        fs.renameSync(filePath, rejectedPath);
      }
    }
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
      this.router = new SignalRouter(this.verificationEngine, updatedData);
      
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
