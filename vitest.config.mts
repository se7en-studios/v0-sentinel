import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "components/admin/hooks/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: [
        "lib/admin/**/*.ts",
        "lib/flags.ts",
        "components/admin/hooks/use-early.ts",
        "components/admin/hooks/use-terrain.ts",
        "components/admin/hooks/use-fires-data.ts",
      ],
      exclude: [
        "**/*.test.ts",
        "**/hooks-test-utils.ts",
        "lib/admin/map-3d.ts",
        "lib/admin/firebase.ts",
        "lib/admin/cloud.ts",
        "lib/admin/map-config.ts",
      ],
      reporter: ["text-summary", "text"],
    },
  },
});
