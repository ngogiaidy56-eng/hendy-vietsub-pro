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

The gateway binds only to a loopback address. Health and WebSocket requests reject non-loopback `Host` headers and browser `Origin` values; clients without an `Origin` header remain supported for local command-line use. WebSocket commands must be text JSON containing only one `command` field: `status`, `dry-run`, `auto-patch`, or `sync`. Errors use an `error` object with stable `code` and `message` fields. Run the contract tests with `npm run system:sandbox:test`.

### Tự động đồng bộ khi sửa Source of Truth

Chạy `npm run system:sandbox`. Gateway sẽ theo dõi `system-config/system.config.json`. Khi file này thay đổi, sandbox sẽ debounce thay đổi, auto-patch các lỗi cấu hình an toàn, validate, strict dry-run, chạy release gate (TypeScript + Vite build), sau đó mới sync các target và phát `SYSTEM_CONFIG_SYNCED` qua WebSocket. Nếu gate thất bại, broadcast đồng bộ bị chặn.

`NOMINAL` chỉ có nghĩa là toàn bộ kiểm tra tự động đã vượt qua; nó không phải chứng nhận an toàn tuyệt đối cho mọi điều kiện runtime.
