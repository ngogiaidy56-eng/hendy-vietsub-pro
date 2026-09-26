import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import { watch as watchFile } from 'node:fs';
import { isIP } from 'node:net';
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

const COMMANDS = new Set(['status', 'dry-run', 'auto-patch', 'sync']);

async function loadConfig() {
  return JSON.parse(await fs.readFile(SOT, 'utf8'));
}

export function isLoopbackHost(hostname) {
  if (typeof hostname !== 'string') return false;
  const host = hostname.toLowerCase();
  const addressHost = host.startsWith('[') && host.endsWith(']') ? host.slice(1, -1) : host;
  if (addressHost === 'localhost') return true;
  const address = isIP(addressHost);
  if (address === 4) return Number(addressHost.split('.')[0]) === 127;
  return address === 6 && addressHost === '::1';
}

export function validateAccess(req) {
  const hostHeader = req.headers.host;
  if (typeof hostHeader !== 'string') {
    return { code: 'HOST_NOT_ALLOWED', message: 'A loopback Host header is required' };
  }

  let hostUrl;
  try {
    hostUrl = new URL(`http://${hostHeader}`);
  } catch {
    return { code: 'HOST_NOT_ALLOWED', message: 'The Host header is invalid' };
  }
  if (hostUrl.username || hostUrl.password || hostUrl.pathname !== '/' || !isLoopbackHost(hostUrl.hostname)) {
    return { code: 'HOST_NOT_ALLOWED', message: 'Sandbox requests are limited to loopback hosts' };
  }

  const origin = req.headers.origin;
  if (origin === undefined) return null;
  if (typeof origin !== 'string') {
    return { code: 'ORIGIN_NOT_ALLOWED', message: 'The Origin header is invalid' };
  }

  let originUrl;
  try {
    originUrl = new URL(origin);
  } catch {
    return { code: 'ORIGIN_NOT_ALLOWED', message: 'The Origin header is invalid' };
  }
  if (
    !['http:', 'https:', 'capacitor:'].includes(originUrl.protocol) ||
    originUrl.username ||
    originUrl.password ||
    !['', '/'].includes(originUrl.pathname) ||
    originUrl.search ||
    originUrl.hash ||
    !isLoopbackHost(originUrl.hostname)
  ) {
    return { code: 'ORIGIN_NOT_ALLOWED', message: 'Sandbox access is limited to loopback origins' };
  }
  return null;
}

export function validateCommand(raw, isBinary = false) {
  if (isBinary) {
    return { ok: false, error: { code: 'INVALID_MESSAGE', message: 'Only text JSON messages are accepted' } };
  }

  let message;
  try {
    message = JSON.parse(raw.toString());
  } catch {
    return { ok: false, error: { code: 'INVALID_JSON', message: 'Message must contain valid JSON' } };
  }

  if (
    message === null ||
    typeof message !== 'object' ||
    Array.isArray(message) ||
    Object.keys(message).length !== 1 ||
    typeof message.command !== 'string'
  ) {
    return { ok: false, error: { code: 'INVALID_MESSAGE', message: 'Message must be an object containing only command' } };
  }
  if (!COMMANDS.has(message.command)) {
    return { ok: false, error: { code: 'UNKNOWN_COMMAND', message: 'Supported commands: status, dry-run, auto-patch, sync' } };
  }
  return { ok: true, command: message.command };
}

export function jsonError(code, message) {
  return { event: 'ERROR', ok: false, error: { code, message }, message };
}

function writeJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  res.end(JSON.stringify(payload));
}

