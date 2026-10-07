import { expect, type Locator, type Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { Header } from "./components/Header";

/** Tela de produtos (/inventory.html), exibida após o login. */
export class InventoryPage extends BasePage {
  protected readonly path = "/inventory.html";

  readonly header: Header;
  readonly container: Locator;
  readonly items: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new Header(page);
    this.container = page.getByTestId("inventory-container");
    this.items = page.getByTestId("inventory-item");
  }

  item(name: string): Locator {
    return this.items.filter({
      has: this.page.getByTestId("inventory-item-name").getByText(name, { exact: true }),
    });
  }

  async addToCart(name: string): Promise<void> {
    await this.item(name).getByRole("button", { name: "Add to cart" }).click();
  }

  async expectLoaded(): Promise<void> {
    await this.expectUrl();
    await this.header.expectTitle("Products");
    await expect(this.container).toBeVisible();
  }

  async expectItemCount(count: number): Promise<void> {
    await expect(this.items).toHaveCount(count);
  }

  async expectItemInCart(name: string): Promise<void> {
    await expect(this.item(name).getByRole("button", { name: "Remove" })).toBeVisible();
  }
}
