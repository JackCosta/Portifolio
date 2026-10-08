import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";
import { cucumberReporter, defineBddConfig } from "playwright-bdd";
import { env } from "./src/support/env";

const isCI = !!process.env.CI;

const testDir = defineBddConfig({
  features: "features/**/*.feature",
  steps: ["src/support/fixtures.ts", "src/steps/**/*.ts"],
  language: "pt",
  missingSteps: "fail-on-gen",
});

export default defineConfig({
  testDir,
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  // Site externo + inicialização a frio do navegador (Firefox chega a ~25s) dentro do tempo do teste.
  timeout: 60_000,
  expect: { timeout: 7_000 },
  outputDir: "test-results",

  reporter: [
    [isCI ? "github" : "list"],
    ["html", { outputFolder: "reports/playwright", open: "never" }],
    ["junit", { outputFile: "reports/junit/results.xml" }],
    cucumberReporter("html", { outputFile: "reports/cucumber/index.html" }),
    cucumberReporter("json", { outputFile: "reports/cucumber/report.json" }),
    // No CI cada navegador roda em um job; os blobs são unidos em um único relatório HTML.
    ...(isCI ? [["blob", { outputDir: "blob-report" }] as const] : []),
  ],

  use: {
    baseURL: env.baseUrl,
    testIdAttribute: "data-test",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 15"] } },
  ],
});
