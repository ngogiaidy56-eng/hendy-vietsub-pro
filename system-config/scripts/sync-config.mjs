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
