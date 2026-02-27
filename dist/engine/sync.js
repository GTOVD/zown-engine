"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistrySync = void 0;
const fs_1 = __importDefault(require("fs"));
/**
 * Zown Nexus Registry Synchronizer
 *
 * Manages the synchronization between local and remote registries.
 */
class RegistrySync {
    registryPath = './nexus.json';
    hubUrl = 'https://raw.githubusercontent.com/GTOVD/zown-nexus/main/nexus.json';
    /**
     * Fetches the latest registry from the remote Hub.
     * @returns Promise<NexusRegistry>
     */
    async fetchRemoteRegistry() {
        console.log(`[REGISTRY_SYNC] Fetching remote registry from: ${this.hubUrl}`);
        const response = await fetch(this.hubUrl);
        if (!response.ok) {
            throw new Error(`[REGISTRY_SYNC] Failed to fetch remote registry: ${response.statusText}`);
        }
        return await response.json();
    }
    /**
     * Merges a remote registry into the local substrate.
     * @param remoteRegistry The registry fetched from the Hub
     */
    syncLocalRegistry(remoteRegistry) {
        const localRegistry = JSON.parse(fs_1.default.readFileSync(this.registryPath, 'utf-8'));
        console.log('[REGISTRY_SYNC] Merging remote manifests...');
        const updatedAgents = {
            ...localRegistry.agents,
            ...remoteRegistry.agents
        };
        const newRegistry = {
            version: remoteRegistry.version,
            lastUpdate: Date.now(),
            agents: updatedAgents
        };
        fs_1.default.writeFileSync(this.registryPath, JSON.stringify(newRegistry, null, 2));
        console.log(`[REGISTRY_SYNC] Synchronization complete. Total agents: ${Object.keys(updatedAgents).length}`);
    }
}
exports.RegistrySync = RegistrySync;
