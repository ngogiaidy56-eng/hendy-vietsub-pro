# Hendy Video Studio — System SOT Source Code

This file contains the complete source for the System Single Source of Truth (SOT) layer requested for the project root.

## 1. `system-config/system.config.json`
```json
{
  "$schema": "./schema/system-config.schema.json",
  "app": {
    "name": "AI Studio Pro",
    "shortName": "AI Studio Pro",
    "product": "Video + Vietsub Workspace",
    "version": "3.1.0",
    "description": "AI video editor, Vietnamese subtitles, TTS voiceover and multi-channel audio studio.",
    "language": "vi"
  },
  "ui": {
    "theme": {
      "bg": "#070b12",
      "panel": "#0c121c",
      "panel2": "#0f1724",
      "surface": "#121b2a",
      "border": "rgba(148,163,184,0.12)",
      "borderStrong": "rgba(148,163,184,0.20)",
      "text": "#e6edf7",
      "muted": "#8793a6",
      "cyan": "#22d3ee",
      "blue": "#4f7cff",
      "purple": "#8b5cf6",
      "success": "#34d399",
      "warning": "#fbbf24",
      "danger": "#fb7185"
    },
    "layout": {
      "headerHeight": 60,
      "workspaceGap": 8,
      "panelRadius": 14,
      "gridSize": 32
    },
    "status": {
      "nominalLabel": "NOMINAL",
      "nominalDescription": "Automated checks passed; ready for sync.",
      "warningLabel": "WARNING",
      "failedLabel": "FAILED"
    }
  },
  "runtime": {
    "sandbox": {
      "host": "127.0.0.1",
      "port": 8799,
      "wsPath": "/ws",
      "autoStartHint": true
    },
    "dev": {
      "vitePort": 5173
    },
    "cloudflare": {
      "pagesOutput": "./dist",
      "compatibilityDate": "2026-09-26",
      "workerName": "capcut-vietsub-studio"
    }
  },
  "platforms": {
    "web": {
      "enabled": true
    },
    "pwa": {
      "enabled": true,
      "startUrl": "/",
      "display": "standalone",
      "themeColor": "#070b12",
      "backgroundColor": "#070b12"
    },
    "android": {
      "enabled": true,
      "packageId": "com.aistudiopro.vietsub",
      "appName": "AI Studio Pro"
    },
    "ios": {
      "enabled": true,
      "bundleId": "com.aistudiopro.vietsub",
      "appName": "AI Studio Pro"
    }
  },
  "sync": {
    "managedFiles": [
      "package.json",
      "capacitor.config.ts",
      "public/manifest.json",
      "public/_headers",
      "wrangler.jsonc",
      "src/generated/system-config.ts",
      "src/generated/system-theme.css",
      "index.html",
      "public/sw.js"
    ],
    "broadcastEvent": "SYSTEM_CONFIG_SYNCED",
    "releaseGate": "NOMINAL"
  }
}
```

## 2. `system-config/README.md`
```md
# System Configuration — Single Source of Truth

`system-config/system.config.json` is the root configuration authority for the project.

Edit that file instead of hand-editing managed configuration files. Run:

```bash
npm run system:dry-run
npm run system:sync
npm run system:sandbox
```

The sync process updates the managed subset of:

- `package.json`
- `capacitor.config.ts`
- `public/manifest.json`
- `public/_headers`
- `wrangler.jsonc`
- `src/generated/system-config.ts`
- `src/generated/system-theme.css`

`system:sandbox` starts an independent local WebSocket validation gateway. The gateway can run dry-run, apply safe local auto-fixes, re-validate, and broadcast `SYSTEM_CONFIG_SYNCED` only after the release gate reaches `NOMINAL`.

NOMINAL means all automated checks passed. It is a release gate, not a guarantee that every runtime condition is safe.

### Tự động đồng bộ khi sửa Source of Truth

Chạy `npm run system:sandbox`. Gateway sẽ theo dõi `system-config/system.config.json`. Khi file này thay đổi, sandbox sẽ debounce thay đổi, auto-patch các lỗi cấu hình an toàn, validate, strict dry-run, chạy release gate (TypeScript + Vite build), sau đó mới sync các target và phát `SYSTEM_CONFIG_SYNCED` qua WebSocket. Nếu gate thất bại, broadcast đồng bộ bị chặn.

`NOMINAL` chỉ có nghĩa là toàn bộ kiểm tra tự động đã vượt qua; nó không phải chứng nhận an toàn tuyệt đối cho mọi điều kiện runtime.
```

