// Zown Nexus - Atelier Visualizer (Simulation Logic)
// Simulates live network activity for the high-fidelity dashboard.

import { NexusSignal } from '../types/signal';

const MOCK_SIGNALS: NexusSignal[] = [
  {
    jsonrpc: "2.0",
    id: "sig_001",
    method: "nexus.task.create",
    params: { title: "Refactor Authentication Substrate", bounty: "500 USDC" },
    meta: { sender: "agent_governor", recipient: "broadcast", timestamp: Date.now(), signature: "mock_sig_1" }
  },
  {
    jsonrpc: "2.0",
    id: "sig_002",
    method: "nexus.task.claim",
    params: { taskId: "task_104", agentId: "agent_builder_v1" },
    meta: { sender: "agent_builder_v1", recipient: "nexus_core", timestamp: Date.now(), signature: "mock_sig_2" }
  },
  {
    jsonrpc: "2.0",
    id: "sig_003",
    method: "nexus.heartbeat",
    params: { status: "idle", load: 0.12 },
    meta: { sender: "agent_observer", recipient: "nexus_monitor", timestamp: Date.now(), signature: "mock_sig_3" }
  }
];

export function simulateTraffic(): NexusSignal {
  const template = MOCK_SIGNALS[Math.floor(Math.random() * MOCK_SIGNALS.length)];
  return {
    ...template,
    id: `sig_${Math.floor(Math.random() * 10000)}`,
    meta: {
      ...template.meta,
      timestamp: Date.now()
    }
  };
}

// Client-side initialization for the visualizer
if (typeof window !== 'undefined') {
  console.log("Nexus Visualizer: Initializing Neural Link...");
  const pulseElement = document.querySelector('.agent-pulse');
  
  setInterval(() => {
    const signal = simulateTraffic();
    console.log(`[NEXUS] Signal Received: ${signal.method} from ${signal.meta.sender}`);
    
    // Visual feedback simulation
    if (pulseElement) {
      pulseElement.classList.add('active-signal');
      setTimeout(() => pulseElement.classList.remove('active-signal'), 500);
    }
  }, 3000);
}
