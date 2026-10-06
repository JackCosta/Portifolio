import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import loginPage from "../../support/pages/LoginPage";
import inventoryPage from "../../support/pages/InventoryPage";
import LoginElements from "../../support/elements/LoginElements";

Given("que eu estou na página de login", () => {
  loginPage.visit();
});

Given("que eu fiz login com credenciais válidas", () => {
  loginPage.loginWithValidCredentials();
  inventoryPage.shouldBeDisplayed();
});

When("eu faço login com credenciais válidas", () => {
  loginPage.loginWithValidCredentials();
});

When("eu informo o usuário {string} e a senha {string} e pressiono Enter", (username, password) => {
  loginPage.fillUsername(username);
  cy.get(LoginElements.passwordInput).type(`${password}{enter}`, { log: false });
});

When("eu tento fazer login com {string}", (caso) => {
  cy.fixture("users").then(({ invalidCredentials }) => {
    const credentials = invalidCredentials[caso];
    expect(credentials, `massa de dados para "${caso}"`).to.exist;
    loginPage.login(credentials.username, credentials.password);
  });
});

When("eu fecho a mensagem de erro", () => {
  loginPage.closeError();
});

When("eu faço logout", () => {
  inventoryPage.logout();
});

When("eu acesso a página de produtos sem estar logado", () => {
  inventoryPage.visit();
});

Then("a tela de login deve ser exibida corretamente", () => {
  loginPage.shouldBeDisplayed();
});

Then("devo ser redirecionado para a página de produtos", () => {
  inventoryPage.shouldBeDisplayed();
});

Then("devo ver {int} produtos listados", (quantity) => {
  inventoryPage.shouldListProducts(quantity);
});

Then("a sessão deve pertencer ao usuário {string}", (username) => {
  inventoryPage.shouldHaveSessionFor(username);
});

Then("a sessão não deve existir", () => {
  cy.getCookie("session-username").should("not.exist");
});

Then("devo ver a mensagem de erro {string}", (message) => {
  loginPage.shouldShowError(message);
});

Then("nenhuma mensagem de erro deve ser exibida", () => {
  loginPage.shouldNotShowError();
});

Then("os campos de login devem ser destacados com erro", () => {
  loginPage.shouldHighlightFields();
});

Then("os ícones de erro não devem ser exibidos", () => {
  loginPage.shouldNotShowErrorIcons();
});

// Não valida o cookie "session-username": o SauceDemo o grava mesmo quando
// rejeita o login de um usuário bloqueado.
Then("devo permanecer na página de login", () => {
  loginPage.shouldStayOnLoginPage();
});
