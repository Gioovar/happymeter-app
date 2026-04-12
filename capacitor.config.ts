import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.happymeters.opsapp',
  appName: 'Happy OPS',
  webDir: 'out',
  server: {
    url: 'https://www.happymeters.com/ops',
    cleartext: false,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#050505",
      showSpinner: false,
    }
  }
};

export default config;
