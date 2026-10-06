import el from "../elements/LoginElements";

/** Page Object da tela de login. Os seletores ficam em ../elements/LoginElements. */
class LoginPage {
  constructor() {
    this.path = "/";
  }

  visit() {
    cy.visit(this.path);
    cy.get(el.loginButton).should("be.visible");
  }

  fillUsername(username) {
    cy.get(el.usernameInput).clear();
    if (username) cy.get(el.usernameInput).type(username);
  }

  /** A senha não é exibida no log do Cypress. */
  fillPassword(password) {
    cy.get(el.passwordInput).clear();
    if (password) cy.get(el.passwordInput).type(password, { log: false });
  }

  submit() {
    cy.get(el.loginButton).click();
  }

  login(username, password) {
    this.fillUsername(username);
    this.fillPassword(password);
    this.submit();
  }

  /** Login com as credenciais configuradas no ambiente (cypress.config.js / cypress.env.json). */
  loginWithValidCredentials() {
    cy.env(["LOGIN_USERNAME", "LOGIN_PASSWORD"], { log: false }).then(({ LOGIN_USERNAME, LOGIN_PASSWORD }) =>
      this.login(LOGIN_USERNAME, LOGIN_PASSWORD),
    );
  }

  /**
   * Login pela interface, com a sessão (cookie + localStorage) reaproveitada entre cenários via cy.session.
   * Todos os usuários de teste do SauceDemo usam a mesma senha (LOGIN_PASSWORD).
   */
  loginAs(username) {
    cy.session(
      ["saucedemo", username],
      () => {
        this.visit();
        cy.env(["LOGIN_PASSWORD"], { log: false }).then(({ LOGIN_PASSWORD }) =>
          this.login(username, LOGIN_PASSWORD),
        );
        cy.location("pathname").should("eq", "/inventory.html");
      },
      {
        validate() {
          cy.getCookie("session-username").its("value").should("eq", username);
        },
      },
    );
  }

  closeError() {
    cy.get(el.errorCloseButton).click();
  }

  shouldBeDisplayed() {
    cy.location("pathname").should("eq", this.path);
    cy.get(el.logo).should("be.visible").and("have.text", "Swag Labs");
    cy.get(el.usernameInput).should("be.visible");
    cy.get(el.passwordInput).should("be.visible").and("have.attr", "type", "password");
    cy.get(el.loginButton).should("be.visible").and("have.value", "Login");
  }

  shouldShowError(message) {
    cy.get(el.errorMessage).should("be.visible").and("have.text", message);
  }

  shouldNotShowError() {
    cy.get(el.errorMessage).should("not.exist");
  }

  /** Campos destacados em vermelho + ícone de erro. */
  shouldHighlightFields() {
    cy.get(el.usernameInput).should("have.class", "input_error");
    cy.get(el.passwordInput).should("have.class", "input_error");
    cy.get(el.errorIcon).should("have.length", 2);
  }

  /** Ao fechar a mensagem, o SauceDemo remove os ícones mas mantém a classe input_error nos campos. */
  shouldNotShowErrorIcons() {
    cy.get(el.errorIcon).should("not.exist");
  }

  shouldStayOnLoginPage() {
    cy.location("pathname").should("eq", this.path);
    cy.get(el.loginButton).should("be.visible");
  }
}

export default new LoginPage();
