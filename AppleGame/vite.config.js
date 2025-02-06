import { defineConfig } from "vite";

export default defineConfig({
  base: "", // Remove ./ to use an empty string
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
  publicDir: "public",
});
