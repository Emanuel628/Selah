import { expect, test } from "@playwright/test";

test.describe("Reader dashboard flow", () => {
  test("keeps settings off the dashboard and presents a clear reading hierarchy", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByText("Read", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Genesis 1", { exact: true })).toBeVisible();
    await expect(page.getByText("Page 1 of 4", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Choose Bible version")).toHaveCount(0);
    await expect(page.getByLabel("Reading options")).toHaveCount(0);
    await expect(page.getByLabel("Bookmark this page")).toBeVisible();
  });

  test("moves page-to-page and chooses a chapter from the top dropdown", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByLabel("Next page").click();
    await expect(page.getByText("Page 2 of 4", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Previous page", { exact: true }),
    ).toBeVisible();
    await page.getByLabel("Choose book and chapter").click();
    await page.getByText("Exodus", { exact: true }).click();
    await page.getByLabel("Exodus chapter 3", { exact: true }).click();
    await page.getByLabel("Exodus chapter 3 page 1", { exact: true }).click();
    await expect(page.getByText("Exodus 3", { exact: true })).toBeVisible();
    await expect(page.getByText("Page 1 of 3", { exact: true })).toBeVisible();
  });

  test("keeps the complete footer inside the phone viewport", async ({
    page,
  }) => {
    await page.goto("/");
    const footerLabel = page.getByText("Settings", { exact: true }).last();
    const box = await footerLabel.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y + box!.height).toBeLessThanOrEqual(915 - 8);
    await footerLabel.click();
    await expect(page.getByText("READER SETTINGS")).toBeVisible();
  });
});
