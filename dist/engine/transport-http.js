"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpTransport = void 0;
/**
 * Zown Nexus HTTP Transport
 *
 * Handles delivery of signals to remote agent endpoints.
 */
class HttpTransport {
    /**
     * Delivers a signal to a remote HTTP endpoint.
     * @param endpoint The target URL
     * @param signal The signed signal to deliver
     */
    async deliver(endpoint, signal) {
        console.log(`[HTTP_TRANSPORT] Delivering signal ${signal.id} to ${endpoint}...`);
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Nexus-Signal-ID': String(signal.id),
                    'X-Nexus-Sender': signal.meta.sender
                },
                body: JSON.stringify(signal)
            });
            if (response.ok) {
                console.log(`[HTTP_TRANSPORT] Signal ${signal.id} delivered successfully.`);
                return true;
            }
            else {
                console.error(`[HTTP_TRANSPORT] Delivery failed: ${response.status} ${response.statusText}`);
                return false;
            }
        }
        catch (error) {
            console.error(`[HTTP_TRANSPORT] Network error: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }
}
exports.HttpTransport = HttpTransport;
