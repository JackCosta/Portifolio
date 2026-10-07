import { expect } from "@playwright/test";
import { invalidCredentials, validCredentials } from "../data/users";
import { Given, Then, When } from "../support/fixtures";

Given("que eu estou na página de login", async ({ loginPage }) => {
  await loginPage.open();
});

Given("que eu fiz login com credenciais válidas", async ({ loginPage, inventoryPage }) => {
  await loginPage.open();
  await loginPage.login(validCredentials);
  await inventoryPage.expectLoaded();
});

When("eu faço login com credenciais válidas", async ({ loginPage }) => {
  await loginPage.login(validCredentials);
});

When(
  "eu informo o usuário {string} e a senha {string} e pressiono Enter",
  async ({ loginPage }, username: string, password: string) => {
    await loginPage.loginPressingEnter({ username, password });
  },
);

When("eu tento fazer login com {string}", async ({ loginPage }, caso: string) => {
  const credentials = invalidCredentials[caso];
  if (!credentials) throw new Error(`Caso de login inválido não cadastrado em src/data/users.ts: "${caso}"`);
  await loginPage.login(credentials);
});

When("eu fecho a mensagem de erro", async ({ loginPage }) => {
  await loginPage.closeError();
});

When("eu faço logout", async ({ inventoryPage }) => {
  await inventoryPage.header.logout();
});

When("eu acesso a página {string} sem estar logado", async ({ page }, path: string) => {
  await page.goto(path);
});

Then("a tela de login deve ser exibida corretamente", async ({ loginPage }) => {
  await loginPage.expectLoaded();
});

Then("devo ver a mensagem de erro {string}", async ({ loginPage }, message: string) => {
  await loginPage.expectError(message);
});

Then("os campos de login devem ser destacados com erro", async ({ loginPage }) => {
  await loginPage.expectFieldsHighlighted();
});

Then("devo permanecer na página de login", async ({ loginPage }) => {
  await loginPage.expectOnLoginPage();
});

Then("nenhuma mensagem de erro deve ser exibida", async ({ loginPage }) => {
  await loginPage.expectNoError();
});

Then("os ícones de erro não devem ser exibidos", async ({ loginPage }) => {
  await loginPage.expectNoErrorIcons();
});

Then("a sessão deve pertencer ao usuário {string}", async ({ context }, username: string) => {
  const cookies = await context.cookies();
  const session = cookies.find((cookie) => cookie.name === "session-username");
  expect(session?.value, "cookie de sessão").toBe(username);
});

Then("a sessão não deve existir", async ({ context }) => {
  const cookies = await context.cookies();
  expect(cookies.map((cookie) => cookie.name)).not.toContain("session-username");
});
