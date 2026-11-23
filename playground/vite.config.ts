import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      // Use library source so registry changes appear without rebuilding the package.
      scriptbox: fileURLToPath(new URL("../src/index.ts", import.meta.url)),
    },
  },
  server: {
    fs: { allow: [".."] },
    port: 5173,
  },
});
