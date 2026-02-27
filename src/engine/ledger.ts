import fs from 'fs';
import { NexusLedger, NexusTransaction } from '../types/ledger';

/**
 * Zown Nexus Ledger Engine
 * 
 * Manages Value Unit balances and transaction history.
 */
export class LedgerEngine {
  private ledgerPath: string = './ledger.json';

  /**
   * Records a new transaction and updates balances.
   */
  settleTransaction(transaction: NexusTransaction): void {
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

  getLedger(): NexusLedger {
    return JSON.parse(fs.readFileSync(this.ledgerPath, 'utf-8')) as NexusLedger;
  }

  private saveLedger(ledger: NexusLedger): void {
    fs.writeFileSync(this.ledgerPath, JSON.stringify(ledger, null, 2));
  }
}