export function createHttpServer(getHealth) {
  return http.createServer((req, res) => {
    const accessError = validateAccess(req);
    if (accessError) {
      writeJson(res, 403, { ok: false, error: accessError });
      return;
    }

    let pathname;
    try {
      pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
    } catch {
      writeJson(res, 400, { ok: false, error: { code: 'INVALID_URL', message: 'Request URL is invalid' } });
      return;
    }
    if (pathname !== '/health') {
      writeJson(res, 404, { ok: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
      return;
    }
    if (req.method !== 'GET') {
      writeJson(res, 405, { ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Use GET for the health endpoint' } });
      return;
    }
    writeJson(res, 200, getHealth());
  });
}

function rejectUpgrade(socket, statusCode, code, message) {
  const payload = JSON.stringify({ ok: false, error: { code, message } });
  const reason = statusCode === 404 ? 'Not Found' : 'Forbidden';
  socket.end(
    `HTTP/1.1 ${statusCode} ${reason}\r\n` +
    'Connection: close\r\n' +
    'Content-Type: application/json; charset=utf-8\r\n' +
    `Content-Length: ${Buffer.byteLength(payload)}\r\n` +
    'X-Content-Type-Options: nosniff\r\n' +
    '\r\n' +
    payload
  );
}

export function createWebSocketServer(server, wsPath) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 1024, perMessageDeflate: false });
  server.on('upgrade', (req, socket, head) => {
    const accessError = validateAccess(req);
    if (accessError) {
      rejectUpgrade(socket, 403, accessError.code, accessError.message);
      return;
    }

    let pathname;
    try {
      pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
    } catch {
      rejectUpgrade(socket, 404, 'NOT_FOUND', 'WebSocket route not found');
      return;
    }
    if (pathname !== wsPath) {
      rejectUpgrade(socket, 404, 'NOT_FOUND', 'WebSocket route not found');
      return;
    }

    wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req));
  });
  return wss;
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
    let settled = false;
    const finish = result => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    child.stdout.on('data', d => output += d.toString());
    child.stderr.on('data', d => output += d.toString());
    child.on('error', error => finish({ code: 1, output: `${output}${error.message}` }));
    child.on('close', code => finish({ code: code ?? 1, output }));
  });
}

async function gate({ autoPatch = false, sync = false, reason = 'manual' } = {}) {
  if (running) return { ok: false, busy: true };
  running = true;
  const steps = [];
  try {
    config = await loadConfig();
    lastGate = { status: 'RUNNING', progress: 5, message: 'Starting isolated validation gate' };
    push('GATE_STARTED', { autoPatch, sync, reason, version: config.app.version });

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
  } catch (error) {
    console.error('Sandbox gate failed unexpectedly:', error);
    return finish(false, steps, 'Sandbox gate failed unexpectedly');
  } finally {
    running = false;
  }
}

function finish(ok, steps, message) {
  lastGate = { status: 'FAILED', progress: 100, message };
  push('GATE_FAILED', { steps, message });
  return { ok, steps };
}

const server = createHttpServer(() => ({
  ok: lastGate.status !== 'FAILED',
  status: lastGate.status,
  gate: lastGate,
  clients: clients.size,
  running,
  version: config.app.version,
}));
const wss = createWebSocketServer(server, config.runtime.sandbox.wsPath);
wss.on('connection', (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ ts: new Date().toISOString(), event: 'SANDBOX_CONNECTED', gate: lastGate, version: config.app.version }));
  ws.send(JSON.stringify({ ts: new Date().toISOString(), event: 'TELEMETRY_SNAPSHOT', items: telemetry.slice(-50) }));
  ws.on('message', async (raw, isBinary) => {
    const parsed = validateCommand(raw, isBinary);
    if (!parsed.ok) {
      ws.send(JSON.stringify(jsonError(parsed.error.code, parsed.error.message)));
      return;
    }
    if (parsed.command === 'status') {
      ws.send(JSON.stringify({ event: 'STATUS', gate: lastGate, clients: clients.size, version: config.app.version }));
      return;
    }

    try {
      const options = parsed.command === 'dry-run'
        ? { reason: 'remote-dry-run' }
        : parsed.command === 'auto-patch'
          ? { autoPatch: true, reason: 'remote-auto-patch' }
          : { autoPatch: true, sync: true, reason: 'remote-sync' };
      const result = await gate(options);
      if (result.busy) {
        ws.send(JSON.stringify(jsonError('GATE_BUSY', 'A validation gate is already running')));
        return;
      }
      ws.send(JSON.stringify({ event: 'COMMAND_RESULT', command: parsed.command, ok: result.ok }));
    } catch (error) {
      console.error('Sandbox command failed:', error);
      ws.send(JSON.stringify(jsonError('COMMAND_FAILED', 'Sandbox command failed')));
    }
  });
  ws.on('close', () => clients.delete(ws));
});

function startWatch() {
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

export function assertLoopbackBind(host) {
  if (!isLoopbackHost(host)) {
    throw new Error(`Sandbox host must be a loopback address; received ${JSON.stringify(host)}`);
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  assertLoopbackBind(HOST);
  server.listen(PORT, HOST, () => {
    console.log(`System WebSocket Sandbox listening on ws://${HOST}:${PORT}${config.runtime.sandbox.wsPath}`);
    push('SANDBOX_READY', { host: HOST, port: PORT, wsPath: config.runtime.sandbox.wsPath, version: config.app.version, watch: process.argv.includes('--watch') });
  });
  if (process.argv.includes('--watch')) startWatch();
}
