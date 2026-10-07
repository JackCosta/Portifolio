import { expect, type Locator, type Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { Header } from "./components/Header";

export type CustomerInfo = { firstName: string; lastName: string; postalCode: string };

/** Formulário de dados do comprador (/checkout-step-one.html). */
export class CheckoutInformationPage extends BasePage {
  protected readonly path = "/checkout-step-one.html";

  readonly header: Header;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new Header(page);
    this.firstNameInput = page.getByTestId("firstName");
    this.lastNameInput = page.getByTestId("lastName");
    this.postalCodeInput = page.getByTestId("postalCode");
    this.continueButton = page.getByTestId("continue");
    this.cancelButton = page.getByTestId("cancel");
    this.errorMessage = page.getByTestId("error");
  }

  async fill({ firstName, lastName, postalCode }: CustomerInfo): Promise<void> {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.postalCodeInput.fill(postalCode);
  }

  async submit(): Promise<void> {
    await this.continueButton.click();
  }

  async expectLoaded(): Promise<void> {
    await this.expectUrl();
    await this.header.expectTitle("Checkout: Your Information");
    for (const [input, placeholder] of [
      [this.firstNameInput, "First Name"],
      [this.lastNameInput, "Last Name"],
      [this.postalCodeInput, "Zip/Postal Code"],
    ] as const) {
      await expect(input).toBeVisible();
      await expect(input).toBeEditable();
      await expect(input).toBeEmpty();
      await expect(input).toHaveAttribute("placeholder", placeholder);
    }
    await expect(this.continueButton).toBeEnabled();
    await expect(this.cancelButton).toBeEnabled();
  }

  async expectError(message: string): Promise<void> {
    await expect(this.errorMessage).toHaveText(message);
  }
}
