import { expect, test } from "@playwright/test";

test("Garden creates, persists, edits, filters, and deletes a reflection", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Reflect on this passage").click();
  await page
    .getByLabel("Reflection text")
    .fill("Transformation begins with renewed patterns of thought.");
  await page.getByText("Add details").click();
  await page.getByLabel("Reflection title").fill("A renewed mind");
  await page.getByText("Application", { exact: true }).last().click();
  await page.getByText("Add Theme").click();
  await page.getByText("#Grace", { exact: true }).click();
  await page.getByText("Done", { exact: true }).click();
  await page.getByText("Save to Garden").click();
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
    .getByLabel("Reflection text")
    .fill("Renewed thinking produces transformed living.");
  await page.getByText("Save to Garden").click();
  await expect(
    page.getByText("Renewed patterns", { exact: true }).last(),
  ).toBeVisible();
  await page.goto("/garden");
  await expect(
    page.getByText("Renewed patterns", { exact: true }).last(),
  ).toBeVisible();

  await page.getByLabel("Advanced filters").click();
  await page.getByText("Application", { exact: true }).last().click();
  await page.getByText("Apply").click();
  await expect(
    page.getByText("Renewed patterns", { exact: true }).last(),
  ).toBeVisible();
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
  await page.goto("/");
  await page.getByLabel("Reflect on this passage").click();
  await page.getByLabel("Reflection text").fill("Filterable reflection");
  await page.getByText("Save to Garden").click();
  await expect(page.getByText("Reflections", { exact: true })).toBeVisible();
  await page.getByLabel("Advanced filters").click();
  const title = page.getByText("Filter Garden", { exact: true });
  const apply = page.getByText("Apply", { exact: true });
  await expect(title).toBeVisible();
  await expect(apply).toBeVisible();
  const titleBox = await title.boundingBox();
  const applyBox = await apply.boundingBox();
  expect(titleBox).not.toBeNull();
  expect(applyBox).not.toBeNull();
  expect(applyBox!.y + applyBox!.height - titleBox!.y).toBeLessThan(500);
});

test("Garden uses contextual search and unclipped reflection pills", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Reflect on this passage").click();
  await page.getByLabel("Reflection text").fill("Grace helps me trust and wait with hope.");
  await page.getByText("Add details").click();
  await page.getByLabel("Reflection title").fill("Grace and hope");
  await page.getByText("Add Theme").click();
  await page.getByText("#Grace", { exact: true }).click();
  await page.getByText("Done", { exact: true }).click();
  await page.getByText("Save to Garden").click();

  await expect(page.getByPlaceholder("Search reflections")).toBeVisible();
  const allPill = page.getByText("All", { exact: true }).first();
  const firstCard = page.getByText("Grace and hope", { exact: true }).last();
  await expect(allPill).toBeVisible();
  await expect(firstCard).toBeVisible();
  const pillBox = await allPill.boundingBox();
  const cardBox = await firstCard.boundingBox();
  expect(pillBox).not.toBeNull();
  expect(cardBox).not.toBeNull();
  expect(pillBox!.y + pillBox!.height).toBeLessThan(cardBox!.y);

  await page.getByRole("tab", { name: "Browse" }).click();
  await expect(page.getByPlaceholder("Search reflections")).toHaveCount(0);
  await page.getByLabel("Open Grace").click();
  await expect(page.getByPlaceholder("Search within Grace")).toBeVisible();
  await page.getByRole("tab", { name: "Insights" }).click();
  await expect(page.getByPlaceholder(/Search/)).toHaveCount(0);
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

test("Garden insight and Revisit CTAs avoid duplicate user actions", async ({
  page,
}) => {
  const notes = [
    ["Grace question", "How does grace help me trust when the outcome is unclear?", "Question"],
    ["Grace interpretation", "Grace means I can depend on God before I see the outcome.", "Interpretation"],
    ["Grace application", "Practice trust by praying before defending myself.", "Application"],
  ] as const;
  for (const [title, body, type] of notes) {
    await page.goto("/");
    await page.getByLabel("Reflect on this passage").click();
    await page.getByLabel("Reflection text").fill(body);
    await page.getByText("Add details").click();
    await page.getByLabel("Reflection title").fill(title);
    await page.getByText(type, { exact: true }).last().click();
    await page.getByText("Add Theme").click();
    await page.getByText("#Grace", { exact: true }).click();
    await page.getByText("Done", { exact: true }).click();
    await page.getByText("Save to Garden").click();
    await expect(page).toHaveURL(/\/garden$/);
  }

  await page.getByRole("tab", { name: "Insights" }).click();
  const insightCards = page.locator("text=STRONG PATTERN").or(page.locator("text=EMERGING PATTERN"));
  await expect(insightCards.first()).toBeVisible();
  await expect(page.getByText("Why you’re seeing this").first()).toBeVisible();
  await page.getByText("Why you’re seeing this").first().click();
  await expect(page.getByText(/supporting reflections?/)).toBeVisible();
  await page.getByLabel("Close").click();
  const viewEvidenceCount = await page.getByText("View evidence", { exact: true }).count();
  expect(viewEvidenceCount).toBeLessThanOrEqual(1);

  await page.getByText("Revisit", { exact: true }).last().click();
  await expect(page.getByText("Worth returning to today", { exact: true })).toBeVisible();
  await expect(page.getByText("Mark resolved", { exact: true })).toHaveCount(0);
});
