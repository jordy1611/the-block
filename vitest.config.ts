import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * Tests get their own config rather than riding on `vite.config.ts`.
 *
 * That file carries the mock API plugin, which is dev/preview-server
 * middleware — starting a server is the one thing a unit test never wants. The
 * only thing tests need from the app build is the React JSX transform.
 *
 * CSS is not processed (`css` stays off), so a `*.module.css` import resolves
 * to a proxy that hands back the class name asked of it. Component tests assert
 * on text and roles, never on styling, so there is nothing to lose and a
 * PostCSS pass per file to skip.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/support/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      /*
       * Type declarations emit no JavaScript, and the entry points are wiring
       * a unit test cannot meaningfully cover — counting them would only make
       * the number less honest.
       */
      exclude: ['src/types/**', 'src/main.tsx', 'src/**/*.d.ts'],
    },
  },
});
