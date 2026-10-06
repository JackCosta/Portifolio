import el from "../elements/CheckoutCompleteElements";
import header from "./components/Header";

/** Page Object da confirmação de compra ("Checkout: Complete!"). */
class CheckoutCompletePage {
  constructor() {
    this.path = "/checkout-complete.html";
  }

  backToProducts() {
    cy.get(el.backToProductsButton).click();
  }

  shouldBeDisplayed() {
    cy.location("pathname").should("eq", this.path);
    header.shouldHaveTitle("Checkout: Complete!");
    cy.get(el.ponyExpressImage).should("be.visible");
    cy.get(el.completeHeader).should("be.visible").and("have.text", "Thank you for your order!");
    cy.get(el.completeText)
      .should("be.visible")
      .and(
        "have.text",
        "Your order has been dispatched, and will arrive just as fast as the pony can get there!",
      );
    cy.get(el.backToProductsButton).should("be.visible").and("have.text", "Back Home");
  }
}

export default new CheckoutCompletePage();
