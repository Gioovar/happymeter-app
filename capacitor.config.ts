import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.happymeters.app',
  appName: 'HappyMeters',
  webDir: 'out',
  server: {
    url: 'http://10.0.2.2:3000/loyalty/login',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;
