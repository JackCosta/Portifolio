const { defineConfig } = require("cypress");
const createBundler = require("@bahmutov/cypress-esbuild-preprocessor");
const { addCucumberPreprocessorPlugin, afterRunHandler } = require("@badeball/cypress-cucumber-preprocessor");
const { createEsbuildPlugin } = require("@badeball/cypress-cucumber-preprocessor/esbuild");
const { generateReport } = require("./scripts/generate-report");

module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.BASE_URL || "https://www.saucedemo.com",
    specPattern: "cypress/e2e/features/**/*.feature",
    supportFile: "cypress/support/e2e.js",
    viewportWidth: 1366,
    viewportHeight: 768,
    video: false,
    screenshotOnRunFailure: true,
    trashAssetsBeforeRuns: true,
    defaultCommandTimeout: 10000,
    retries: { runMode: 1, openMode: 0 },
    // Valores sensíveis: lidos nos testes via cy.env(). Sobrescreva com
    // cypress.env.json ou CYPRESS_LOGIN_USERNAME / CYPRESS_LOGIN_PASSWORD.
    env: {
      LOGIN_USERNAME: "standard_user",
      LOGIN_PASSWORD: "secret_sauce",
    },
    async setupNodeEvents(on, config) {
      await addCucumberPreprocessorPlugin(on, config, { omitAfterRunHandler: true });
      on("file:preprocessor", createBundler({ plugins: [createEsbuildPlugin(config)] }));
      on("after:run", async (results) => {
        await afterRunHandler(config, results);
        await generateReport({ baseUrl: config.baseUrl, tags: config.expose.tags, results });
      });
      return config;
    },
  },
});
