# CapCut Pro Vietsub Studio — Cloudflare Pages rewrite

Bản này chuyển backend Express/Node của project cũ sang **Cloudflare Pages Functions**, giữ nguyên frontend React/Vite và các endpoint mà UI đang gọi.

## Cloudflare Pages

Trong Cloudflare Pages → Build settings:

- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`

Cloudflare Pages sẽ phát hiện `/functions` ở root và deploy các API route cùng site. React/Vite dùng `dist` làm thư mục build. Xem tài liệu Cloudflare Pages về build configuration và file-based Functions routing. 

## Secrets

Tạo các secret cho Pages Functions:

- `GEMINI_API_KEY`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

Không đưa token thật vào frontend hoặc commit vào Git. Cloudflare khuyến nghị dùng encrypted secrets cho API keys/auth tokens.

## API routes

- `POST /api/gemini/subtitles`
- `POST /api/gemini/tts`
- `POST /api/gemini/audio-mix`
- `POST /api/gemini/create-video`
- `POST /api/gemini/transcribe`
- `POST /api/gemini/enhance-vietnamese`
- `POST /api/cloudflare/tts`
- `GET /api/health`

## Local

```bash
npm install
npm run dev
```

Để chạy cả Pages Functions local:

```bash
npm run cf:dev
```

Bạn có thể sao chép `.dev.vars.example` thành `.dev.vars` rồi điền secret local.

## Deploy bằng Wrangler

```bash
npm run cf:deploy
```

## Thay đổi quan trọng so với bản cũ

1. Bỏ Express, `tsx`, `dotenv` và `@google/genai` khỏi production runtime.
2. API Gemini được gọi bằng Web Fetch API trong Pages Functions.
3. TTS Gemini dùng `gemini-3.8-flash-tts`/`gemini-3.8-flash-lite-tts`.
4. Cloudflare MeloTTS dùng model identifier hiện tại `@cf/myshell-ai/melotts` với `prompt` + `lang`.
5. `public/_routes.json` giới hạn invocation Function cho `/api/*`, để asset tĩnh được Pages phục vụ trực tiếp.
6. Fallback Vietsub/TTS/transcription vẫn được giữ để UI không bị dừng khi upstream AI hết quota hoặc tạm thời lỗi.

## System Configuration — Single Source of Truth

Mọi tham số nền tảng và giao diện dùng chung nằm tại `system-config/system.config.json`. Không sửa thủ công các file được quản lý.

```bash
npm install
npm run system:sandbox
```

Gateway WebSocket mặc định chạy tại `ws://127.0.0.1:8799/ws`. Có thể mở `SYSTEM` trong giao diện để xem release gate, telemetry, DRY-RUN, AUTO-PATCH và SYNC ALL.

Luồng tự động là: Source of Truth → validate → strict dry-run → TypeScript/Vite gate → sync → `SYSTEM_CONFIG_SYNCED`. Broadcast chỉ phát sau khi gate đạt `NOMINAL`.

### Capacitor

Sau khi cài dependencies, khởi tạo native shells một lần:

```bash
npx cap add android
npx cap add ios
npm run cap:sync:nominal
```

`capacitor.config.ts` được sinh từ Source of Truth. ID ứng dụng native vẫn cần được kiểm tra trong các project native đã tạo bởi Capacitor trước khi phát hành.
