import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.happymeters.app',
  appName: 'HappyMeters',
  webDir: 'out',
  server: {
    url: 'http://192.168.0.180:3000/rps/zoe20',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;
