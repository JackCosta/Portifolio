import { Then, When } from "@badeball/cypress-cucumber-preprocessor";
import BasePage from "../../support/pages/BasePage";
import { schemas } from "../../support/schemas";

const api = new BasePage();

// As asserções usam expect() dentro de then() porque a resposta é imutável:
// re-tentar com should() só atrasaria a falha até o timeout.
const withResponse = (fn) => cy.get("@response", { log: false }).then(fn);

When("eu envio uma requisição {string} para {string}", (method, path) => {
  api.request({ method, path }).as("response");
});

Then("o status code da resposta deve ser {int}", (statusCode) => {
  withResponse((response) => expect(response.status, "status code").to.eq(statusCode));
});

Then("o header {string} deve conter {string}", (header, value) => {
  withResponse((response) => expect(response.headers[header.toLowerCase()], header).to.include(value));
});

Then("a resposta deve ser JSON", () => {
  withResponse((response) => expect(response.headers["content-type"]).to.include("application/json"));
});

Then("a resposta deve ser texto com a mensagem {string}", (message) => {
  withResponse((response) => {
    expect(response.headers["content-type"]).to.include("text/plain");
    expect(response.body).to.eq(message);
  });
});

Then("o corpo da resposta deve respeitar o contrato {string}", (schemaName) => {
  const schema = schemas[schemaName];
  expect(schema, `contrato "${schemaName}"`).to.exist;
  cy.get("@response").its("body").validateSchema(schema);
});

Then("o tempo de resposta deve ser aceitável", () => {
  const limit = Cypress.expose("MAX_RESPONSE_TIME_MS");
  withResponse((response) => expect(response.duration, "duração (ms)").to.be.lessThan(limit));
});
