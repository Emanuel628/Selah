import { expect, test } from "@playwright/test";

test("Garden creates, persists, edits, filters, and deletes a reflection", async ({
  page,
}) => {
  await page.goto("/garden");
  await page.getByLabel("New note").click();
  await page.getByLabel("Scripture reference").fill("Romans 12:2");
  await page.getByLabel("Reflection title").fill("A renewed mind");
  await page
    .getByPlaceholder("What are you noticing?")
    .fill("Transformation begins with renewed patterns of thought.");
  await page.getByText("Application", { exact: true }).last().click();
  await page.getByText("Add Tag").click();
  await page.getByText("#Grace", { exact: true }).click();
  await page.getByText("Done", { exact: true }).click();
  await page.getByText("Save reflection").click();
  await expect(
    page.getByText("A renewed mind", { exact: true }).last(),
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByText("A renewed mind", { exact: true }).last(),
  ).toBeVisible();
  await page.getByText("A renewed mind", { exact: true }).last().click();
  await page.getByLabel("Edit reflection").click();
  await page.getByLabel("Reflection title").fill("Renewed patterns");
  await page
    .getByPlaceholder("What are you noticing?")
    .fill("Renewed thinking produces transformed living.");
  await page.getByText("Save changes").click();
  await expect(
    page.getByText("Renewed patterns", { exact: true }).last(),
  ).toBeVisible();
  await page.goto("/garden");
  await expect(
    page.getByText("Renewed patterns", { exact: true }).last(),
  ).toBeVisible();

  await page.getByLabel("Advanced filters").click();
  await page.getByText("Application", { exact: true }).last().click();
  await page.getByText(/Show 1/).click();
  await expect(
    page.getByText("Renewed patterns", { exact: true }).last(),
  ).toBeVisible();
  await expect(
    page.getByText("Life moving over chaos", { exact: true }),
  ).toHaveCount(0);

  await page.getByText("Renewed patterns", { exact: true }).last().click();
  await page.getByLabel("Delete reflection").click();
  await page.getByLabel("Confirm delete reflection").click();
  await expect(page).toHaveURL(/\/garden$/);
  await expect(page.getByText("Renewed patterns", { exact: true })).toHaveCount(
    0,
  );
});

test("Bookmark color palette scrolls to every color", async ({ page }) => {
  await page.goto("/bookmark-settings");
  const charcoal = page.getByLabel("Charcoal bookmark color");
  await charcoal.scrollIntoViewIfNeeded();
  await expect(charcoal).toBeVisible();
  await charcoal.click();
  await expect(page.getByText("Selected", { exact: true })).toBeVisible();
});

test("Garden uses one compact advanced-filter surface", async ({ page }) => {
  await page.goto("/garden");
  await expect(page.getByText("All", { exact: true })).toHaveCount(0);
  await page.getByLabel("Advanced filters").click();
  const title = page.getByText("Filter Garden", { exact: true });
  const apply = page.getByText(/Show \d+/);
  await expect(title).toBeVisible();
  await expect(apply).toBeVisible();
  const titleBox = await title.boundingBox();
  const applyBox = await apply.boundingBox();
  expect(titleBox).not.toBeNull();
  expect(applyBox).not.toBeNull();
  expect(applyBox!.y + applyBox!.height - titleBox!.y).toBeLessThan(500);
});

test("Reading preferences save and persist with confirmation", async ({
  page,
}) => {
  await page.goto("/preferences");
  await page.getByLabel("Increase text size").click();
  await expect(page.getByText(/22 pt/)).toBeVisible();
  await page.getByLabel("Save reading preferences").click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText(/22 pt/)).toBeVisible();
});
