import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const monorepoRoot = path.resolve(__dirname, "../..");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, monorepoRoot, "");
  const apiTarget = env.VITE_API_URL ?? "http://127.0.0.1:3000";

  return {
    plugins: [react()],
    server: {
      port: 3001,
      strictPort: false,
      hmr: {
        host: 'localhost',
      },
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
