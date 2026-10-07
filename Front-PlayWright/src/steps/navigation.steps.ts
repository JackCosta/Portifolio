import { DataTable } from "playwright-bdd";
import { customer } from "../data/users";
import { Then, When } from "../support/fixtures";

When("eu adiciono os produtos ao carrinho:", async ({ inventoryPage }, table: DataTable) => {
  for (const [name] of table.raw()) {
    await inventoryPage.addToCart(name);
    await inventoryPage.expectItemInCart(name);
  }
});

When("eu abro o carrinho", async ({ inventoryPage }) => {
  await inventoryPage.header.openCart();
});

When("eu sigo para o checkout", async ({ cartPage }) => {
  await cartPage.checkout();
});

When("eu preencho o formulário com dados válidos", async ({ checkoutInformationPage }) => {
  await checkoutInformationPage.fill(customer);
});

When(
  "eu preencho o formulário com nome {string}, sobrenome {string} e CEP {string}",
  async ({ checkoutInformationPage }, firstName: string, lastName: string, postalCode: string) => {
    await checkoutInformationPage.fill({ firstName, lastName, postalCode });
  },
);

When("eu envio o formulário", async ({ checkoutInformationPage }) => {
  await checkoutInformationPage.submit();
});

Then("devo ser redirecionado para a página de produtos", async ({ inventoryPage }) => {
  await inventoryPage.expectLoaded();
});

Then("devo ver {int} produtos listados", async ({ inventoryPage }, count: number) => {
  await inventoryPage.expectItemCount(count);
});

Then("o carrinho deve indicar {int} produto(s)", async ({ inventoryPage }, count: number) => {
  await inventoryPage.header.expectCartCount(count);
});

Then("devo estar na página do carrinho com os produtos:", async ({ cartPage }, table: DataTable) => {
  await cartPage.expectLoaded();
  await cartPage.expectItems(table.raw().map(([name]) => name));
});

Then("o formulário de dados do comprador deve ser exibido", async ({ checkoutInformationPage }) => {
  await checkoutInformationPage.expectLoaded();
});

Then(
  "devo ver no formulário a mensagem de erro {string}",
  async ({ checkoutInformationPage }, message: string) => {
    await checkoutInformationPage.expectError(message);
  },
);

Then("devo permanecer no formulário de dados do comprador", async ({ checkoutInformationPage }) => {
  await checkoutInformationPage.expectUrl();
});

Then("devo ver a revisão do pedido com os produtos:", async ({ checkoutOverviewPage }, table: DataTable) => {
  await checkoutOverviewPage.expectLoaded();
  await checkoutOverviewPage.expectItems(table.raw().map(([name]) => name));
});
