import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(() => ({
  base: "/",
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      // Proxy all API endpoints to Express server
      "/api": { target: "http://127.0.0.1:3001", changeOrigin: true },
    }
  }
}));
