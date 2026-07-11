import { expect, test } from "@playwright/test";

test("primary navigation exposes the approved top-level pages", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByText("Genesis 1", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page
      .getByText(/In the beginning God created the heavens and the earth/)
      .last(),
  ).toBeVisible();
  await page.getByText("Garden", { exact: true }).last().click();
  await expect(page.getByText("My Garden", { exact: true })).toBeVisible();
  await page.getByText("Search", { exact: true }).last().click();
  await expect(page.getByText("Global Search", { exact: true })).toBeVisible();
  await page.getByText("Settings", { exact: true }).last().click();
  await expect(page.getByText("READER SETTINGS")).toBeVisible();
});

test("Bible version can be selected from Settings and updates the Reader", async ({
  page,
}) => {
  await page.goto("/settings");
  await page.getByText("Bible Version").click();
  await expect(
    page.getByText("Berean Standard Bible", { exact: true }).last(),
  ).toBeVisible();
  await page.getByPlaceholder("Search English versions").fill("King James");
  const kingJames = page.getByText(/King James Version/i).first();
  await expect(kingJames).toBeVisible();
  await kingJames.click();
  await page.getByText("Read", { exact: true }).last().click();
  await expect(
    page.getByText(/In the beginning God created the heaven and the earth/i),
  ).toBeVisible();
});

test("registration onboarding requires a Bible-version choice before entering Selah", async ({
  page,
}) => {
  await page.goto("/register");
  await page.getByLabel("Full Name").fill("Test Reader");
  await page.getByLabel("Email Address").fill("reader@example.com");
  await page.getByLabel("Create Password").fill("Selah!2026");
  await expect(page.getByLabel("Create Password")).toHaveAttribute(
    "type",
    "password",
  );
  await page.getByRole("checkbox", { name: "Show password" }).click();
  await expect(page.getByLabel("Create Password")).not.toHaveAttribute(
    "type",
    "password",
  );
  await expect(page.getByText("At least 8 characters")).toBeVisible();
  await page.getByText("Create Free Account").click();
  await expect(
    page.getByText("Choose the version you want to read"),
  ).toBeVisible();
  await page
    .getByPlaceholder("Search English versions")
    .fill("King James Version");
  await page.getByText("King James Version", { exact: true }).click();
  await expect(page.getByText("Continue with KJAV")).toBeVisible();
  await page.getByText("Continue with KJAV").click();
  await expect(
    page.getByText("Genesis 1", { exact: true }).first(),
  ).toBeVisible();
});

test("login password visibility and forgot-password recovery are operational", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Password").fill("Selah!2026");
  await expect(page.getByLabel("Password")).toHaveAttribute("type", "password");
  await page.getByRole("checkbox", { name: "Show password" }).click();
  await expect(page.getByLabel("Password")).not.toHaveAttribute(
    "type",
    "password",
  );
  await page.getByText("Forgot?", { exact: true }).click();
  await expect(
    page.getByText("Recover your peace", { exact: true }),
  ).toBeVisible();
  await page.route("**/auth/v1/recover", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
  );
  await page.getByLabel("Email Address").last().fill("reader@example.com");
  await page.getByText("Send Reset Link", { exact: true }).click();
  await expect(
    page.getByText("Reset instructions sent. Check your email.", {
      exact: true,
    }),
  ).toBeVisible();
});

test("first launch follows the device light appearance", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/settings");
  await expect(page.getByRole("switch").first()).not.toBeChecked();
  const titleColor = await page
    .getByText("Settings", { exact: true })
    .first()
    .evaluate((element) => getComputedStyle(element).color);
  expect(titleColor).toBe("rgb(32, 49, 43)");
});

test("Reader navigates by page and jumps to an exact book, chapter, and page", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page
      .getByText(/In the beginning God created the heavens and the earth/)
      .last(),
  ).toBeVisible();
  await page.getByLabel("Next page").click();
  await expect(page.getByText("Page 2 of 4")).toBeVisible();
  await page.getByLabel("Choose book and chapter").click();
  await page.getByText("Exodus", { exact: true }).click();
  await page.getByLabel("Exodus chapter 3", { exact: true }).click();
  await expect(page.getByText("PAGE", { exact: true })).toBeVisible();
  await page.getByLabel("Exodus chapter 3 page 1", { exact: true }).click();
  await expect(
    page.getByText("Exodus 3", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page
      .getByText(/Moses was shepherding the flock of his father-in-law Jethro/i)
      .last(),
  ).toBeVisible();
});

