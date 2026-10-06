import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import loginPage from "../../support/pages/LoginPage";
import inventoryPage from "../../support/pages/InventoryPage";
import cartPage from "../../support/pages/CartPage";
import checkoutInformationPage from "../../support/pages/CheckoutInformationPage";
import checkoutOverviewPage from "../../support/pages/CheckoutOverviewPage";
import checkoutCompletePage from "../../support/pages/CheckoutCompletePage";
import header from "../../support/pages/components/Header";

const toCartItems = (dataTable) =>
  dataTable
    .hashes()
    .map((row) => ({ name: row.produto, quantity: Number(row.quantidade), price: row["preço"] }));

const productNames = (dataTable) => dataTable.hashes().map((row) => row.produto);

const withCustomer = (caso, callback) =>
  cy.fixture("customers").then((customers) => {
    const customer = customers[caso];
    expect(customer, `massa de dados para "${caso}"`).to.exist;
    callback(customer);
  });

// ---------- Pré-condições ----------

Given("que eu estou logado com o usuário {string}", (username) => {
  loginPage.loginAs(username);
  inventoryPage.visit();
  inventoryPage.shouldBeDisplayed();
});

Given("que eu adicionei ao carrinho os produtos {string} e {string}", (first, second) => {
  [first, second].forEach((name) => inventoryPage.addProduct(name));
  header.shouldShowCartCount(2);
});

Given("que eu iniciei o checkout com os produtos {string} e {string}", (first, second) => {
  [first, second].forEach((name) => inventoryPage.addProduct(name));
  cartPage.open();
  cartPage.checkout();
  checkoutInformationPage.shouldBeDisplayed();
});

// ---------- Ações ----------

When("eu adiciono ao carrinho os produtos:", (dataTable) => {
  productNames(dataTable).forEach((name) => inventoryPage.addProduct(name));
});

When("eu acesso o carrinho", () => {
  cartPage.open();
});

When("eu removo do carrinho o produto {string}", (name) => {
  cartPage.removeProduct(name);
});

When("eu prossigo para o checkout", () => {
  cartPage.checkout();
});

When("eu preencho os dados do comprador com {string}", (caso) => {
  withCustomer(caso, (customer) => checkoutInformationPage.fill(customer));
});

When("eu continuo o checkout", () => {
  checkoutInformationPage.continue();
});

When("eu fecho a mensagem de erro do checkout", () => {
  checkoutInformationPage.closeError();
  checkoutInformationPage.shouldNotShowError();
});

When("eu cancelo a etapa de informações do comprador", () => {
  checkoutInformationPage.cancel();
});

When("eu cancelo a revisão do pedido", () => {
  checkoutOverviewPage.cancel();
});

When("eu finalizo a compra", () => {
  checkoutOverviewPage.finish();
});

When("eu volto para a página de produtos", () => {
  checkoutCompletePage.backToProducts();
});

When("eu acesso a página {string} sem estar logado", (path) => {
  cy.visit(path, { failOnStatusCode: false });
});

// ---------- Validações ----------

Then("os produtos devem ser exibidos com os preços:", (dataTable) => {
  dataTable.hashes().forEach((row) => inventoryPage.shouldShowProductPrice(row.produto, row["preço"]));
});

Then("os produtos devem exibir o botão {string}:", (text, dataTable) => {
  productNames(dataTable).forEach((name) => inventoryPage.shouldShowProductButton(name, text));
});

Then("o ícone do carrinho deve exibir {int} itens", (count) => {
  header.shouldShowCartCount(count);
});

Then("o ícone do carrinho deve estar vazio", () => {
  header.shouldShowEmptyCart();
});

Then("o carrinho deve conter exatamente os produtos:", (dataTable) => {
  cartPage.shouldBeDisplayed();
  cartPage.shouldContainExactly(toCartItems(dataTable));
});

Then("o carrinho deve estar vazio", () => {
  cartPage.shouldBeEmpty();
});

Then("o botão de checkout deve estar desabilitado", () => {
  cartPage.shouldHaveCheckoutDisabled();
});

Then("a página de produtos deve ser exibida", () => {
  inventoryPage.shouldBeDisplayed();
});

Then("a etapa de informações do comprador deve ser exibida", () => {
  checkoutInformationPage.shouldBeDisplayed();
});

Then("os dados do comprador devem estar preenchidos com {string}", (caso) => {
  withCustomer(caso, (customer) => checkoutInformationPage.shouldHaveValues(customer));
});

Then("devo ver a mensagem de erro do checkout {string}", (message) => {
  checkoutInformationPage.shouldShowError(message);
});

Then("os campos do comprador devem ser destacados com erro", () => {
  checkoutInformationPage.shouldHighlightFields();
});

Then("devo permanecer na etapa de informações do comprador", () => {
  checkoutInformationPage.shouldBeDisplayed();
});

Then("a revisão do pedido deve ser exibida", () => {
  checkoutOverviewPage.shouldBeDisplayed();
});

Then("a revisão do pedido deve conter exatamente os produtos:", (dataTable) => {
  checkoutOverviewPage.shouldContainExactly(toCartItems(dataTable));
});

Then("a forma de pagamento deve ser {string}", (text) => {
  checkoutOverviewPage.shouldShowPaymentInfo(text);
});

Then("a forma de entrega deve ser {string}", (text) => {
  checkoutOverviewPage.shouldShowShippingInfo(text);
});

Then("o resumo deve exibir subtotal {string}, taxa {string} e total {string}", (subtotal, tax, total) => {
  checkoutOverviewPage.shouldShowSummary({ subtotal, tax, total });
});

Then("o subtotal deve corresponder à soma dos preços dos produtos", () => {
  checkoutOverviewPage.shouldHaveSubtotalMatchingItems();
});

Then("o total deve corresponder ao subtotal somado à taxa", () => {
  checkoutOverviewPage.shouldHaveTotalMatchingSubtotalPlusTax();
});

Then("a confirmação do pedido deve ser exibida", () => {
  checkoutCompletePage.shouldBeDisplayed();
});
