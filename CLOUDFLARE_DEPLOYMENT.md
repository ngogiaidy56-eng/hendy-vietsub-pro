# Cloudflare deployment checklist

This project is intended for Cloudflare Pages.

1. Connect the Git repository to Pages.
2. Use `npm run build` as the build command.
3. Use `dist` as the output directory.
4. Add `GEMINI_API_KEY`, `CLOUDFLARE_ACCOUNT_ID`, and `CLOUDFLARE_API_TOKEN` as encrypted secrets.
5. Deploy.
6. Verify `GET /api/health` before testing AI features.
