const { defineConfig } = require("cypress");
const createBundler = require("@bahmutov/cypress-esbuild-preprocessor");
const { addCucumberPreprocessorPlugin, afterRunHandler } = require("@badeball/cypress-cucumber-preprocessor");
const { createEsbuildPlugin } = require("@badeball/cypress-cucumber-preprocessor/esbuild");
const { generateReport } = require("./scripts/generate-report");

module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.BASE_URL || "https://restful-booker.herokuapp.com",
    specPattern: "cypress/e2e/features/**/*.feature",
    supportFile: "cypress/support/e2e.js",
    video: false,
    screenshotOnRunFailure: false,
    defaultCommandTimeout: 10000,
    responseTimeout: 30000,
    retries: { runMode: 1, openMode: 0 },
    // Valores sensíveis: lidos nos testes via cy.env(). Sobrescreva com
    // cypress.env.json ou CYPRESS_AUTH_USERNAME / CYPRESS_AUTH_PASSWORD.
    env: {
      AUTH_USERNAME: "admin",
      AUTH_PASSWORD: "password123",
    },
    // Valores públicos: lidos nos testes via Cypress.expose().
    expose: {
      MAX_RESPONSE_TIME_MS: 3000,
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
