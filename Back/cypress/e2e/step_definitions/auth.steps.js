import { When, Then } from "@badeball/cypress-cucumber-preprocessor";
import authPage from "../../support/pages/AuthPage";

When("eu solicito um token com as credenciais válidas", () => {
  authPage.createTokenWithDefaultCredentials().as("response");
});

When("eu solicito dois tokens com as credenciais válidas", () => {
  authPage.createTokenWithDefaultCredentials().its("body.token").as("firstToken");
  authPage.createTokenWithDefaultCredentials().its("body.token").as("secondToken");
});

When("eu solicito um token com {string}", (caso) => {
  cy.fixture("auth").then(({ invalidCredentials }) => {
    const payload = invalidCredentials[caso];
    expect(payload, `massa de dados para "${caso}"`).to.exist;
    authPage.createToken(payload).as("response");
  });
});

When("eu envio o corpo {string} para o endpoint de autenticação", (rawBody) => {
  authPage.createTokenWithRawBody(rawBody).as("response");
});

Then("a resposta deve conter um token válido", () => {
  cy.get("@response")
    .its("body.token")
    .should("be.a", "string")
    .and("match", /^[a-f0-9]{15}$/);
});

Then("a resposta não deve conter token", () => {
  cy.get("@response").its("body").should("not.have.property", "token");
});

Then("a mensagem de erro deve ser {string}", (message) => {
  cy.get("@response").its("body.reason").should("eq", message);
});

Then("os tokens gerados devem ser diferentes", () => {
  cy.get("@firstToken").then((firstToken) => {
    cy.get("@secondToken").should("not.eq", firstToken);
  });
});
