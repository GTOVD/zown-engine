import { NexusEngine } from './engine';

async function main() {
  const engine = new NexusEngine();
  
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
