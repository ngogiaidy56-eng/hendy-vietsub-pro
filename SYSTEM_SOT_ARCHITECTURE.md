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
