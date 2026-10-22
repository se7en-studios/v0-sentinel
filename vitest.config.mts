import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["lib/admin/**/*.ts", "lib/flags.ts"],
      exclude: [
        "**/*.test.ts",
        "lib/admin/map-3d.ts",
        "lib/admin/firebase.ts",
        "lib/admin/cloud.ts",
        "lib/admin/map-config.ts",
      ],
      reporter: ["text-summary", "text"],
    },
  },
});
