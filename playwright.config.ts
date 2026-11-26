import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/ui",
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:3000",
    viewport: { width: 390, height: 844 },
  },
  webServer: {
    command: "npx next start -H 127.0.0.1 -p 3000",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
