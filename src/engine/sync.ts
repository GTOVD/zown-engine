import fs from 'fs';
import { NexusRegistry } from '../types/nexus';

/**
 * Zown Nexus Registry Synchronizer
 * 
 * Manages the synchronization between local and remote registries.
 */
export class RegistrySync {
  private registryPath: string = './nexus.json';
  private hubUrl: string = 'https://raw.githubusercontent.com/GTOVD/zown-nexus/main/nexus.json';

  /**
   * Fetches the latest registry from the remote Hub.
   * @returns Promise<NexusRegistry>
   */
  async fetchRemoteRegistry(): Promise<NexusRegistry> {
    console.log(`[REGISTRY_SYNC] Fetching remote registry from: ${this.hubUrl}`);
    const response = await fetch(this.hubUrl);
    
    if (!response.ok) {
      throw new Error(`[REGISTRY_SYNC] Failed to fetch remote registry: ${response.statusText}`);
    }

    return await response.json() as NexusRegistry;
  }

  /**
   * Merges a remote registry into the local substrate.
   * @param remoteRegistry The registry fetched from the Hub
   */
  syncLocalRegistry(remoteRegistry: NexusRegistry): void {
    const localRegistry = JSON.parse(fs.readFileSync(this.registryPath, 'utf-8')) as NexusRegistry;
    
    console.log('[REGISTRY_SYNC] Merging remote manifests...');

    const updatedAgents = {
      ...localRegistry.agents,
      ...remoteRegistry.agents
    };

    const newRegistry: NexusRegistry = {
      version: remoteRegistry.version,
      lastUpdate: Date.now(),
      agents: updatedAgents
    };

    fs.writeFileSync(this.registryPath, JSON.stringify(newRegistry, null, 2));
    console.log(`[REGISTRY_SYNC] Synchronization complete. Total agents: ${Object.keys(updatedAgents).length}`);
  }
}
