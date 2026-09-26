import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';
import WebSocket from 'ws';
import {
  assertLoopbackBind,
  createHttpServer,
  createWebSocketServer,
  isLoopbackHost,
  jsonError,
  validateAccess,
  validateCommand,
} from './server.mjs';

async function startServers() {
  const server = createHttpServer(() => ({ ok: true, status: 'IDLE', version: '3.1.0' }));
  createWebSocketServer(server, '/ws');
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  return {
    server,
    port: address.port,
    close: () => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())),
  };
}

function request(port, { path = '/health', method = 'GET', host = `127.0.0.1:${port}`, origin } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path,
      method,
      headers: { host, ...(origin ? { origin } : {}) },
    }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body) }));
    });
    req.on('error', reject);
    req.end();
  });
}

function websocketUpgrade(port, origin) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`, { headers: { origin } });
    ws.once('open', () => {
      ws.close();
      resolve({ status: 101 });
    });
    ws.once('unexpected-response', (_request, response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => body += chunk);
      response.on('end', () => resolve({ status: response.statusCode, body: JSON.parse(body) }));
    });
    ws.once('error', reject);
  });
}

test('accepts loopback bindings and rejects non-loopback hosts', () => {
  assert.equal(isLoopbackHost('127.0.0.1'), true);
  assert.equal(isLoopbackHost('127.20.30.40'), true);
  assert.equal(isLoopbackHost('localhost'), true);
  assert.equal(isLoopbackHost('::1'), true);
  assert.equal(isLoopbackHost('0.0.0.0'), false);
  assert.equal(isLoopbackHost('192.168.1.1'), false);
  assert.equal(isLoopbackHost('sandbox.localhost.example'), false);
  assertLoopbackBind('127.0.0.1');
  assert.throws(() => assertLoopbackBind('0.0.0.0'), /loopback address/);
});

test('allows absent or loopback origins and rejects external origins and hosts', () => {
  assert.equal(validateAccess({ headers: { host: '127.0.0.1:8799' } }), null);
  assert.equal(validateAccess({ headers: { host: 'localhost:5173', origin: 'http://localhost:5173' } }), null);
  assert.equal(validateAccess({ headers: { host: '[::1]:8799', origin: 'capacitor://localhost' } }), null);
  assert.equal(validateAccess({ headers: { host: '127.0.0.1:8799', origin: 'https://evil.example' } }).code, 'ORIGIN_NOT_ALLOWED');
  assert.equal(validateAccess({ headers: { host: 'sandbox.example', origin: undefined } }).code, 'HOST_NOT_ALLOWED');
  assert.equal(validateAccess({ headers: { host: '127.0.0.1:8799', origin: 'null' } }).code, 'ORIGIN_NOT_ALLOWED');
});

test('accepts only the four exact text JSON command objects', () => {
  for (const command of ['status', 'dry-run', 'auto-patch', 'sync']) {
    assert.deepEqual(validateCommand(Buffer.from(JSON.stringify({ command }))), { ok: true, command });
  }
  assert.equal(validateCommand(Buffer.from('{')).error.code, 'INVALID_JSON');
  assert.equal(validateCommand(Buffer.from('{"command":"deploy"}')).error.code, 'UNKNOWN_COMMAND');
  assert.equal(validateCommand(Buffer.from('{"command":"sync","extra":true}')).error.code, 'INVALID_MESSAGE');
  assert.equal(validateCommand(Buffer.from('[]')).error.code, 'INVALID_MESSAGE');
  assert.equal(validateCommand(Buffer.from('{"command":"status"}'), true).error.code, 'INVALID_MESSAGE');
  assert.deepEqual(jsonError('INVALID_JSON', 'bad input'), {
    event: 'ERROR',
    ok: false,
    error: { code: 'INVALID_JSON', message: 'bad input' },
    message: 'bad input',
  });
});

test('serves consistent JSON health and HTTP error responses', async t => {
  const listening = await startServers();
  t.after(() => listening.close());

  const health = await request(listening.port);
  assert.equal(health.status, 200);
  assert.deepEqual(health.body, { ok: true, status: 'IDLE', version: '3.1.0' });
  assert.equal(health.headers['cache-control'], 'no-store');

  const missing = await request(listening.port, { path: '/missing' });
  assert.equal(missing.status, 404);
  assert.deepEqual(missing.body, {
    ok: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });

  const wrongMethod = await request(listening.port, { method: 'POST' });
  assert.equal(wrongMethod.status, 405);
  assert.equal(wrongMethod.body.error.code, 'METHOD_NOT_ALLOWED');

  const badOrigin = await request(listening.port, { origin: 'https://evil.example' });
  assert.equal(badOrigin.status, 403);
  assert.equal(badOrigin.body.error.code, 'ORIGIN_NOT_ALLOWED');
});

test('enforces loopback origin policy during WebSocket upgrade', async t => {
  const listening = await startServers();
  t.after(() => listening.close());

  assert.deepEqual(await websocketUpgrade(listening.port, 'http://127.0.0.1:5173'), { status: 101 });
  const rejected = await websocketUpgrade(listening.port, 'https://evil.example');
  assert.equal(rejected.status, 403);
  assert.deepEqual(rejected.body, {
    ok: false,
    error: { code: 'ORIGIN_NOT_ALLOWED', message: 'Sandbox access is limited to loopback origins' },
  });
});
