import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    manifest: true,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  preview: {
    port: 5169,
    host: true,
    proxy: {
      '/api': {
        target: 'http://37.27.142.148:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('Origin', 'http://37.27.142.148:5169');
          });
        }
      },
      '/auth': {
        target: 'http://37.27.142.148:3000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('Origin', 'http://37.27.142.148:5169');
          });
        }
      }
    }
  },
  server: {
    port: 5169,
    host: true,
    cors: {
      origin: true,
      credentials: true
    },
    proxy: {
      '/api': {
        target: 'http://37.27.142.148:3000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('Origin', 'http://37.27.142.148:5169');
          });
        }
      },
      '/auth': {
        target: 'http://37.27.142.148:3000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('Origin', 'http://37.27.142.148:5169');
          });
        }
      }
    }
  },
});