## 3. `system-config/schema/system-config.schema.json`
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://hendy-video-studio.local/schemas/system-config.json",
  "title": "Hendy Video Studio System Source of Truth",
  "type": "object",
  "additionalProperties": false,
  "required": ["$schema", "app", "ui", "runtime", "platforms", "sync"],
  "properties": {
    "$schema": {"type": "string"},
    "app": {
      "type": "object", "additionalProperties": false,
      "required": ["name", "shortName", "product", "version", "description", "language"],
      "properties": {
        "name": {"type": "string", "minLength": 2},
        "shortName": {"type": "string", "minLength": 2},
        "product": {"type": "string", "minLength": 2},
        "version": {"type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+$"},
        "description": {"type": "string", "minLength": 10},
        "language": {"type": "string", "minLength": 2}
      }
    },
    "ui": {
      "type": "object", "additionalProperties": false,
      "required": ["theme", "layout", "status"],
      "properties": {
        "theme": {
          "type": "object", "additionalProperties": false,
          "required": ["bg","panel","panel2","surface","border","borderStrong","text","muted","cyan","blue","purple","success","warning","danger"],
          "properties": {
            "bg":{"type":"string"},"panel":{"type":"string"},"panel2":{"type":"string"},"surface":{"type":"string"},
            "border":{"type":"string"},"borderStrong":{"type":"string"},"text":{"type":"string"},"muted":{"type":"string"},
            "cyan":{"type":"string"},"blue":{"type":"string"},"purple":{"type":"string"},"success":{"type":"string"},
            "warning":{"type":"string"},"danger":{"type":"string"}
          }
        },
        "layout": {
          "type": "object", "additionalProperties": false,
          "required": ["headerHeight","workspaceGap","panelRadius","gridSize"],
          "properties": {
            "headerHeight": {"type":"integer","minimum":32,"maximum":160},
            "workspaceGap": {"type":"integer","minimum":0,"maximum":40},
            "panelRadius": {"type":"integer","minimum":0,"maximum":40},
            "gridSize": {"type":"integer","minimum":8,"maximum":96}
          }
        },
        "status": {
          "type": "object", "additionalProperties": false,
          "required": ["nominalLabel","nominalDescription","warningLabel","failedLabel"],
          "properties": {
            "nominalLabel": {"type":"string"},"nominalDescription": {"type":"string"},
            "warningLabel": {"type":"string"},"failedLabel": {"type":"string"}
          }
        }
      }
    },
    "runtime": {
      "type":"object", "additionalProperties": false, "required":["sandbox","dev","cloudflare"],
      "properties": {
        "sandbox": {
          "type":"object", "additionalProperties": false, "required":["host","port","wsPath","autoStartHint"],
          "properties": {"host":{"type":"string"},"port":{"type":"integer","minimum":1,"maximum":65535},"wsPath":{"type":"string","pattern":"^/"},"autoStartHint":{"type":"boolean"}}
        },
        "dev": {"type":"object","additionalProperties": false,"required":["vitePort"],"properties":{"vitePort":{"type":"integer","minimum":1,"maximum":65535}}},
        "cloudflare": {
          "type":"object","additionalProperties": false,"required":["pagesOutput","compatibilityDate","workerName"],
          "properties":{"pagesOutput":{"type":"string","minLength":1},"compatibilityDate":{"type":"string","minLength":1},"workerName":{"type":"string","minLength":1}}
        }
      }
    },
    "platforms": {
      "type":"object", "additionalProperties": false, "required":["web","pwa","android","ios"],
      "properties": {
        "web":{"type":"object","additionalProperties":false,"required":["enabled"],"properties":{"enabled":{"type":"boolean"}}},
        "pwa":{"type":"object","additionalProperties":false,"required":["enabled","startUrl","display","themeColor","backgroundColor"],"properties":{"enabled":{"type":"boolean"},"startUrl":{"type":"string"},"display":{"type":"string"},"themeColor":{"type":"string"},"backgroundColor":{"type":"string"}}},
        "android":{"type":"object","additionalProperties":false,"required":["enabled","packageId","appName"],"properties":{"enabled":{"type":"boolean"},"packageId":{"type":"string"},"appName":{"type":"string"}}},
        "ios":{"type":"object","additionalProperties":false,"required":["enabled","bundleId","appName"],"properties":{"enabled":{"type":"boolean"},"bundleId":{"type":"string"},"appName":{"type":"string"}}}
      }
    },
    "sync": {
      "type":"object", "additionalProperties": false, "required":["managedFiles","broadcastEvent","releaseGate"],
      "properties":{"managedFiles":{"type":"array","minItems":1,"items":{"type":"string"}},"broadcastEvent":{"type":"string","minLength":1},"releaseGate":{"type":"string","const":"NOMINAL"}}
    }
  }
}
```

## 4. `system-config/scripts/sync-config.mjs`
```js
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const SOT = path.join(ROOT, 'system-config', 'system.config.json');
const args = new Set(process.argv.slice(2));

function deepClone(value) { return JSON.parse(JSON.stringify(value)); }
function stableJson(value) { return JSON.stringify(value, null, 2) + '\n'; }
function hash(text) { return crypto.createHash('sha256').update(text).digest('hex').slice(0, 12); }

