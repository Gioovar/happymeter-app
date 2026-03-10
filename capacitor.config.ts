import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.happypromoters.app',
  appName: 'Happy RPS',
  webDir: 'out',
  server: {
    url: 'https://www.happymeters.com/rps',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;
