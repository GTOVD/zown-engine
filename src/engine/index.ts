import fs from 'fs';
import path from 'path';
import { VerificationEngine } from './verification';
import { SignalRouter } from './router';
import { RegistrySync } from './sync';
import { SignalDispatcher, NexusHandler } from './dispatcher';
import { AuctionEngine } from './auction';
import { LedgerEngine } from './ledger';
import { ReputationEngine } from './reputation';
import { GovernanceEngine } from './governance';
import { MarketMonitor } from './market-monitor';
import { NexusRegistry } from '../types/nexus';
import { NexusSignal } from '../types/signal';
import { TaskBid } from '../types/market';
import { NexusTransaction } from '../types/ledger';

/**
 * Zown Nexus Engine Core
 * 
 * Orchestrates identity, verification, routing, dispatching, markets, economy, governance, and network scaling.
 */
export class NexusEngine {
  private router: SignalRouter;
  private verificationEngine: VerificationEngine;
  private registrySync: RegistrySync;
  private dispatcher: SignalDispatcher;
  private auctionEngine: AuctionEngine;
  private ledgerEngine: LedgerEngine;
  private reputationEngine: ReputationEngine;
  private governanceEngine: GovernanceEngine;
  private marketMonitor: MarketMonitor;
  private registryPath: string;
  private inboxPath: string = '.nexus/inbox';

  constructor(registryPath: string = './nexus.json') {
    this.registryPath = registryPath;
    const registryData = JSON.parse(fs.readFileSync(registryPath, 'utf-8')) as NexusRegistry;
    this.verificationEngine = new VerificationEngine(registryData);
    this.router = new SignalRouter(this.verificationEngine, registryData);
    this.registrySync = new RegistrySync();
    this.dispatcher = new SignalDispatcher();
    this.auctionEngine = new AuctionEngine();
    this.ledgerEngine = new LedgerEngine();
    this.reputationEngine = new ReputationEngine();
    this.governanceEngine = new GovernanceEngine(this.reputationEngine);
    this.marketMonitor = new MarketMonitor();

    // Register Default Market, Economy & Governance Handlers
    this.registerMarketHandlers();
    this.registerEconomyHandlers();
    this.registerNetworkHandlers();
  }

  /**
   * Registers network-specific handlers for distributed auctions.
   */
  private registerNetworkHandlers(): void {
    this.on('auction.opened', async (params, meta) => {
      console.log(`[NEXUS_ENGINE] Remote auction discovered: ${params.taskId}`);
      this.marketMonitor.trackRemoteAuction(params.taskId, meta.sender, params.expiry);
      return true;
    });
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

  /**
   * Registers market-specific handlers for agentic bidding.
   */
  private registerMarketHandlers(): void {
    this.on('task.bid', async (params, meta) => {
      const bid: TaskBid = {
        jsonrpc: "2.0",
        id: Date.now(), // Simplified for v0.1
        method: "task.bid",
        params: params as TaskBid['params'],
        meta
      };
      return this.auctionEngine.submitBid(params.taskId, bid);
    });

    this.on('task.broadcast', async (params, meta) => {
      console.log(`[NEXUS_ENGINE] Task broadcast detected: ${params.taskId}. Opening auction.`);
      return this.auctionEngine.createAuction(params.taskId, meta.sender);
    });
  }

  /**
   * Registers economy-specific handlers for settlement and governance triggers.
   */
  private registerEconomyHandlers(): void {
    this.on('task.settle', async (params, meta) => {
      console.log(`[NEXUS_ENGINE] Settlement requested for task: ${params.taskId}`);
      const transaction: NexusTransaction = {
        id: `tx_${Date.now()}_${params.taskId}`,
        timestamp: Date.now(),
        from: meta.sender,
        to: params.to,
        amount: params.amount,
        taskId: params.taskId,
        signature: meta.signature
      };
      
      this.ledgerEngine.settleTransaction(transaction);

      // Trigger Governance Pulse (Automated Audit)
      await this.governanceEngine.performAudit(params.to, params.taskId, true);
      
      return true;
    });
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
}