function validate(c) {
  const errors = [];
  const push = (condition, message) => { if (!condition) errors.push(message); };
  push(c?.app?.name && c?.app?.shortName, 'app.name and app.shortName are required');
  push(c?.app?.version && /^\d+\.\d+\.\d+$/.test(c.app.version), 'app.version must be semver like 3.1.0');
  push(Number.isInteger(c?.runtime?.sandbox?.port) && c.runtime.sandbox.port > 0 && c.runtime.sandbox.port < 65536, 'sandbox.port must be a valid TCP port');
  push(Number.isInteger(c?.runtime?.dev?.vitePort) && c.runtime.dev.vitePort > 0 && c.runtime.dev.vitePort < 65536, 'dev.vitePort must be a valid TCP port');
  push(typeof c?.runtime?.sandbox?.wsPath === 'string' && c.runtime.sandbox.wsPath.startsWith('/'), 'sandbox.wsPath must start with /');
  push(typeof c?.platforms?.android?.packageId === 'string' && /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/.test(c.platforms.android.packageId), 'android.packageId is invalid');
  push(typeof c?.platforms?.ios?.bundleId === 'string' && /^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/.test(c.platforms.ios.bundleId), 'ios.bundleId is invalid');
  push(typeof c?.runtime?.cloudflare?.pagesOutput === 'string' && c.runtime.cloudflare.pagesOutput.length > 0, 'cloudflare.pagesOutput is required');
  push(c?.sync?.releaseGate === 'NOMINAL', 'sync.releaseGate must be NOMINAL');
  for (const [key, value] of Object.entries(c?.ui?.theme ?? {})) {
    const ok = typeof value === 'string' && (/^#[0-9a-fA-F]{3,8}$/.test(value) || /^rgba?\([^)]*\)$/.test(value));
    if (!ok) errors.push(`ui.theme.${key} must be a CSS hex/rgb/rgba value`);
  }
  for (const [name, platform] of Object.entries(c?.platforms ?? {})) {
    push(typeof platform?.enabled === 'boolean', `platforms.${name}.enabled must be boolean`);
  }
  return errors;
}

function autoPatch(c) {
  const out = deepClone(c);
  const patches = [];
  const patch = (pathText, next) => {
    let ref = out;
    const parts = pathText.split('.');
    const leaf = parts.pop();
    for (const p of parts) ref = ref[p] ??= {};
    const prev = ref[leaf];
    if (prev !== next) {
      ref[leaf] = next;
      patches.push(`${pathText}: ${JSON.stringify(prev)} -> ${JSON.stringify(next)}`);
    }
  };
  if (!/^\d+\.\d+\.\d+$/.test(String(out.app?.version ?? ''))) patch('app.version', '3.1.0');
  if (!(Number.isInteger(out.runtime?.sandbox?.port) && out.runtime.sandbox.port > 0 && out.runtime.sandbox.port < 65536)) patch('runtime.sandbox.port', 8799);
  if (!(Number.isInteger(out.runtime?.dev?.vitePort) && out.runtime.dev.vitePort > 0 && out.runtime.dev.vitePort < 65536)) patch('runtime.dev.vitePort', 5173);
  if (typeof out.runtime?.sandbox?.wsPath !== 'string' || !out.runtime.sandbox.wsPath.startsWith('/')) patch('runtime.sandbox.wsPath', '/ws');
  if (!/^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/.test(String(out.platforms?.android?.packageId ?? ''))) patch('platforms.android.packageId', 'com.aistudiopro.vietsub');
  if (!/^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/.test(String(out.platforms?.ios?.bundleId ?? ''))) patch('platforms.ios.bundleId', 'com.aistudiopro.vietsub');
  if (out.sync?.releaseGate !== 'NOMINAL') patch('sync.releaseGate', 'NOMINAL');
  return {out, patches};
}

function packageJsonUpdate(pkg, c) {
  const next = {...pkg};
  next.name = c.runtime.cloudflare.workerName;
  next.version = c.app.version;
  next.description = c.app.description;
  next.scripts = {
    ...next.scripts,
    'system:validate': 'node system-config/scripts/sync-config.mjs --validate',
    'system:dry-run': 'node system-config/scripts/sync-config.mjs --dry-run',
    'system:auto-patch': 'node system-config/scripts/sync-config.mjs --auto-patch',
    'system:sync': 'node system-config/scripts/sync-config.mjs --sync',
    'system:watch': 'node system-config/sandbox/server.mjs --watch',
    'system:sandbox': 'node system-config/sandbox/server.mjs --watch',
    'system:sandbox:once': 'node system-config/sandbox/server.mjs',
    'system:release-gate': 'node system-config/scripts/release-gate.mjs',
    'cap:sync:nominal': 'npm run system:release-gate && npx cap sync',
    'cf:deploy:nominal': 'npm run system:release-gate && npm run build && wrangler pages deploy dist'
  };
  next.engines = {...next.engines, node: '>=20.0.0'};
  next.dependencies = {
    ...(next.dependencies ?? {}),
    '@capacitor/core': '^8.5.2',
    '@capacitor/android': '^8.5.2',
    '@capacitor/ios': '^8.5.2',
    ws: '^8.18.3'
  };
  next.devDependencies = {
    ...(next.devDependencies ?? {}),
    '@capacitor/cli': '^8.5.2'
  };
  return next;
}

function capacitor(c) {
  return `import type { CapacitorConfig } from '@capacitor/cli';\n\nexport const config: CapacitorConfig = {\n  appId: ${JSON.stringify(c.platforms.android.packageId)},\n  appName: ${JSON.stringify(c.app.name)},\n  webDir: 'dist',\n  bundledWebRuntime: false,\n  server: {\n    androidScheme: 'https',\n    iosScheme: 'https'\n  }\n};\n\nexport default config;\n`;
}

function manifest(c) {
  return stableJson({
    name: c.app.name,
    short_name: c.app.shortName,
    description: c.app.description,
    lang: c.app.language,
    start_url: c.platforms.pwa.startUrl,
    scope: '/',
    display: c.platforms.pwa.display,
    orientation: 'any',
    theme_color: c.platforms.pwa.themeColor,
    background_color: c.platforms.pwa.backgroundColor,
    icons: []
  });
}

function headers(c) {
  return `/* ${c.app.name} generated from system-config */\n/manifest.json\n  Content-Type: application/manifest+json\n  Cache-Control: public, max-age=300\n\n/sw.js\n  Cache-Control: no-cache\n\n/\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: microphone=(self), camera=(self)\n`;
}

function wrangler(c) {
  return stableJson({
    '$schema': './node_modules/wrangler/config-schema.json',
    name: c.runtime.cloudflare.workerName,
    pages_build_output_dir: c.runtime.cloudflare.pagesOutput,
    compatibility_date: c.runtime.cloudflare.compatibilityDate
  });
}

function generatedTs(c) {
  return `export const SYSTEM_CONFIG = ${JSON.stringify(c, null, 2)} as const;\nexport const SYSTEM_CONFIG_VERSION = ${JSON.stringify(c.app.version)};\n`;
}

function indexHtml(c) {
  return `<!doctype html>\n<html lang="${c.app.language}">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />\n    <meta name="theme-color" content="${c.platforms.pwa.themeColor}" />\n    <meta name="mobile-web-app-capable" content="yes" />\n    <meta name="apple-mobile-web-app-capable" content="yes" />\n    <link rel="manifest" href="/manifest.json" />\n    <title>${c.app.name} — ${c.app.product}</title>\n    <meta name="description" content="${c.app.description}" />\n    <meta property="og:title" content="${c.app.name}" />\n    <meta property="og:description" content="${c.app.description}" />\n    <meta property="og:type" content="website" />\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>\n`;
}

function serviceWorker(c) {
  const cache = `aistudio-pro-${c.app.version.replaceAll('.', '-')}`;
  return `const CACHE = ${JSON.stringify(cache)};\nconst APP_SHELL = ['/','/manifest.json'];\n\nself.addEventListener('install', event => {\n  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));\n});\n\nself.addEventListener('activate', event => {\n  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));\n});\n\nself.addEventListener('fetch', event => {\n  if (event.request.method !== 'GET') return;\n  event.respondWith(fetch(event.request).then(response => {\n    const copy = response.clone();\n    caches.open(CACHE).then(cache => cache.put(event.request, copy));\n    return response;\n  }).catch(() => caches.match(event.request).then(cached => cached || caches.match('/'))));\n});\n`;
}

function generatedCss(c) {
  const t = c.ui.theme;
  const l = c.ui.layout;
  return `:root {\n  --sys-bg: ${t.bg};\n  --sys-panel: ${t.panel};\n  --sys-panel-2: ${t.panel2};\n  --sys-surface: ${t.surface};\n  --sys-border: ${t.border};\n  --sys-border-strong: ${t.borderStrong};\n  --sys-text: ${t.text};\n  --sys-muted: ${t.muted};\n  --sys-cyan: ${t.cyan};\n  --sys-blue: ${t.blue};\n  --sys-purple: ${t.purple};\n  --sys-success: ${t.success};\n  --sys-warning: ${t.warning};\n  --sys-danger: ${t.danger};\n  --sys-header-height: ${l.headerHeight}px;\n  --sys-workspace-gap: ${l.workspaceGap}px;\n  --sys-panel-radius: ${l.panelRadius}px;\n  --sys-grid-size: ${l.gridSize}px;\n}\n`;
}

async function expectedFiles(config) {
  const pkg = JSON.parse(await fs.readFile(path.join(ROOT, 'package.json'), 'utf8'));
  return new Map([
    ['package.json', stableJson(packageJsonUpdate(pkg, config))],
    ['capacitor.config.ts', capacitor(config)],
    ['public/manifest.json', manifest(config)],
    ['public/_headers', headers(config)],
    ['wrangler.jsonc', wrangler(config)],
    ['src/generated/system-config.ts', generatedTs(config)],
    ['src/generated/system-theme.css', generatedCss(config)],
    ['index.html', indexHtml(config)],
    ['public/sw.js', serviceWorker(config)],
  ]);
}

async function loadConfig() {
  return JSON.parse(await fs.readFile(SOT, 'utf8'));
}

async function writeManaged(config) {
  const outputs = await expectedFiles(config);
  for (const [relative, content] of outputs) {
    const filePath = path.join(ROOT, relative);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content);
  }
  return outputs;
}

