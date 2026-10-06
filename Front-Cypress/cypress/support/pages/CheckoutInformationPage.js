import el from "../elements/CheckoutInformationElements";
import header from "./components/Header";

/** Page Object da etapa "Checkout: Your Information". */
class CheckoutInformationPage {
  constructor() {
    this.path = "/checkout-step-one.html";
  }

  /** Campos vazios não são digitados, para simular o preenchimento incompleto. */
  fill({ firstName, lastName, postalCode }) {
    this.fillField(el.firstNameInput, firstName);
    this.fillField(el.lastNameInput, lastName);
    this.fillField(el.postalCodeInput, postalCode);
  }

  fillField(selector, value) {
    cy.get(selector).clear();
    if (value) cy.get(selector).type(value);
  }

  continue() {
    cy.get(el.continueButton).click();
  }

  cancel() {
    cy.get(el.cancelButton).click();
  }

  closeError() {
    cy.get(el.errorCloseButton).click();
  }

  shouldBeDisplayed() {
    cy.location("pathname").should("eq", this.path);
    header.shouldHaveTitle("Checkout: Your Information");
    cy.get(el.firstNameInput).should("be.visible").and("have.attr", "placeholder", "First Name");
    cy.get(el.lastNameInput).should("be.visible").and("have.attr", "placeholder", "Last Name");
    cy.get(el.postalCodeInput).should("be.visible").and("have.attr", "placeholder", "Zip/Postal Code");
  }

  shouldHaveValues({ firstName, lastName, postalCode }) {
    cy.get(el.firstNameInput).should("have.value", firstName);
    cy.get(el.lastNameInput).should("have.value", lastName);
    cy.get(el.postalCodeInput).should("have.value", postalCode);
  }

  shouldShowError(message) {
    cy.get(el.errorMessage).should("be.visible").and("have.text", message);
  }

  shouldNotShowError() {
    cy.get(el.errorMessage).should("not.exist");
  }

  shouldHighlightFields() {
    [el.firstNameInput, el.lastNameInput, el.postalCodeInput].forEach((selector) =>
      cy.get(selector).should("have.class", "input_error"),
    );
    cy.get(el.errorIcon).should("have.length", 3);
  }
}

export default new CheckoutInformationPage();
