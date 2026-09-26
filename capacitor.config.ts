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
