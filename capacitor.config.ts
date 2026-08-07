import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tiendaveronica.app',
  appName: 'Tienda Verónica',
  webDir: 'public',
  server: {
    url: 'https://pagina-web-vero.vercel.app/admin',
    cleartext: true
  }
};

export default config;