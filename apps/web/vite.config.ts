import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { formatBuildVersion } from "./src/app/version";

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
  define: {
    // Computed without git: `.git` is not available in the Docker build context.
    __APP_VERSION__: JSON.stringify(
      command === "serve" ? "dev" : formatBuildVersion(new Date(), process.env.GIT_SHA),
    ),
  },
}));
