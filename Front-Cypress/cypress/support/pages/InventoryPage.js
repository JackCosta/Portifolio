import el from "../elements/InventoryElements";
import header from "./components/Header";

/** Page Object da tela de produtos. Os seletores ficam em ../elements/InventoryElements. */
class InventoryPage {
  constructor() {
    this.path = "/inventory.html";
  }

  visit() {
    cy.visit(this.path, { failOnStatusCode: false });
  }

  logout() {
    header.logout();
  }

  productCard(name) {
    return cy.contains(el.inventoryItem, name);
  }

  addProduct(name) {
    this.productCard(name).find(el.itemActionButton).should("have.text", "Add to cart").click();
  }

  removeProduct(name) {
    this.productCard(name).find(el.itemActionButton).should("have.text", "Remove").click();
  }

  shouldBeDisplayed() {
    cy.location("pathname").should("eq", this.path);
    header.shouldHaveTitle("Products");
    header.shouldShowMenuAndCart();
    cy.get(el.inventoryContainer).should("be.visible");
    cy.get(el.sortSelect).should("be.visible");
  }

  shouldListProducts(quantity) {
    cy.get(el.inventoryItem).should("have.length", quantity).and("be.visible");
  }

  shouldShowProductPrice(name, price) {
    this.productCard(name).find(el.itemPrice).should("have.text", price);
  }

  shouldShowProductButton(name, text) {
    this.productCard(name).find(el.itemActionButton).should("have.text", text);
  }

  shouldHaveSessionFor(username) {
    cy.getCookie("session-username").should("exist").its("value").should("eq", username);
  }
}

export default new InventoryPage();
