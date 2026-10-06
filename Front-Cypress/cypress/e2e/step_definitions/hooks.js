import { AfterStep } from "@badeball/cypress-cucumber-preprocessor";

const MAX_NAME_LENGTH = 150;

const toFileName = (text) =>
  text
    .replace(/[^\p{L}\p{N} _-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_NAME_LENGTH);

/**
 * Evidência: captura a tela ao fim de cada bloco de validações ("Então" + "E" seguintes).
 * O cucumber-preprocessor anexa os prints ao relatório. Em caso de falha, o Cypress
 * captura a tela automaticamente (screenshotOnRunFailure).
 */
AfterStep(function ({ pickle, pickleStep }) {
  if (pickleStep.type !== "Outcome") return;
  const index = pickle.steps.findIndex((step) => step.id === pickleStep.id);
  if (pickle.steps[index + 1]?.type === "Outcome") return;
  cy.screenshot(toFileName(`${pickle.name} -- ${pickleStep.text}`), { capture: "viewport", overwrite: true });
});