test("Reader bookmarks an exact page and Settings changes its color", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Next page").click();
  await page.getByLabel("Bookmark this page").click();
  await expect(page.getByLabel("Bookmarked")).toBeVisible();
  await page.getByText("Settings", { exact: true }).last().click();
  await page.getByText("Bookmark Color").click();
  await page.getByLabel("Rose bookmark color").click();
  await expect(page.getByText("Selected", { exact: true })).toBeVisible();
  await page.getByLabel("Go back").click();
  await page.getByText("Read", { exact: true }).last().click();
  await expect(page.getByLabel("Bookmarked")).toBeVisible();
});

test("Reader text size respects the phone maximum", async ({ page }) => {
  await page.goto("/settings");
  await page.getByText("Text Size").click();
  const increase = page.getByLabel("Increase text size");
  await increase.click();
  await increase.click();
  await increase.click();
  await expect(page.getByText("26 pt · Phone max 26 pt")).toBeVisible();
  await expect(increase).toHaveAttribute("aria-disabled", "true");
  await page.getByLabel("Go back").click();
  await page.getByText("Read", { exact: true }).last().click();
  const verse = page
    .getByText(/In the beginning God created the heavens and the earth/)
    .last();
  await expect(verse).toBeVisible();
  expect(
    await verse.evaluate((element) => getComputedStyle(element).fontSize),
  ).toBe("26px");
});

test("light mode applies the parchment theme across navigation and settings", async ({
  page,
}) => {
  await page.goto("/settings");
  await page.getByRole("switch").first().click();
  await expect(page.getByRole("switch").first()).not.toBeChecked();
  const titleColor = await page
    .getByText("Settings", { exact: true })
    .first()
    .evaluate((element) => getComputedStyle(element).color);
  expect(titleColor).toBe("rgb(32, 49, 43)");
  await page.getByText("Read", { exact: true }).last().click();
  await expect(
    page
      .getByText(/In the beginning God created the heavens and the earth/)
      .last(),
  ).toBeVisible();
});

test("Garden supports detail and create-note flows", async ({ page }) => {
  await page.goto("/garden");
  await page.getByText("Life moving over chaos", { exact: true }).click();
  await expect(page.getByText("SCRIPTURE ANCHOR")).toBeVisible();
  await page.getByLabel("Go back").click();
  await page.getByText("New note").click();
  await expect(page.getByText("New reflection", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Scripture reference")).toHaveValue(
    "Genesis 1 · Page 1",
  );
  await page.getByLabel("Reflection title").fill("Creation brings order");
  await page
    .getByPlaceholder("What are you noticing?")
    .fill("Light brings order to chaos.");
  await page.getByText("Add Tag").click();
  await page.getByText("#Grace").click();
  await page.getByPlaceholder("Type a tag").fill("Creation");
  await page.getByLabel("Add custom tag").click();
  await page.getByText("Done", { exact: true }).click();
  await expect(page.getByLabel("Remove Grace tag")).toBeVisible();
  await expect(page.getByLabel("Remove Creation tag")).toBeVisible();
  await page.getByText("Save reflection").click();
  await expect(page).toHaveURL(/\/garden$/);
  await expect(
    page.getByText("Creation brings order", { exact: true }).last(),
  ).toBeVisible();
});

test("Search scopes and opens Garden results", async ({ page }) => {
  await page.goto("/search");
  await page.getByPlaceholder("Search Scripture and your Garden").fill("chaos");
  await expect(page.getByText("2 RESULTS")).toBeVisible();
  await page.getByText("Garden", { exact: true }).first().click();
  await expect(page.getByText("1 RESULTS")).toBeVisible();
  await page.getByText("Life moving over chaos", { exact: true }).click();
  await expect(page.getByText("CONNECTIONS")).toBeVisible();
});

test("Daily Reminder time is editable, saveable, and reflected in Settings", async ({
  page,
}) => {
  await page.goto("/settings");
  await page.getByText("Daily Reminders").click();
  await page.getByLabel("Increase minutes").click();
  await page.getByText("PM", { exact: true }).click();
  await page.getByText("Save study rhythm").click();
  await expect(page.getByText("Saved ✓")).toBeVisible();
  await expect(page.getByText("Reminder saved for 8:05 PM.")).toBeVisible();
  await page.getByLabel("Go back").click();
  await expect(page.getByText("8:05 PM")).toBeVisible();
});

test("Sign Out returns to the approved login flow", async ({ page }) => {
  await page.goto("/settings");
  await page.getByText("Sign Out").click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByText("Continue your cultivation in the word."),
  ).toBeVisible();
  await expect(page.getByText("Sign In", { exact: true })).toBeVisible();
  await page.getByText("Create an account").click();
  await expect(page.getByText("Create Free Account")).toBeVisible();
  await expect(
    page.getByText("A distraction-free home for scriptural study."),
  ).toBeVisible();
});