async function dryRun(config, {verbose = true} = {}) {
  const outputs = await expectedFiles(config);
  const drift = [];
  for (const [relative, expected] of outputs) {
    let current = null;
    try { current = await fs.readFile(path.join(ROOT, relative), 'utf8'); } catch {}
    if (current !== expected) drift.push({ file: relative, currentHash: current == null ? null : hash(current), expectedHash: hash(expected) });
  }
  if (verbose) {
    console.log(`DRY-RUN: ${outputs.size} managed targets inspected`);
    for (const item of drift) console.log(`  DRIFT ${item.file} ${item.currentHash ?? 'MISSING'} -> ${item.expectedHash}`);
    if (!drift.length) console.log('DRY-RUN: no configuration drift detected');
  }
  return { drift, outputs };
}

async function main() {
  let config = await loadConfig();
  if (args.has('--auto-patch')) {
    const patched = autoPatch(config);
    config = patched.out;
    if (patched.patches.length) {
      await fs.writeFile(SOT, stableJson(config));
      console.log(`AUTO-PATCH: applied ${patched.patches.length} safe patch(es)`);
      for (const p of patched.patches) console.log(`  ${p}`);
    } else console.log('AUTO-PATCH: no patch needed');
  }

  const errors = validate(config);
  console.log(`SYSTEM CONFIG ${errors.length ? 'INVALID' : 'NOMINAL'} — ${config.app.name} v${config.app.version}`);
  if (errors.length) {
    for (const e of errors) console.log(`ERROR: ${e}`);
    process.exitCode = 1;
    return;
  }

  if (args.has('--dry-run')) {
    const {drift} = await dryRun(config);
    if (args.has('--strict-dry-run') && drift.length) {
      console.error(`DRY-RUN: ${drift.length} managed file(s) would change`);
      process.exitCode = 2;
    }
    return;
  }

  if (args.has('--sync')) {
    await writeManaged(config);
    console.log('SYNC: managed configuration files updated from system-config/system.config.json');
  }
}

