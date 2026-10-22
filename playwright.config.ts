import { defineConfig } from "@playwright/test";

// Smoke tests run against the demo workspace (Firebase env blanked), using the Chrome already installed:
// no browser download. In CI the server is started by `webServer`; locally an already running one is reused.
const PORT = Number(process.env.E2E_PORT ?? 3123);

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`,
    channel: "chrome",
    viewport: { width: 1440, height: 800 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: `pnpm dev -p ${PORT}`,
    url: `http://localhost:${PORT}/admin`,
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_FIREBASE_API_KEY: "",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "",
      NEXT_PUBLIC_FIREBASE_APP_ID: "",
    },
  },
});
