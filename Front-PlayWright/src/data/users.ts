import { env } from "../support/env";

export type Credentials = { username: string; password: string };

/** Mensagens de erro exibidas pela tela de login. */
export const LoginErrors = {
  usernameRequired: "Epic sadface: Username is required",
  passwordRequired: "Epic sadface: Password is required",
  invalidCredentials: "Epic sadface: Username and password do not match any user in this service",
  lockedOut: "Epic sadface: Sorry, this user has been locked out.",
} as const;

/** Massa de dados para os cenários negativos, indexada pelo nome do caso usado nas features. */
export const invalidCredentials: Record<string, Credentials> = {
  "usuário e senha em branco": { username: "", password: "" },
  "usuário em branco": { username: "", password: env.password },
  "senha em branco": { username: env.username, password: "" },
  "senha incorreta": { username: env.username, password: "senha_errada" },
  "usuário inexistente": { username: "usuario_inexistente", password: env.password },
  "usuário em caixa alta": { username: env.username.toUpperCase(), password: env.password },
  "senha em caixa alta": { username: env.username, password: env.password.toUpperCase() },
  "usuário com espaços": { username: ` ${env.username} `, password: env.password },
  "injeção de SQL": { username: "' OR '1'='1", password: "' OR '1'='1" },
  "usuário bloqueado": { username: "locked_out_user", password: env.password },
};

export const validCredentials: Credentials = { username: env.username, password: env.password };

/** Dados do comprador usados no formulário de checkout. */
export const customer = { firstName: "Maria", lastName: "Silva", postalCode: "01310-100" };