function cPaths(c) { return c.sync.managedFiles ?? []; }
main().catch((err) => { console.error(err); process.exit(1); });
```

## 5. `system-config/scripts/release-gate.mjs`
```js
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
```

## 6. `system-config/sandbox/server.mjs`
```js
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
```

## 7. `src/generated/system-config.ts`
```ts
export const SYSTEM_CONFIG = {
  "$schema": "./schema/system-config.schema.json",
  "app": {
    "name": "AI Studio Pro",
    "shortName": "AI Studio Pro",
    "product": "Video + Vietsub Workspace",
    "version": "3.1.0",
    "description": "AI video editor, Vietnamese subtitles, TTS voiceover and multi-channel audio studio.",
    "language": "vi"
  },
  "ui": {
    "theme": {
      "bg": "#070b12",
      "panel": "#0c121c",
      "panel2": "#0f1724",
      "surface": "#121b2a",
      "border": "rgba(148,163,184,0.12)",
      "borderStrong": "rgba(148,163,184,0.20)",
      "text": "#e6edf7",
      "muted": "#8793a6",
      "cyan": "#22d3ee",
      "blue": "#4f7cff",
      "purple": "#8b5cf6",
      "success": "#34d399",
      "warning": "#fbbf24",
      "danger": "#fb7185"
    },
    "layout": {
      "headerHeight": 60,
      "workspaceGap": 8,
      "panelRadius": 14,
      "gridSize": 32
    },
    "status": {
      "nominalLabel": "NOMINAL",
      "nominalDescription": "Automated checks passed; ready for sync.",
      "warningLabel": "WARNING",
      "failedLabel": "FAILED"
    }
  },
  "runtime": {
    "sandbox": {
      "host": "127.0.0.1",
      "port": 8799,
      "wsPath": "/ws",
      "autoStartHint": true
    },
    "dev": {
      "vitePort": 5173
    },
    "cloudflare": {
      "pagesOutput": "./dist",
      "compatibilityDate": "2026-09-26",
      "workerName": "capcut-vietsub-studio"
    }
  },
  "platforms": {
    "web": {
      "enabled": true
    },
    "pwa": {
      "enabled": true,
      "startUrl": "/",
      "display": "standalone",
      "themeColor": "#070b12",
      "backgroundColor": "#070b12"
    },
    "android": {
      "enabled": true,
      "packageId": "com.aistudiopro.vietsub",
      "appName": "AI Studio Pro"
    },
    "ios": {
      "enabled": true,
      "bundleId": "com.aistudiopro.vietsub",
      "appName": "AI Studio Pro"
    }
  },
  "sync": {
    "managedFiles": [
      "package.json",
      "capacitor.config.ts",
      "public/manifest.json",
      "public/_headers",
      "wrangler.jsonc",
      "src/generated/system-config.ts",
      "src/generated/system-theme.css",
      "index.html",
      "public/sw.js"
    ],
    "broadcastEvent": "SYSTEM_CONFIG_SYNCED",
    "releaseGate": "NOMINAL"
  }
} as const;
export const SYSTEM_CONFIG_VERSION = "3.1.0";
```

## 8. `src/generated/system-theme.css`
```css
:root {
  --sys-bg: #070b12;
  --sys-panel: #0c121c;
  --sys-panel-2: #0f1724;
  --sys-surface: #121b2a;
  --sys-border: rgba(148,163,184,0.12);
  --sys-border-strong: rgba(148,163,184,0.20);
  --sys-text: #e6edf7;
  --sys-muted: #8793a6;
  --sys-cyan: #22d3ee;
  --sys-blue: #4f7cff;
  --sys-purple: #8b5cf6;
  --sys-success: #34d399;
  --sys-warning: #fbbf24;
  --sys-danger: #fb7185;
  --sys-header-height: 60px;
  --sys-workspace-gap: 8px;
  --sys-panel-radius: 14px;
  --sys-grid-size: 32px;
}
```

## 9. `src/components/system/SystemControlPanel.tsx`
```tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  CircleDot,
  CloudCog,
  RefreshCw,
  ShieldCheck,
  Terminal,
  Wifi,
  X,
  Wrench,
} from 'lucide-react';
import { SYSTEM_CONFIG } from '../../generated/system-config';

