import js from "@eslint/js";
import playwright from "eslint-plugin-playwright";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["node_modules/", ".features-gen/", "reports/", "test-results/", "playwright-report/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    ...playwright.configs["flat/recommended"],
    rules: {
      ...playwright.configs["flat/recommended"].rules,
      // Os passos BDD não são blocos test(); as asserções ficam nos Page Objects.
      "playwright/no-standalone-expect": "off",
      "playwright/expect-expect": "off",
      // Falso-positivo: a regra trata qualquer objeto terminado em "Page" (os Page Objects) como a Page do Playwright.
      "playwright/prefer-locator": "off",
      "playwright/no-wait-for-timeout": "error",
      "playwright/no-force-option": "error",
    },
  },
);
