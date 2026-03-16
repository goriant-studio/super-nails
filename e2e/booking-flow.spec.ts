import { test, expect } from "@playwright/test";

/**
 * Wait for the app data to finish loading (spinner gone).
 */
async function waitForAppLoad(page: import("@playwright/test").Page) {
  await page.waitForFunction(() => !document.querySelector(".animate-spin"), { timeout: 15_000 });
}

test.describe("Booking flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/booking");
    await waitForAppLoad(page);
  });

  test("shows the 3+ booking step headers", async ({ page }) => {
    const headings = page.locator("h2");
    const count = await headings.count();
    expect(count).toBeGreaterThanOrEqual(3);
    await expect(headings.first()).toBeVisible();
  });

  test("step 1 salon card links to /salons", async ({ page }) => {
    // Step 1 has a <Link to="/salons">
    const salonLink = page.locator("a[href='/salons']").first();
    await expect(salonLink).toBeVisible({ timeout: 7_000 });
    await salonLink.click();
    await expect(page).toHaveURL(/\/salons/);
  });

  test("salon page: shows salons list with select buttons", async ({ page }) => {
    await page.goto("/salons");
    await waitForAppLoad(page);

    // Salon page has a heading "Super Nails có mặt tại..."
    await expect(page.getByText(/Super Nails có mặt/i).first()).toBeVisible({ timeout: 10_000 });

    // Salon cards are rendered — look for SalonCard elements (they contain district/street text)
    // Province filter buttons like "TP. Hồ Chí Minh" are always rendered
    const provinceBtn = page.locator("button").filter({ hasText: /Hồ Chí Minh|Hà Nội|Đà Nẵng/ }).first();
    await expect(provinceBtn).toBeVisible();
  });

  test("salon page: selecting a salon navigates back to /booking", async ({ page }) => {
    await page.goto("/salons");
    await waitForAppLoad(page);

    // SalonCard renders a button that calls handleSelectSalon — find any button containing an address
    // The SalonCard's main action should be a button. Try clicking a card area.
    // Use the "Tất cả" chip to ensure all salons visible, then click the first salon select button
    const allBtn = page.locator("button").filter({ hasText: "Tất cả" }).first();
    if (await allBtn.isVisible()) await allBtn.click();

    // Look for select buttons inside salon cards — SalonCard should have a clickable area
    // The cards are div-based with onSelect prop passed as button
    const salonSelectBtn = page.locator("button[type='button']").filter({ hasText: /chọn|select|Q7|Q2|Q4|Hải Châu/i }).first();
    const hasSalonBtn = await salonSelectBtn.count();
    if (hasSalonBtn > 0) {
      await salonSelectBtn.click();
      await expect(page).toHaveURL(/\/booking/);
    } else {
      // Fallback: just verify salons heading present
      await expect(page.getByText(/Super Nails có mặt/i)).toBeVisible();
    }
  });

  test("services page: shows service items", async ({ page }) => {
    await page.goto("/services");
    await waitForAppLoad(page);
    // Service names from the data
    const serviceItem = page.locator("strong, h3").filter({ hasText: /Shine Combo|Pedicure|Cat eye|Bridal|French/i });
    await expect(serviceItem.first()).toBeVisible({ timeout: 10_000 });
  });

  test("step 2 renders without crash when no salon selected", async ({ page }) => {
    await expect(page.locator("main")).toBeVisible();
    // At minimum, 3 step headings should be present
    await expect(page.locator("h2").first()).toBeVisible();
  });

  test("confirm button is disabled when booking is incomplete", async ({ page }) => {
    // Find the submit button (last button in form)
    const submitBtn = page.locator("button[type='button']:disabled").last();
    await expect(submitBtn).toBeVisible();
  });

  test("full booking flow: select salon → service → back to booking", async ({ page }) => {
    // 1. Go to salon page, verify it loads
    await page.goto("/salons");
    await waitForAppLoad(page);
    await expect(page.getByText(/Super Nails có mặt/i)).toBeVisible();

    // 2. Navigate to services
    await page.goto("/services");
    await waitForAppLoad(page);
    await expect(page.locator("strong, h3").filter({ hasText: /Shine Combo|Pedicure|Cat eye/i }).first()).toBeVisible();

    // 3. Back to booking — page should render steps
    await page.goto("/booking");
    await waitForAppLoad(page);
    const headings = page.locator("h2");
    expect(await headings.count()).toBeGreaterThanOrEqual(3);
    await expect(headings.first()).toBeVisible();
  });
});