type GateStatus = 'IDLE' | 'RUNNING' | 'NOMINAL' | 'FAILED';

type TelemetryEvent = {
  ts?: string;
  event: string;
  [key: string]: unknown;
};

const STATUS_META: Record<GateStatus, { label: string; note: string }> = {
  IDLE: { label: 'IDLE', note: 'Sandbox đang chờ lệnh' },
  RUNNING: { label: 'RUNNING', note: 'Đang kiểm tra cô lập' },
  NOMINAL: { label: 'NOMINAL', note: 'Các gate tự động đã vượt qua' },
  FAILED: { label: 'FAILED', note: 'Đã chặn đồng bộ' },
};

export const SystemControlPanel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<GateStatus>('IDLE');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Sandbox offline');
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [wsOverride, setWsOverride] = useState('');
  const socketRef = useRef<WebSocket | null>(null);

  const wsUrl = useMemo(() => {
    const saved = wsOverride.trim() || localStorage.getItem('systemSandboxWs') || '';
    if (saved) return saved;
    const { host, port, wsPath } = SYSTEM_CONFIG.runtime.sandbox;
    return `ws://${host}:${port}${wsPath}`;
  }, [wsOverride]);

  const enabledPlatforms = useMemo(
    () => Object.entries(SYSTEM_CONFIG.platforms).filter(([, item]) => item.enabled).map(([name]) => name),
    []
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;
    setBusy(true);

    ws.onopen = () => {
      if (cancelled) return;
      setConnected(true);
      setBusy(false);
      setMessage('Sandbox connected');
      ws.send(JSON.stringify({ command: 'status' }));
    };

    ws.onmessage = (event) => {
      try {
        const item = JSON.parse(event.data) as TelemetryEvent;
        if (item.gate && typeof item.gate === 'object') {
          const gate = item.gate as { status?: GateStatus; progress?: number; message?: string };
          setStatus(gate.status ?? 'IDLE');
          setProgress(Number(gate.progress ?? 0));
          setMessage(gate.message ?? '');
        }
        if (item.event === 'GATE_STARTED') setStatus('RUNNING');
        if (item.event === 'GATE_NOMINAL') {
          setStatus('NOMINAL');
          setProgress(100);
        }
        if (item.event === 'GATE_FAILED') {
          setStatus('FAILED');
          setProgress(100);
        }
        if (item.message) setMessage(String(item.message));
        if (item.event) setEvents(prev => [...prev.slice(-29), item]);
      } catch {
        setEvents(prev => [...prev.slice(-29), { event: 'RAW', ts: new Date().toISOString(), data: event.data }]);
      }
    };

    ws.onerror = () => {
      if (cancelled) return;
      setConnected(false);
      setBusy(false);
      setMessage('Sandbox unavailable');
    };

    ws.onclose = () => {
      if (cancelled) return;
      setConnected(false);
      setBusy(false);
    };

    return () => {
      cancelled = true;
      ws.close();
      socketRef.current = null;
    };
  }, [open, wsUrl]);

  const command = (name: 'dry-run' | 'auto-patch' | 'sync') => {
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setMessage('Hãy chạy System Sandbox trước');
      return;
    }
    setBusy(true);
    setStatus('RUNNING');
    setProgress(5);
    ws.send(JSON.stringify({ command: name }));
  };

  const saveOverride = () => {
    const value = wsOverride.trim();
    if (value) localStorage.setItem('systemSandboxWs', value);
    else localStorage.removeItem('systemSandboxWs');
    setMessage(value ? 'Custom endpoint saved' : 'Using Source-of-Truth endpoint');
  };

  const statusIcon =
    status === 'NOMINAL' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
    status === 'FAILED' ? <X className="w-4 h-4 text-rose-400" /> :
    status === 'RUNNING' ? <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" /> :
    <CircleDot className="w-4 h-4 text-slate-500" />;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="fixed right-4 bottom-4 z-[70] group flex items-center gap-2 rounded-full border border-slate-700/80 bg-[#09111c]/95 px-3 py-2 text-[11px] font-black text-slate-100 shadow-2xl shadow-black/30 backdrop-blur-xl hover:border-cyan-500/40 hover:bg-[#111a28] transition-all"
        title="System Activity Control"
      >
        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
        <Activity className="w-3.5 h-3.5 text-cyan-400" />
        <span className="hidden sm:inline">SYSTEM</span>
        <span className="hidden md:inline text-slate-500">·</span>
        <span className="hidden md:inline text-[10px] text-slate-500">{status}</span>
      </button>

      {open && (
        <aside className="fixed right-4 bottom-16 z-[71] w-[min(480px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-slate-700/80 bg-[#080f1a]/98 shadow-2xl shadow-black/50 backdrop-blur-2xl text-slate-100">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-cyan-950/40 via-slate-950/25 to-purple-950/35">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl border border-cyan-500/20 bg-cyan-500/10 flex items-center justify-center shrink-0">
                <CloudCog className="w-4 h-4 text-cyan-300" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black tracking-tight flex items-center gap-2">
                  Advanced System Activity
                  <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[9px]">CRM CONTROL</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate">Single Source of Truth · v{SYSTEM_CONFIG.app.version}</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
          </div>

          <div className="p-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500"><ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Release Gate</div>
                <div className="mt-2 flex items-center gap-2 text-sm font-bold">{statusIcon}<span>{STATUS_META[status].label}</span></div>
                <div className="mt-1 text-[10px] text-slate-500">{message || STATUS_META[status].note}</div>
                <div className="mt-2 h-1.5 rounded-full bg-slate-900 overflow-hidden"><div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all" style={{ width: `${progress}%` }} /></div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500"><Wifi className="w-3.5 h-3.5 text-emerald-400" /> Sandbox</div>
                <div className="mt-2 flex items-center gap-2 text-sm font-bold"><span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />{connected ? 'CONNECTED' : 'OFFLINE'}</div>
                <div className="mt-1 text-[10px] text-slate-500 truncate">{wsUrl}</div>
                <div className="mt-2 flex flex-wrap gap-1">{enabledPlatforms.map(p => <span key={p} className="rounded border border-slate-800 bg-slate-900 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-slate-400">{p}</span>)}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button disabled={busy || !connected} onClick={() => command('dry-run')} className="rounded-lg border border-slate-800 bg-slate-900/80 px-2 py-2 text-[10px] font-bold text-slate-300 hover:border-cyan-500/30 hover:text-cyan-200 disabled:opacity-40">DRY-RUN</button>
              <button disabled={busy || !connected} onClick={() => command('auto-patch')} className="rounded-lg border border-slate-800 bg-slate-900/80 px-2 py-2 text-[10px] font-bold text-slate-300 hover:border-amber-500/30 hover:text-amber-200 disabled:opacity-40">AUTO-PATCH</button>
              <button disabled={busy || !connected} onClick={() => command('sync')} className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-2 py-2 text-[10px] font-black text-emerald-300 hover:bg-emerald-950/40 disabled:opacity-40"><Wrench className="inline w-3 h-3 mr-1" />SYNC ALL</button>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/55 p-3 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5 text-indigo-400" /> WebSocket Endpoint</div>
              <div className="flex gap-2">
                <input value={wsOverride} onChange={e => setWsOverride(e.target.value)} placeholder={wsUrl} className="min-w-0 flex-1 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 text-[10px] font-mono text-slate-300" />
                <button onClick={saveOverride} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-[10px] font-bold text-slate-200 hover:bg-slate-700">Save</button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <div className="px-3 py-2 border-b border-slate-800 bg-slate-900/70 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Live Telemetry</span>
                <span className="text-[10px] text-slate-600">{events.length} events</span>
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-900">
                {events.length === 0 ? (
                  <div className="px-3 py-6 text-center text-[10px] text-slate-600">No telemetry yet.</div>
                ) : events.slice().reverse().map((item, idx) => (
                  <div key={`${item.ts ?? 'e'}-${idx}`} className="px-3 py-2 grid grid-cols-[auto_1fr] gap-2">
                    <span className="font-mono text-[9px] text-slate-600">{item.ts ? new Date(item.ts).toLocaleTimeString() : '--:--:--'}</span>
                    <div>
                      <div className="text-[10px] font-semibold text-slate-300">{item.event}</div>
                      {item.message && <div className="text-[9px] text-slate-500 truncate">{String(item.message)}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      )}
    </>
  );
};
```

## 10. `capacitor.config.ts`
```ts
import type { CapacitorConfig } from '@capacitor/cli';

export const config: CapacitorConfig = {
  appId: "com.aistudiopro.vietsub",
  appName: "AI Studio Pro",
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    iosScheme: 'https'
  }
};

export default config;
```

## 11. `public/manifest.json`
```json
{
  "name": "AI Studio Pro",
  "short_name": "AI Studio Pro",
  "description": "AI video editor, Vietnamese subtitles, TTS voiceover and multi-channel audio studio.",
  "lang": "vi",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "any",
  "theme_color": "#070b12",
  "background_color": "#070b12",
  "icons": []
}
```

## 12. `public/sw.js`
```js
const CACHE = "aistudio-pro-3-1-0";
const APP_SHELL = ['/','/manifest.json'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request).then(cached => cached || caches.match('/'))));
});
```

## 13. `public/_headers`
```text
/* AI Studio Pro generated from system-config */
/manifest.json
  Content-Type: application/manifest+json
  Cache-Control: public, max-age=300

