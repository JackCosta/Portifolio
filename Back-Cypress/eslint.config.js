const js = require("@eslint/js");
const globals = require("globals");
const pluginCypress = require("eslint-plugin-cypress");

module.exports = [
  { ignores: ["node_modules/", "reports/", "cypress/downloads/", "cypress/screenshots/"] },
  js.configs.recommended,
  {
    files: ["*.js", "scripts/**/*.js"],
    languageOptions: { sourceType: "commonjs", globals: globals.node },
  },
  {
    files: ["cypress/**/*.js"],
    ...pluginCypress.configs.recommended,
    languageOptions: {
      ...pluginCypress.configs.recommended.languageOptions,
      sourceType: "module",
      globals: {
        ...pluginCypress.configs.recommended.languageOptions.globals,
        ...globals.browser,
        ...globals.mocha,
      },
    },
  },
];
