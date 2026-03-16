import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  base: "/",
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      // Proxy all API endpoints to Express server
      "/api": { target: "http://localhost:3001", changeOrigin: true },
    }
  }
}));
