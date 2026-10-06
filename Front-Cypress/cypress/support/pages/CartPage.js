import el from "../elements/CartElements";
import header from "./components/Header";
import cartItems from "./components/CartItemList";

/** Page Object do carrinho. Os seletores ficam em ../elements/CartElements. */
class CartPage {
  constructor() {
    this.path = "/cart.html";
  }

  open() {
    header.openCart();
    this.shouldBeDisplayed();
  }

  checkout() {
    cy.get(el.checkoutButton).click();
  }

  continueShopping() {
    cy.get(el.continueShoppingButton).click();
  }

  removeProduct(name) {
    cartItems.removeProduct(name);
  }

  shouldBeDisplayed() {
    cy.location("pathname").should("eq", this.path);
    header.shouldHaveTitle("Your Cart");
    cy.get(el.cartList).should("be.visible");
    cy.get(el.checkoutButton).should("be.visible");
    cy.get(el.continueShoppingButton).should("be.visible");
  }

  shouldContainExactly(products) {
    cartItems.shouldContainExactly(products);
  }

  shouldBeEmpty() {
    cartItems.shouldBeEmpty();
    header.shouldShowEmptyCart();
  }

  shouldHaveCheckoutDisabled() {
    cy.get(el.checkoutButton).should("be.disabled");
  }
}

export default new CartPage();
