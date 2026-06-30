import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function lucideImportOptimizer() {
  return {
    name: 'lucide-import-optimizer',
    transform(code, id) {
      if (id.includes('node_modules') || !id.match(/\.(js|jsx|ts|tsx)$/)) return;
      if (code.includes('lucide-react')) {
        const regex = /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]lucide-react['"]/g;
        const newCode = code.replace(regex, (match, p1) => {
          const icons = p1.split(',').map(s => s.trim()).filter(Boolean);
          const pascalToKebab = (str) => str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([a-zA-Z])([0-9])/g, '$1-$2').toLowerCase();
          return icons.map(icon => {
            const parts = icon.split(/\s+as\s+/);
            if (parts.length === 2) {
              const original = parts[0].trim();
              const alias = parts[1].trim();
              return `import ${alias} from 'lucide-react/dist/esm/icons/${pascalToKebab(original)}.js'`;
            }
            return `import ${icon} from 'lucide-react/dist/esm/icons/${pascalToKebab(icon)}.js'`;
          }).join('\n');
        });
        return {
          code: newCode,
          map: null
        };
      }
    }
  };
}

export default defineConfig({
  build: {
    minify: true,
    cssMinify: true,
    reportCompressedSize: false,
    sourcemap: false,
    rollupOptions: {
      maxParallelFileOps: 2
    }
  },
  plugins: [lucideImportOptimizer(), react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5177,
    strictPort: true,
    hmr: {
      host: 'localhost',
      clientPort: 5177,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})