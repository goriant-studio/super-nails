import { test, expect } from "@playwright/test";

/**
 * Wait for the app data to finish loading (spinner gone).
 * The loading spinner has class `animate-spin`.
 */
async function waitForAppLoad(page: import("@playwright/test").Page) {
  await page.waitForFunction(() => !document.querySelector(".animate-spin"), { timeout: 15_000 });
}

test.describe("Home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForAppLoad(page);
  });

  test("loads and shows app branding (SN avatar + hero heading)", async ({ page }) => {
    // Title tag
    await expect(page).toHaveTitle(/Super Nails/i);
    // The "SN" avatar abbreviation in the header section is always visible
    await expect(page.getByText("SN").first()).toBeVisible();
    // The hero section (gradient header) should be rendered
    await expect(page.locator("section").first()).toBeVisible();
  });

  test("Book Now / Đặt lịch link navigates to /booking", async ({ page }) => {
    const bookLink = page.locator("a[href='/booking']").first();
    await expect(bookLink).toBeVisible();
    await bookLink.click();
    await expect(page).toHaveURL(/\/booking/);
  });

  test("Salons / Chi nhánh link navigates to /salons", async ({ page }) => {
    // Quick links grid has links to /salons, /booking, /services
    const salonLink = page.locator("a[href='/salons']").first();
    await expect(salonLink).toBeVisible();
    await salonLink.click();
    await expect(page).toHaveURL(/\/salons/);
  });

  test("Services link navigates to /services", async ({ page }) => {
    const servicesLink = page.locator("a[href='/services']").first();
    await expect(servicesLink).toBeVisible();
    await servicesLink.click();
    await expect(page).toHaveURL(/\/services/);
  });

  test("language toggle switches between EN and VI", async ({ page }) => {
    // The toggle button has aria-label="Toggle language"
    const toggleBtn = page.getByRole("button", { name: /toggle language/i });
    await expect(toggleBtn).toBeVisible();
    const initialText = await toggleBtn.innerText();

    await toggleBtn.click();
    await page.waitForTimeout(300);
    const newText = await toggleBtn.innerText();
    expect(newText).not.toBe(initialText);

    // Restore
    await toggleBtn.click();
    await page.waitForTimeout(300);
    expect(await toggleBtn.innerText()).toBe(initialText);
  });
});