/sw.js
  Cache-Control: no-cache

/
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: microphone=(self), camera=(self)
```

## 14. `wrangler.jsonc`
```json
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "capcut-vietsub-studio",
  "pages_build_output_dir": "./dist",
  "compatibility_date": "2026-09-26"
}
```

## 15. `index.html`
```html
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#070b12" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <link rel="manifest" href="/manifest.json" />
    <title>AI Studio Pro — Video + Vietsub Workspace</title>
    <meta name="description" content="AI video editor, Vietnamese subtitles, TTS voiceover and multi-channel audio studio." />
    <meta property="og:title" content="AI Studio Pro" />
    <meta property="og:description" content="AI video editor, Vietnamese subtitles, TTS voiceover and multi-channel audio studio." />
    <meta property="og:type" content="website" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## 16. `package.json`
```json
{
  "name": "capcut-vietsub-studio",
  "private": true,
  "version": "3.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "cf:dev": "npm run build && wrangler pages dev dist",
    "cf:deploy": "npm run build && wrangler pages deploy dist",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist .wrangler",
    "system:validate": "node system-config/scripts/sync-config.mjs --validate",
    "system:dry-run": "node system-config/scripts/sync-config.mjs --dry-run",
    "system:auto-patch": "node system-config/scripts/sync-config.mjs --auto-patch",
    "system:sync": "node system-config/scripts/sync-config.mjs --sync",
    "system:sandbox": "node system-config/sandbox/server.mjs --watch",
    "system:release-gate": "node system-config/scripts/release-gate.mjs",
    "cf:deploy:nominal": "npm run system:release-gate && npm run build && wrangler pages deploy dist",
    "system:watch": "node system-config/sandbox/server.mjs --watch",
    "cap:sync:nominal": "npm run system:release-gate && npx cap sync",
    "system:sandbox:once": "node system-config/sandbox/server.mjs"
  },
  "dependencies": {
    "@tailwindcss/vite": "^4.3.3",
    "lucide-react": "^0.546.0",
    "motion": "^12.23.24",
    "react": "^19.0.1",
    "react-dom": "^19.0.1",
    "tailwindcss": "^4.3.3",
    "vite": "^8.3.0",
    "ws": "^8.18.3",
    "@capacitor/core": "^8.5.2",
    "@capacitor/android": "^8.5.2",
    "@capacitor/ios": "^8.5.2"
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "@vitejs/plugin-react": "^6.1.1",
    "typescript": "^5.8.3",
    "wrangler": "^4.40.0",
    "@capacitor/cli": "^8.5.2"
  },
  "description": "AI video editor, Vietnamese subtitles, TTS voiceover and multi-channel audio studio.",
  "engines": {
    "node": ">=20.0.0"
  }
}
```

