import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
    cors: true,
    host: true, // Enable access from network
    port: 5173,
  },
  optimizeDeps: {
    include: ["@heroicons/react", "@headlessui/react"],
  },
});
