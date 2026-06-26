import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname),
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: 5174,
    proxy: {
      "/v1": "http://localhost:3848",
      "/health": "http://localhost:3848",
    },
  },
});
