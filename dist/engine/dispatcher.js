"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignalDispatcher = void 0;
/**
 * Zown Nexus Signal Dispatcher
 *
 * Manages the registration and execution of local action handlers.
 */
class SignalDispatcher {
    handlers = new Map();
    /**
     * Registers a handler for a specific JSON-RPC method.
     * @param method The signal method name (e.g., 'task.create')
     * @param handler The callback function to execute
     */
    register(method, handler) {
        console.log(`[DISPATCHER] Registering handler for method: ${method}`);
        this.handlers.set(method, handler);
    }
    /**
     * Dispatches a verified signal to its registered handler.
     * @param signal The verified signal to process
     */
    async dispatch(signal) {
        const handler = this.handlers.get(signal.method);
        if (!handler) {
            const errorMsg = `[DISPATCHER] No handler registered for method: ${signal.method}`;
            console.warn(errorMsg);
            throw new Error(errorMsg);
        }
        console.log(`[DISPATCHER] Executing handler for ${signal.method} (Signal ID: ${signal.id})`);
        return await handler(signal.params, signal.meta);
    }
}
exports.SignalDispatcher = SignalDispatcher;
