import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The builder is served from https://thymos.fit/builder/ as static assets
// living in the repo's builder/ directory (same deploy model as the rest of
// the site: no Cloudflare Pages build step).
export default defineConfig({
  plugins: [react()],
  base: "/builder/",
  build: {
    outDir: "../builder",
    emptyOutDir: true,
  },
});
