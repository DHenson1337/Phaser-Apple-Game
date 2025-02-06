import { defineConfig } from "vite";

export default defineConfig({
  base: "./", // Change from '/' to './' for relative paths
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
  // Add this to ensure public directory is handled correctly
  publicDir: "public",
});
