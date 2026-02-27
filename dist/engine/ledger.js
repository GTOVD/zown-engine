"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LedgerEngine = void 0;
const fs_1 = __importDefault(require("fs"));
/**
 * Zown Nexus Ledger Engine
 *
 * Manages Value Unit balances and transaction history.
 */
class LedgerEngine {
    ledgerPath = './ledger.json';
    /**
     * Records a new transaction and updates balances.
     */
    settleTransaction(transaction) {
        const ledger = this.getLedger();
        console.log(`[LEDGER] Settling transfer: ${transaction.amount} VU from ${transaction.from} to ${transaction.to}`);
        // Update Balances
        ledger.balances[transaction.from] = (ledger.balances[transaction.from] || 0) - transaction.amount;
        ledger.balances[transaction.to] = (ledger.balances[transaction.to] || 0) + transaction.amount;
        // Append to History
        ledger.history.push(transaction);
        ledger.lastUpdate = Date.now();
        this.saveLedger(ledger);
        console.log(`[LEDGER] Transaction complete. New balance for ${transaction.to}: ${ledger.balances[transaction.to]} VU`);
    }
    getLedger() {
        return JSON.parse(fs_1.default.readFileSync(this.ledgerPath, 'utf-8'));
    }
    saveLedger(ledger) {
        fs_1.default.writeFileSync(this.ledgerPath, JSON.stringify(ledger, null, 2));
    }
}
exports.LedgerEngine = LedgerEngine;
