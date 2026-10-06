import el from "../elements/CheckoutOverviewElements";
import header from "./components/Header";
import cartItems from "./components/CartItemList";
import { parsePrice, sumPrices } from "../utils/money";

/** Page Object da etapa "Checkout: Overview" (revisão do pedido). */
class CheckoutOverviewPage {
  constructor() {
    this.path = "/checkout-step-two.html";
  }

  finish() {
    cy.get(el.finishButton).click();
  }

  cancel() {
    cy.get(el.cancelButton).click();
  }

  shouldBeDisplayed() {
    cy.location("pathname").should("eq", this.path);
    header.shouldHaveTitle("Checkout: Overview");
    cy.get(el.finishButton).should("be.visible").and("be.enabled");
  }

  shouldContainExactly(products) {
    cartItems.shouldContainExactly(products);
  }

  shouldShowPaymentInfo(text) {
    cy.get(el.paymentInfo).should("be.visible").and("have.text", text);
  }

  shouldShowShippingInfo(text) {
    cy.get(el.shippingInfo).should("be.visible").and("have.text", text);
  }

  shouldShowSummary({ subtotal, tax, total }) {
    cy.get(el.subtotalLabel).should("have.text", `Item total: ${subtotal}`);
    cy.get(el.taxLabel).should("have.text", `Tax: ${tax}`);
    cy.get(el.totalLabel).should("have.text", `Total: ${total}`);
  }

  /** O subtotal deve ser a soma de preço x quantidade dos itens listados. */
  shouldHaveSubtotalMatchingItems() {
    cartItems.sumDisplayedPrices("itemsSum");
    cy.get("@itemsSum").then((itemsSum) => {
      cy.get(el.subtotalLabel).invoke("text").then(parsePrice).should("eq", itemsSum);
    });
  }

  /** O total deve ser subtotal + taxa. */
  shouldHaveTotalMatchingSubtotalPlusTax() {
    cy.get(el.subtotalLabel).invoke("text").then(parsePrice).as("subtotal");
    cy.get(el.taxLabel).invoke("text").then(parsePrice).as("tax");
    cy.get("@subtotal").then((subtotal) => {
      cy.get("@tax").then((tax) => {
        cy.get(el.totalLabel)
          .invoke("text")
          .then(parsePrice)
          .should("eq", sumPrices([subtotal, tax]));
      });
    });
  }
}

export default new CheckoutOverviewPage();
