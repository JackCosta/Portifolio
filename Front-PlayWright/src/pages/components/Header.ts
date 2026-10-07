import { expect, type Locator, type Page } from "@playwright/test";

/** Cabeçalho comum a todas as telas após o login. */
export class Header {
  readonly appLogo: Locator;
  readonly title: Locator;
  readonly cartLink: Locator;
  readonly cartBadge: Locator;
  readonly menuButton: Locator;
  readonly logoutLink: Locator;

  constructor(page: Page) {
    this.appLogo = page.locator(".app_logo");
    this.title = page.getByTestId("title");
    this.cartLink = page.getByTestId("shopping-cart-link");
    this.cartBadge = page.getByTestId("shopping-cart-badge");
    this.menuButton = page.getByRole("button", { name: "Open Menu" });
    this.logoutLink = page.getByTestId("logout-sidebar-link");
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }

  /**
   * O primeiro clique no menu às vezes se perde enquanto a página termina de carregar. Nesse caso clica mais uma
   * vez, só depois de uma espera longa, para não fechar um menu que ainda está abrindo (animação).
   * O link precisa estar dentro da tela: durante a animação ele já é "visível", mas fora do viewport.
   */
  async openMenu(): Promise<void> {
    await this.menuButton.click();
    const opened = await this.logoutLink
      .waitFor({ state: "visible", timeout: 5_000 })
      .then(() => true)
      .catch(() => false);
    if (!opened) {
      await this.menuButton.click();
    }
    await expect(this.logoutLink).toBeInViewport({ ratio: 1 });
  }

  async logout(): Promise<void> {
    await this.openMenu();
    await this.logoutLink.click();
  }

  async expectTitle(title: string): Promise<void> {
    await expect(this.appLogo).toHaveText("Swag Labs");
    await expect(this.title).toHaveText(title);
  }

  async expectCartCount(count: number): Promise<void> {
    if (count === 0) {
      await expect(this.cartBadge).toBeHidden();
    } else {
      await expect(this.cartBadge).toHaveText(String(count));
    }
  }
}
