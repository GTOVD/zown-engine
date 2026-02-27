import { NexusEngine } from './engine';

async function main() {
  const engine = new NexusEngine();
  
  // Check for sync command
  if (process.argv.includes('sync')) {
    await engine.sync();
    return;
  }

  // Check for --watch flag
  if (process.argv.includes('--watch')) {
    engine.watch();
  } else {
    await engine.pulse();
  }
}

main().catch(error => {
  console.error('[NEXUS_CLI] Fatal error:', error);
  process.exit(1);
});
