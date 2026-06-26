import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@reactsnap/core": resolve(__dirname, "packages/core/src/index.ts"),
      "@reactsnap/react": resolve(__dirname, "packages/react/src/index.ts")
    }
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./tests/setup.ts"]
  }
});
