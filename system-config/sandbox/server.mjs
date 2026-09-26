import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import { watch as watchFile } from 'node:fs';
import WebSocket, { WebSocketServer } from 'ws';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const SOT = path.join(ROOT, 'system-config/system.config.json');
let config = await loadConfig();
const PORT = config.runtime.sandbox.port;
const HOST = config.runtime.sandbox.host;
const telemetry = [];
const clients = new Set();
let lastGate = { status: 'IDLE', progress: 0, message: 'Sandbox ready' };
let running = false;
let debounceTimer = null;

async function loadConfig() {
  return JSON.parse(await fs.readFile(SOT, 'utf8'));
}

function push(event, payload = {}) {
  const item = { ts: new Date().toISOString(), event, ...payload };
  telemetry.push(item);
  while (telemetry.length > 250) telemetry.shift();
  const text = JSON.stringify(item);
  for (const ws of clients) if (ws.readyState === WebSocket.OPEN) ws.send(text);
}

function runNode(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, { cwd: ROOT, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', d => output += d.toString());
    child.stderr.on('data', d => output += d.toString());
    child.on('close', code => resolve({ code: code ?? 1, output }));
  });
}

async function gate({ autoPatch = false, sync = false, reason = 'manual' } = {}) {
  if (running) return { ok: false, busy: true };
  running = true;
  try {
    config = await loadConfig();
    lastGate = { status: 'RUNNING', progress: 5, message: 'Starting isolated validation gate' };
    push('GATE_STARTED', { autoPatch, sync, reason, version: config.app.version });

    const steps = [];
    if (autoPatch) {
      const r = await runNode(['system-config/scripts/sync-config.mjs', '--auto-patch']);
      steps.push({ name: 'auto-patch', ...r });
      push('AUTO_PATCH', { ok: r.code === 0, output: r.output.slice(-3000) });
      if (r.code !== 0) return finish(false, steps, 'Auto-patch failed');
      config = await loadConfig();
    }

    lastGate = { status: 'RUNNING', progress: 35, message: 'Validating source of truth' };
    const valid = await runNode(['system-config/scripts/sync-config.mjs', '--validate']);
    steps.push({ name: 'validate', ...valid });
    push('VALIDATION', { ok: valid.code === 0, output: valid.output.slice(-3000) });
    if (valid.code !== 0) return finish(false, steps, 'Configuration validation failed');

    if (sync) {
      lastGate = { status: 'RUNNING', progress: 48, message: 'Staging synchronized configuration locally' };
      const staged = await runNode(['system-config/scripts/sync-config.mjs', '--sync']);
      steps.push({ name: 'sync-stage', ...staged });
      push('SYNC_STAGED', { ok: staged.code === 0, output: staged.output.slice(-3000) });
      if (staged.code !== 0) return finish(false, steps, 'Configuration staging failed');
      config = await loadConfig();
    }

    lastGate = { status: 'RUNNING', progress: 60, message: 'Running strict configuration dry-run' };
    const dry = await runNode(['system-config/scripts/sync-config.mjs', '--dry-run', '--strict-dry-run']);
    steps.push({ name: 'dry-run', ...dry });
    push('DRY_RUN', { ok: dry.code === 0, output: dry.output.slice(-3000) });
    if (dry.code !== 0) return finish(false, steps, 'Managed configuration drift detected');

    lastGate = { status: 'RUNNING', progress: 85, message: 'Running TypeScript/build gate' };
    const gateResult = await runNode(['system-config/scripts/release-gate.mjs']);
    steps.push({ name: 'release-gate', ...gateResult });
    push('BUILD_GATE', { ok: gateResult.code === 0, output: gateResult.output.slice(-4000) });
    if (gateResult.code !== 0) return finish(false, steps, 'Static/build gate failed');

    config = await loadConfig();
    lastGate = { status: 'NOMINAL', progress: 100, message: 'All automated static/build checks passed' };
    push('GATE_NOMINAL', { progress: 100, message: lastGate.message });
    if (sync) {
      const platforms = Object.entries(config.platforms).filter(([, v]) => v.enabled).map(([k]) => k);
      push(config.sync.broadcastEvent, { version: config.app.version, platforms });
    }
    return { ok: true, steps };
  } finally {
    running = false;
  }
}

function finish(ok, steps, message) {
  lastGate = { status: 'FAILED', progress: 100, message };
  push('GATE_FAILED', { steps, message });
  return { ok, steps };
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: lastGate.status !== 'FAILED', status: lastGate.status, gate: lastGate, clients: clients.size, running, version: config.app.version }));
    return;
  }
  res.writeHead(404);
  res.end('Not found');
});

const wss = new WebSocketServer({ server, path: config.runtime.sandbox.wsPath });
wss.on('connection', (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ ts: new Date().toISOString(), event: 'SANDBOX_CONNECTED', gate: lastGate, version: config.app.version }));
  ws.send(JSON.stringify({ ts: new Date().toISOString(), event: 'TELEMETRY_SNAPSHOT', items: telemetry.slice(-50) }));
  ws.on('message', async raw => {
    let message;
    try { message = JSON.parse(raw.toString()); } catch { ws.send(JSON.stringify({ event: 'ERROR', message: 'Invalid JSON' })); return; }
    if (message.command === 'status') {
      ws.send(JSON.stringify({ event: 'STATUS', gate: lastGate, clients: clients.size, version: config.app.version }));
      return;
    }
    if (message.command === 'dry-run') await gate({ reason: 'remote-dry-run' });
    else if (message.command === 'auto-patch') await gate({ autoPatch: true, reason: 'remote-auto-patch' });
    else if (message.command === 'sync') await gate({ autoPatch: true, sync: true, reason: 'remote-sync' });
    else ws.send(JSON.stringify({ event: 'ERROR', message: 'Unknown command' }));
  });
  ws.on('close', () => clients.delete(ws));
});

if (process.argv.includes('--watch')) {
  let lastMtime = 0;
  watchFile(SOT, { persistent: true }, async (_event, stat) => {
    if (!stat?.mtimeMs || stat.mtimeMs === lastMtime) return;
    lastMtime = stat.mtimeMs;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      push('SOT_CHANGED', { file: 'system-config/system.config.json' });
      const result = await gate({ autoPatch: true, sync: true, reason: 'source-of-truth-change' });
      if (!result.ok) push('AUTO_SYNC_BLOCKED', { reason: 'NOMINAL gate not reached' });
    }, 250);
  });
}

server.listen(PORT, HOST, () => {
  console.log(`System WebSocket Sandbox listening on ws://${HOST}:${PORT}${config.runtime.sandbox.wsPath}`);
  push('SANDBOX_READY', { host: HOST, port: PORT, wsPath: config.runtime.sandbox.wsPath, version: config.app.version, watch: process.argv.includes('--watch') });
});
