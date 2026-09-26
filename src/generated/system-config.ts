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
