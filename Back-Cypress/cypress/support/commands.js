import { validateSchema } from "./utils/schemaValidator";

/**
 * Valida o corpo de uma resposta contra um JSON Schema.
 * @example cy.get("@response").its("body").validateSchema(authSuccessSchema)
 */
Cypress.Commands.add("validateSchema", { prevSubject: true }, (subject, schema) => {
  const { valid, errors } = validateSchema(schema, subject);
  expect(valid, `schema inválido: ${errors}`).to.be.true;
  return cy.wrap(subject, { log: false });
});
