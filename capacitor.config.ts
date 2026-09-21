import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.translogix.app',
  appName: 'TRANSLOGIX',
  webDir: 'www',

  server: {
    androidScheme: 'http'
  },

  plugins: {
    SystemBars: {
      insetsHandling: 'native'
    }
  }
};

export default config;