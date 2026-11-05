import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En desarrollo, Vite reenvía /api y /soap al servidor Express.
// Así el navegador solo habla con un origen y la clave de OpenWeather nunca sale del servidor.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: false },
      '/soap': { target: 'http://localhost:3001', changeOrigin: false },
    },
  },
});
