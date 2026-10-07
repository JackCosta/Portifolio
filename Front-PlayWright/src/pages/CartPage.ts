import { expect, type Locator, type Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { Header } from "./components/Header";

/** Carrinho de compras (/cart.html). */
export class CartPage extends BasePage {
  protected readonly path = "/cart.html";

  readonly header: Header;
  readonly itemNames: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new Header(page);
    this.itemNames = page.getByTestId("inventory-item-name");
    this.checkoutButton = page.getByTestId("checkout");
  }

  async checkout(): Promise<void> {
    await this.checkoutButton.click();
  }

  async expectLoaded(): Promise<void> {
    await this.expectUrl();
    await this.header.expectTitle("Your Cart");
  }

  async expectItems(names: string[]): Promise<void> {
    await expect(this.itemNames).toHaveText(names);
  }
}
