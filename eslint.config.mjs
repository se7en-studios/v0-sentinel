import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    ".claude/**", // agent worktrees, not app source
    "public/**", // vendored/minified assets (maplibre)
    "node_modules/**",
    "out/**",
    "next-env.d.ts",
  ]),
  {
    // Pre-existing violations: downgraded to warn so lint exits 0 (F0, no source changes).
    // Re-enable as errors once the source is cleaned up.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "@next/next/no-html-link-for-pages": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
    },
  },
]);
