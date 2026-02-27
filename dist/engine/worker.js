"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerEngine = void 0;
const child_process_1 = require("child_process");
/**
 * Zown Nexus Worker Engine
 *
 * Manages the lifecycle of elastic agent workers.
 */
class WorkerEngine {
    activeWorkers = new Map(); // AgentID -> ProcessID
    /**
     * Spawns a new worker process based on an agent manifest.
     */
    spawnWorker(agent) {
        if (!agent.spawnCmd) {
            console.warn(`[WORKER] No spawn command defined for agent: ${agent.id}`);
            return false;
        }
        console.log(`[WORKER] Launching elastic worker: ${agent.id}...`);
        try {
            const child = (0, child_process_1.spawn)(agent.spawnCmd, {
                shell: true,
                detached: true,
                stdio: 'inherit'
            });
            if (child.pid) {
                this.activeWorkers.set(agent.id, child.pid);
                console.log(`[WORKER] Worker ${agent.id} active (PID: ${child.pid}).`);
                return true;
            }
            return false;
        }
        catch (error) {
            console.error(`[WORKER] Spawn failure for ${agent.id}:`, error);
            return false;
        }
    }
    /**
     * Checks if a worker is currently active.
     */
    isWorkerActive(agentId) {
        const pid = this.activeWorkers.get(agentId);
        if (!pid)
            return false;
        try {
            // Check if process is still running
            process.kill(pid, 0);
            return true;
        }
        catch (e) {
            this.activeWorkers.delete(agentId);
            return false;
        }
    }
}
exports.WorkerEngine = WorkerEngine;
