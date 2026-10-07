import { expect, type Locator, type Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { Header } from "./components/Header";

/** Revisão do pedido (/checkout-step-two.html). */
export class CheckoutOverviewPage extends BasePage {
  protected readonly path = "/checkout-step-two.html";

  readonly header: Header;
  readonly itemNames: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new Header(page);
    this.itemNames = page.getByTestId("inventory-item-name");
  }

  async expectLoaded(): Promise<void> {
    await this.expectUrl();
    await this.header.expectTitle("Checkout: Overview");
  }

  async expectItems(names: string[]): Promise<void> {
    await expect(this.itemNames).toHaveText(names);
  }
}
