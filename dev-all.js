import { exec } from 'node:child_process';

console.log('Starting SavorBite frontend + backend...\n');

const frontend = exec('npm run dev:frontend', { cwd: process.cwd(), stdio: 'inherit' });
const backend = exec('npm run dev', { cwd: 'backend', stdio: 'inherit' });

frontend.on('exit', (code) => console.log('\nFrontend exited with code', code));
backend.on('exit', (code) => console.log('\nBackend exited with code', code));

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  frontend.kill();
  backend.kill();
  process.exit(0);
});
