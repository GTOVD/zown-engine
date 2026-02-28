"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NexusEngine = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const verification_1 = require("./verification");
const router_1 = require("./router");
const sync_1 = require("./sync");
const dispatcher_1 = require("./dispatcher");
const auction_1 = require("./auction");
const ledger_1 = require("./ledger");
const reputation_1 = require("./reputation");
const governance_1 = require("./governance");
const market_monitor_1 = require("./market-monitor");
const transaction_relay_1 = require("./transaction-relay");
const worker_1 = require("./worker");
const auction_propagator_1 = require("./auction-propagator");
/**
 * Zown Nexus Engine Core
 *
 * Orchestrates identity, verification, routing, dispatching, markets, economy, governance, and workers.
 */
class NexusEngine {
    router;
    verificationEngine;
    registrySync;
    dispatcher;
    auctionEngine;
    ledgerEngine;
    reputationEngine;
    governanceEngine;
    marketMonitor;
    transactionRelay;
    workerEngine;
    auctionPropagator;
    registryPath;
    inboxPath = '.nexus/inbox';
    constructor(registryPath = './nexus.json') {
        this.registryPath = registryPath;
        const registryData = JSON.parse(fs_1.default.readFileSync(registryPath, 'utf-8'));
        this.verificationEngine = new verification_1.VerificationEngine(registryData);
        this.router = new router_1.SignalRouter(this.verificationEngine, registryData);
        this.registrySync = new sync_1.RegistrySync();
        this.dispatcher = new dispatcher_1.SignalDispatcher();
        this.auctionEngine = new auction_1.AuctionEngine();
        this.ledgerEngine = new ledger_1.LedgerEngine();
        this.reputationEngine = new reputation_1.ReputationEngine();
        this.governanceEngine = new governance_1.GovernanceEngine(this.reputationEngine);
        this.marketMonitor = new market_monitor_1.MarketMonitor();
        this.transactionRelay = new transaction_relay_1.TransactionRelay(registryData);
        this.workerEngine = new worker_1.WorkerEngine();
        this.auctionPropagator = new auction_propagator_1.AuctionPropagator(registryData);
        // Register Default Market, Economy, Governance & Worker Handlers
        this.registerMarketHandlers();
        this.registerEconomyHandlers();
        this.registerNetworkHandlers();
        this.registerWorkerHandlers(registryData);
    }
    /**
     * Registers an action handler for incoming signals.
     */
    on(method, handler) {
        this.dispatcher.register(method, handler);
    }
    /**
     * Performs a full routing and dispatching pulse.
     */
    async pulse() {
        console.log('[NEXUS_ENGINE] Initiating outbox routing pulse...');
        await this.router.processOutbox();
        console.log('[NEXUS_ENGINE] Initiating inbox dispatch pulse...');
        await this.processInbox();
        console.log('[NEXUS_ENGINE] Pulse complete.');
    }
    /**
     * Synchronizes the local registry with the remote Hub.
     */
    async sync() {
        console.log('[NEXUS_ENGINE] Initiating registry synchronization...');
        try {
            const remoteRegistry = await this.registrySync.fetchRemoteRegistry();
            this.registrySync.syncLocalRegistry(remoteRegistry);
            // Refresh engines with new registry data
            const updatedData = JSON.parse(fs_1.default.readFileSync(this.registryPath, 'utf-8'));
            this.verificationEngine = new verification_1.VerificationEngine(updatedData);
            this.router = new router_1.SignalRouter(this.verificationEngine, updatedData);
            this.transactionRelay = new transaction_relay_1.TransactionRelay(updatedData);
            this.auctionPropagator = new auction_propagator_1.AuctionPropagator(updatedData);
            console.log('[NEXUS_ENGINE] Synchronization successful.');
        }
        catch (error) {
            console.error('[NEXUS_ENGINE] Synchronization failed:', error);
        }
    }
    /**
     * Starts the engine in watcher mode (periodically polls the outbox).
     * @param intervalMs Polling interval in milliseconds
     */
    watch(intervalMs = 5000) {
        console.log(`[NEXUS_ENGINE] Watcher mode active (interval: ${intervalMs}ms)`);
        setInterval(async () => {
            await this.pulse();
        }, intervalMs);
    }
    /**
     * Registers market-specific handlers for agentic bidding.
     */
    registerMarketHandlers() {
        this.on('task.bid', async (params, meta) => {
            const bid = {
                jsonrpc: "2.0",
                id: Date.now(), // Simplified for v0.1
                method: "task.bid",
                params: params,
                meta
            };
            // Check if task is local or remote
            const localAuction = this.auctionEngine.getAuction(params.taskId);
            if (localAuction) {
                return this.auctionEngine.submitBid(params.taskId, bid);
            }
            const remoteAuction = this.marketMonitor.getAuction(params.taskId);
            if (remoteAuction) {
                return await this.auctionPropagator.relayBidToOrigin(params.taskId, remoteAuction.creatorId, bid);
            }
            console.warn(`[NEXUS_ENGINE] Bid rejected: Unknown Task ID ${params.taskId}`);
            return false;
        });
        this.on('task.broadcast', async (params, meta) => {
            console.log(`[NEXUS_ENGINE] Task broadcast detected: ${params.taskId}. Opening auction.`);
            const auction = this.auctionEngine.createAuction(params.taskId, meta.sender);
            // Propagate auction to the rest of the network
            await this.auctionPropagator.propagateAuction(auction);
            return true;
        });
    }
    /**
     * Registers economy-specific handlers for settlement and governance triggers.
     */
    registerEconomyHandlers() {
        this.on('task.settle', async (params, meta) => {
            console.log(`[NEXUS_ENGINE] Local settlement request: ${params.taskId}`);
            const transaction = {
                id: `tx_${Date.now()}_${params.taskId}`,
                timestamp: Date.now(),
                from: meta.sender,
                to: params.to,
                amount: params.amount,
                taskId: params.taskId,
                signature: meta.signature
            };
            this.ledgerEngine.settleTransaction(transaction);
            // Relay to remote hub if recipient is non-local
            await this.transactionRelay.relayTransaction(transaction);
            // Trigger Governance Pulse (Automated Audit)
            await this.governanceEngine.performAudit(params.to, params.taskId, true);
            return true;
        });
        this.on('task.settle.receive', async (params, meta) => {
            console.log(`[NEXUS_ENGINE] Remote settlement received: ${params.transaction.id}`);
            // Record the inbound transaction in local ledger
            this.ledgerEngine.settleTransaction(params.transaction);
            return true;
        });
    }
    /**
     * Registers network-specific handlers for distributed auctions.
     */
    registerNetworkHandlers() {
        this.on('auction.opened', async (params, meta) => {
            console.log(`[NEXUS_ENGINE] Remote auction discovered: ${params.taskId}`);
            this.marketMonitor.trackRemoteAuction(params.taskId, meta.sender, params.expiry);
            return true;
        });
    }
    /**
     * Registers worker-specific handlers for autonomous process spawning.
     */
    registerWorkerHandlers(registry) {
        this.on('task.award', async (params, meta) => {
            console.log(`[NEXUS_ENGINE] Task ${params.taskId} awarded to agent: ${params.winningAgentId}`);
            const agent = registry.agents[params.winningAgentId];
            if (agent && agent.spawnCmd) {
                return this.workerEngine.spawnWorker(agent);
            }
            console.log(`[NEXUS_ENGINE] No local spawn required for agent: ${params.winningAgentId}`);
            return true;
        });
    }
    /**
     * Processes all signals currently in the inbox.
     */
    async processInbox() {
        if (!fs_1.default.existsSync(this.inboxPath))
            return;
        const files = fs_1.default.readdirSync(this.inboxPath).filter(file => file.endsWith('.json'));
        for (const file of files) {
            const filePath = path_1.default.join(this.inboxPath, file);
            try {
                const signalData = JSON.parse(fs_1.default.readFileSync(filePath, 'utf-8'));
                console.log(`[NEXUS_ENGINE] Processing inbox signal: ${file}`);
                // Note: In v0.1, we assume signals in inbox were verified by the router
                // or a remote transport layer before placement.
                await this.dispatcher.dispatch(signalData);
                // Archive after successful dispatch
                const archivePath = path_1.default.join('.nexus/processed', `inbox_${file}`);
                fs_1.default.renameSync(filePath, archivePath);
            }
            catch (error) {
                console.error(`[NEXUS_ENGINE] Failed to dispatch signal ${file}:`, error);
                // Move to rejected for manual review
                const rejectedPath = path_1.default.join('.nexus/rejected', `inbox_${file}`);
                fs_1.default.renameSync(filePath, rejectedPath);
            }
        }
    }
}
exports.NexusEngine = NexusEngine;
