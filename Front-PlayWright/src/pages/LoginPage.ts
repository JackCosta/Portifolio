import { expect, type Locator, type Page } from "@playwright/test";
import type { Credentials } from "../data/users";
import { BasePage } from "./BasePage";

/** Tela de login (https://www.saucedemo.com/). */
export class LoginPage extends BasePage {
  protected readonly path = "/";

  readonly logo: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly errorCloseButton: Locator;
  readonly errorIcons: Locator;

  constructor(page: Page) {
    super(page);
    this.logo = page.locator(".login_logo");
    this.usernameInput = page.getByTestId("username");
    this.passwordInput = page.getByTestId("password");
    this.loginButton = page.getByTestId("login-button");
    this.errorMessage = page.getByTestId("error");
    this.errorCloseButton = page.getByTestId("error-button");
    this.errorIcons = page.locator(".form_group .error_icon");
  }

  async fillCredentials({ username, password }: Credentials): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
  }

  async login(credentials: Credentials): Promise<void> {
    await this.fillCredentials(credentials);
    await this.loginButton.click();
  }

  async loginPressingEnter(credentials: Credentials): Promise<void> {
    await this.fillCredentials(credentials);
    await this.passwordInput.press("Enter");
  }

  async closeError(): Promise<void> {
    await this.errorCloseButton.click();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveTitle("Swag Labs");
    await expect(this.logo).toHaveText("Swag Labs");
    await expect(this.usernameInput).toBeVisible();
    await expect(this.usernameInput).toHaveAttribute("placeholder", "Username");
    await expect(this.passwordInput).toBeVisible();
    await expect(this.passwordInput).toHaveAttribute("type", "password");
    await expect(this.loginButton).toBeEnabled();
    await expect(this.loginButton).toHaveValue("Login");
  }

  async expectOnLoginPage(): Promise<void> {
    await this.expectUrl();
    await expect(this.loginButton).toBeVisible();
  }

  async expectError(message: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toHaveText(message);
  }

  async expectFieldsHighlighted(): Promise<void> {
    await expect(this.usernameInput).toHaveClass(/input_error/);
    await expect(this.passwordInput).toHaveClass(/input_error/);
    await expect(this.errorIcons).toHaveCount(2);
  }

  async expectNoError(): Promise<void> {
    await expect(this.errorMessage).toBeHidden();
  }

  async expectNoErrorIcons(): Promise<void> {
    await expect(this.errorIcons).toHaveCount(0);
  }
}
