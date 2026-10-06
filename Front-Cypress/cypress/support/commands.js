/**
 * Busca um elemento pelo atributo data-test (padrão usado pelo SauceDemo).
 * @example cy.getByDataTest("login-button")
 */
Cypress.Commands.add("getByDataTest", (value, options) => cy.get(`[data-test="${value}"]`, options));
