import authPage from "../pages/AuthPage";

const basic = (username, password) => ({ Authorization: `Basic ${btoa(`${username}:${password}`)}` });

/**
 * Monta os headers de autorização para PUT/DELETE a partir do modo descrito no Gherkin.
 * @param {"token"|"basic"|"token inválido"|"basic inválido"|"nenhuma"} mode
 */
export function getAuthHeaders(mode) {
  switch (mode) {
    case "token":
      return authPage
        .createTokenWithDefaultCredentials({ report: false })
        .then((response) => ({ Cookie: `token=${response.body.token}` }));
    case "basic":
      return cy
        .env(["AUTH_USERNAME", "AUTH_PASSWORD"], { log: false })
        .then(({ AUTH_USERNAME, AUTH_PASSWORD }) => basic(AUTH_USERNAME, AUTH_PASSWORD));
    case "token inválido":
      return cy.wrap({ Cookie: "token=tokenInvalido123" }, { log: false });
    case "basic inválido":
      return cy.wrap(basic("admin", "senhaErrada"), { log: false });
    case "nenhuma":
      return cy.wrap({}, { log: false });
    default:
      throw new Error(`Modo de autenticação desconhecido: "${mode}"`);
  }
}
