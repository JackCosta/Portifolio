import { expect, type Page } from "@playwright/test";

/** Base de todas as páginas: navegação e validação de URL. */
export abstract class BasePage {
  /** Caminho relativo à baseURL (ex.: "/inventory.html"). */
  protected abstract readonly path: string;

  constructor(protected readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto(this.path);
  }

  async expectUrl(): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`${escapeRegExp(this.path)}$`));
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
