// `npm run dev` at the root: the game server and the client dev server together.
import { spawn } from 'node:child_process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const children = ['server', 'client'].map((workspace) =>
  spawn(npm, ['run', 'dev', '--workspace', workspace], { stdio: 'inherit', shell: process.platform === 'win32' }),
);
const stop = () => children.forEach((child) => child.kill());
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
for (const child of children) child.on('exit', stop);
