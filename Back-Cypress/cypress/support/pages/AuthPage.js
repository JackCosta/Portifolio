import BasePage from "./BasePage";

/** Page Object do endpoint POST /auth (CreateToken). */
class AuthPage extends BasePage {
  constructor() {
    super("/auth");
  }

  /** Gera token com as credenciais configuradas no ambiente. */
  createTokenWithDefaultCredentials(options = {}) {
    return cy
      .env(["AUTH_USERNAME", "AUTH_PASSWORD"], { log: false })
      .then(({ AUTH_USERNAME, AUTH_PASSWORD }) =>
        this.createToken({ username: AUTH_USERNAME, password: AUTH_PASSWORD }, options),
      );
  }

  /** Envia o payload como recebido (permite omitir campos). */
  createToken(payload, options = {}) {
    return this.request({ method: "POST", body: payload, ...options });
  }

  /** Envia um corpo bruto (ex.: JSON malformado). */
  createTokenWithRawBody(rawBody) {
    return this.request({ method: "POST", body: rawBody });
  }
}

export default new AuthPage();
