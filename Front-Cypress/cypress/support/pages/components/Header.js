import el from "../../elements/HeaderElements";

/** Componente do cabeçalho (logo, título da página, carrinho e menu). */
class Header {
  shouldHaveTitle(title) {
    cy.get(el.appLogo).should("be.visible").and("have.text", "Swag Labs");
    cy.get(el.title).should("be.visible").and("have.text", title);
  }

  openCart() {
    cy.get(el.shoppingCartLink).click();
  }

  logout() {
    cy.get(el.menuButton).click();
    cy.get(el.logoutLink).should("be.visible").click();
  }

  shouldShowCartCount(count) {
    cy.get(el.shoppingCartBadge).should("be.visible").and("have.text", String(count));
  }

  shouldShowEmptyCart() {
    cy.get(el.shoppingCartLink).should("be.visible");
    cy.get(el.shoppingCartBadge).should("not.exist");
  }

  shouldShowMenuAndCart() {
    cy.get(el.shoppingCartLink).should("be.visible");
    cy.get(el.menuButton).should("be.visible");
  }
}

export default new Header();
