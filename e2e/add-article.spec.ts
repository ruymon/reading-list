import { expect, test } from "@playwright/test";
import { authenticator } from "otplib";
import { env } from "../modules/shared/env";

const BASE_URL =
  process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://localhost:3000";

test.describe("AddArticle", () => {
  test("adds an article", async ({ page }) => {
    await page.goto(`${BASE_URL}`);
    await page.getByRole("button", { name: "Add new article" }).click();

    const dialog = page.getByRole("dialog", { name: "Add new article" });
    await expect(dialog).toBeAttached();

    await expect(dialog.getByLabel(/url/i)).toBeFocused();
    await dialog.getByLabel(/url/i).fill("https://example.com");
    await page.press("body", "Tab");

    await expect(dialog.getByLabel(/title/i)).toBeFocused();
    await expect(page.getByLabel(/title/i)).toHaveValue(/example domain/i);
    await page.press("body", "Tab");

    await expect(dialog.getByLabel(/tags/i)).toBeFocused();
    await dialog.getByLabel(/tags/i).fill("Nextjs");
    await page.press("body", "Enter");
    await dialog.getByLabel(/tags/i).fill("Frontend");
    await page.press("body", "Enter");
    await page.press("body", "Tab");

    await expect(dialog.getByLabel(/otp/i)).toBeFocused();
    await dialog
      .getByLabel(/otp/i)
      .fill(authenticator.generate(env.OTP_SECRET));
    await page.press("body", "Tab");

    await expect(dialog.getByRole("button", { name: /add/i })).toBeFocused();
    await page.press("body", "Enter");

    await expect(dialog).not.toBeAttached();

    const article = page.getByRole("link", { name: /example domain/i });
    const articleTags = page.getByTestId("tags");

    await expect(article).toBeAttached();
    await expect(articleTags.getByText(/nextjs/i)).toBeAttached();
    await expect(articleTags.getByText(/frontend/i)).toBeAttached();
  });

  test("it shows the page title when I fill the URL", async ({ page }) => {
    await page.goto(`${BASE_URL}`);
    await page.getByRole("button", { name: "Add new article" }).click();

    await page.getByLabel(/url/i).fill("https://example.com");
    await page.press("body", "Tab");

    await expect(page.getByLabel(/title/i)).toHaveValue(/example domain/i);
  });

  test("Ctrl + Space opens the modal", async ({ page }) => {
    await page.goto(BASE_URL);

    expect(
      await page.getByRole("dialog", { name: "Add new article" }).count()
    ).toBe(0);

    await page.press("body", "Control+ ");

    expect(
      await page.getByRole("dialog", { name: "Add new article" }).count()
    ).toBe(1);
  });

  test("providing invalid OTP shows an error message", async ({ page }) => {
    await page.goto(`${BASE_URL}`);
    await page.getByRole("button", { name: "Add new article" }).click();

    await page.getByLabel(/url/i).fill("https://example.com");
    await page.getByLabel(/tags/i).fill("Nextjs");
    await page.getByLabel(/tags/i).press("Enter");
    await page.getByLabel(/otp/i).fill("555555");

    await page
      .getByRole("dialog", { name: "Add new article" })
      .getByRole("button", { name: "Add" })
      .click();

    await page.getByText(/invalid otp provided/i).waitFor({ state: "visible" });
  });
});
