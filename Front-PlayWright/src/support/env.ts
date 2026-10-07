/** Configuração do ambiente. Valores vêm de variáveis de ambiente (ou .env), com padrões públicos do SauceDemo. */
export const env = {
  baseUrl: process.env.BASE_URL || "https://www.saucedemo.com",
  username: process.env.LOGIN_USERNAME || "standard_user",
  password: process.env.LOGIN_PASSWORD || "secret_sauce",
};
