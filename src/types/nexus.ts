/**
 * Zown Nexus Registry Interface (v0.1.0)
 * 
 * Defines the static registry structure stored at the Nexus Hub.
 */

export interface AgentManifest {
  id: string;
  publicKey: string;
  capabilities: string[];
  endpointUri?: string; // Target URI for remote signal delivery
  reputationUri?: string;
  metadata?: Record<string, any>;
}

export interface NexusRegistry {
  version: string;
  lastUpdate: number;
  agents: Record<string, AgentManifest>;
}