## 17. `.github/workflows/system-gate.yml`
```yaml
name: System SOT Release Gate

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm install --ignore-scripts --no-audit --no-fund
      - run: npm run system:validate
      - run: npm run system:dry-run -- --strict-dry-run
      - run: npm run typecheck
      - run: npm run build
```

## 18. `SYSTEM_SOT_ARCHITECTURE.md`
```md
# AI Studio Pro — System SOT Architecture

## Single Source of Truth

The root authority is:

`system-config/system.config.json`

This file owns application identity, design tokens, layout values, release status, sandbox endpoint, Cloudflare build settings, PWA settings, and native platform IDs.

## Managed outputs

The generator keeps these derived files synchronized:

- `package.json`
- `capacitor.config.ts`
- `public/manifest.json`
- `public/_headers`
- `public/sw.js`
- `wrangler.jsonc`
- `index.html`
- `src/generated/system-config.ts`
- `src/generated/system-theme.css`

Do not hand-edit derived values when they are represented in the SOT.

## Safety gate

The local sandbox performs this sequence:

1. reload SOT
2. optional safe auto-patch
3. SOT validation
4. strict configuration dry-run
5. managed-file sync when explicitly requested or when watch mode is active
6. TypeScript check + Vite production build
7. emit `GATE_NOMINAL`
8. only then emit `SYSTEM_CONFIG_SYNCED`

A failed gate blocks the final sync broadcast.

`NOMINAL` means the configured automated checks passed. It is not a promise of absolute runtime safety.

## WebSocket sandbox

Default endpoint:

`ws://127.0.0.1:8799/ws`

Start it in automatic watch mode:

```bash
npm run system:sandbox
```

The browser `SYSTEM` control panel can issue:

- `DRY-RUN`
- `AUTO-PATCH`
- `SYNC ALL`

Telemetry is streamed over the same WebSocket connection.

## Capacitor

The SOT drives `capacitor.config.ts` and includes Capacitor 8 dependencies. After the first install, initialize the native shells once:

```bash
npx cap add android
npx cap add ios
```

Then use:

```bash
npm run cap:sync:nominal
```

Native platform projects are intentionally not fabricated by the generator. Once created by Capacitor, inspect and commit the Android/iOS projects as appropriate for the application.
```
