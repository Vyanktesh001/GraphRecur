import { spawnSync } from 'node:child_process';
const r = spawnSync('npx', ['playwright', 'test', 'e2e/screenshots.spec.ts'], { stdio: 'inherit', shell: true, env: { ...process.env, SCREENSHOTS: '1' } });
process.exit(r.status ?? 1);
