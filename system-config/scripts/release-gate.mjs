import { spawn } from 'node:child_process';
import process from 'node:process';

const run = (cmd, args) => new Promise((resolve) => {
  const child = spawn(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  child.on('exit', code => resolve(code ?? 1));
});

const steps = [
  ['node', ['system-config/scripts/sync-config.mjs', '--auto-patch']],
  ['node', ['system-config/scripts/sync-config.mjs', '--validate']],
  ['node', ['system-config/scripts/sync-config.mjs', '--dry-run', '--strict-dry-run']],
  ['npx', ['tsc', '--noEmit']],
  ['npm', ['run', 'build']]
];

for (const [cmd, args] of steps) {
  console.log(`\n[GATE] ${cmd} ${args.join(' ')}`);
  const code = await run(cmd, args);
  if (code !== 0) {
    console.error('RELEASE GATE: FAILED');
    process.exit(1);
  }
}
console.log('RELEASE GATE: NOMINAL — all automated static/build gates passed. This is not a guarantee of runtime safety.');
