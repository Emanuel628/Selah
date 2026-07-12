import { expect, test } from "@playwright/test";

test("primary navigation exposes Read, Garden, and Revisit", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Genesis 1", { exact: true }).first()).toBeVisible();
  await expect(page.getByLabel("Reflect on this passage")).toBeVisible();
  await page.getByText("Garden", { exact: true }).last().click();
  await expect(page.getByText(/Your Garden begins|Reflections/)).toBeVisible();
  await page.getByText("Revisit", { exact: true }).last().click();
  await expect(page.getByText("Worth returning to today")).toBeVisible();
  await page.goto("/settings");
  await expect(page.getByText("READER SETTINGS")).toBeVisible();
});

test("Bible version can be selected from Settings and updates the Reader", async ({ page }) => {
  await page.goto("/settings");
  await page.getByText("Bible Version").click();
  await page.getByPlaceholder("Search English versions").fill("King James");
  await page.getByText(/King James Version/i).first().click();
  await page.getByText("Read", { exact: true }).last().click();
  await expect(
    page.getByText(/In the beginning God created the heaven and the earth/i),
  ).toBeVisible();
});

test("registration onboarding includes Bible version, guide, and plan choice", async ({ page }) => {
  await page.goto("/register");
  await expect(page.getByLabel("Back to sign in")).toBeVisible();
  await page.getByLabel("Full Name").fill("Test Reader");
  await page.getByLabel("Email Address").fill("reader@example.com");
  await page.getByLabel("Create Password").fill("Selah!2026");
  await page.getByRole("checkbox", { name: "Show password" }).click();
  await expect(page.getByLabel("Create Password")).not.toHaveAttribute("type", "password");
  await expect(page.getByText("At least 8 characters")).toBeVisible();
  await page.getByText("Create Free Account").click();
  await expect(page.getByText("Account created successfully")).toBeVisible();
  await page.getByText("Personalize Selah").click();
  await page.getByPlaceholder("Search English versions").fill("King James Version");
  await page.getByText("King James Version", { exact: true }).click();
  await page.getByText("Continue with KJAV").click();
  await expect(page.getByText("How Selah works")).toBeVisible();
  await page.getByText("See account options").click();
  await expect(page.getByText("Choose your Selah")).toBeVisible();
  await page.getByText("Continue with Free").click();
  await expect(page.getByText("Genesis 1", { exact: true }).first()).toBeVisible();
});

test("login password visibility and forgot-password recovery are operational", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Password").fill("Selah!2026");
  await expect(page.getByLabel("Password")).toHaveAttribute("type", "password");
  await page.getByRole("checkbox", { name: "Show password" }).click();
  await expect(page.getByLabel("Password")).not.toHaveAttribute("type", "password");
  await page.getByText("Forgot?", { exact: true }).click();
  await expect(page.getByText("Recover your peace", { exact: true })).toBeVisible();
  await page.route("**/auth/v1/recover", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
  );
  await page.getByLabel("Email Address").last().fill("reader@example.com");
  await page.getByText("Send Reset Link", { exact: true }).click();
  await expect(page.getByText("Reset instructions sent. Check your email.")).toBeVisible();
});

test("first launch follows the device light appearance", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/settings");
  await expect(page.getByRole("switch").first()).not.toBeChecked();
});

test("Reader navigates by page and jumps to an exact book, chapter, and page", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Next page").click();
  await expect(page.getByText("Page 2 of 4")).toBeVisible();
  await page.getByLabel("Choose book and chapter").click();
  await page.getByText("Exodus", { exact: true }).click();
  await page.getByLabel("Exodus chapter 3", { exact: true }).click();
  await page.getByLabel("Exodus chapter 3 page 1", { exact: true }).click();
  await expect(page.getByText("Exodus 3", { exact: true }).first()).toBeVisible();
});

test("Reader bookmarks an exact page and Settings changes its color", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Next page").click();
  await page.getByLabel("Bookmark this page").click();
  await expect(page.getByLabel("Bookmarked")).toBeVisible();
  await page.getByLabel("Open Settings").click();
  await page.getByText("Bookmark Color").click();
  await page.getByRole("radio", { name: "Rose bookmark color", exact: true }).click();
  await expect(page.getByText("Selected", { exact: true })).toBeVisible();
});

test("Reader text size respects the phone maximum", async ({ page }) => {
  await page.goto("/settings");
  await page.getByText("Text Size").click();
  const increase = page.getByLabel("Increase text size");
  await increase.click();
  await increase.click();
  await increase.click();
  await expect(increase).toHaveAttribute("aria-disabled", "true");
});

test("red lettering is applied when the Bible version provides Jesus-word metadata", async ({ page }) => {
  await page.goto("/settings");
  await page.getByText("Bible Version").click();
  await page.getByPlaceholder("Search English versions").fill("World English Bible");
  await page.getByText("World English Bible", { exact: true }).click();
  await page.getByText("Read", { exact: true }).last().click();
  await page.getByLabel("Choose book and chapter").click();
  await page.getByText("Matthew", { exact: true }).click();
  await page.getByLabel("Matthew chapter 5", { exact: true }).click();
  await page.getByLabel("Matthew chapter 5 page 1", { exact: true }).click();
  const words = page.getByText(/Blessed are the poor in spirit/).last();
  await expect(words).toBeVisible();
  expect(await words.evaluate((element) => getComputedStyle(element).color)).toBe(
    "rgb(214, 111, 104)",
  );
});

test("Reader Reflect creates a quick Garden reflection", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Reflect on this passage").click();
  await expect(page.getByText("New reflection", { exact: true })).toBeVisible();
  await expect(page.getByText(/Genesis 1:1-/).first()).toBeVisible();
  await page.getByLabel("Reflection text").fill("Light brings order to chaos.");
  await page.getByText("Add details").click();
  await page.getByLabel("Reflection title").fill("Creation brings order");
  await page.getByText("Add Theme").click();
  await page.getByText("#Grace").click();
  await page.getByPlaceholder("Type a theme").fill("Creation");
  await page.getByText("Add", { exact: true }).click();
  await page.getByText("Done", { exact: true }).click();
  await page.getByText("Save to Garden").click();
  await expect(page).toHaveURL(/\/garden$/);
  await expect(page.getByText("Creation brings order", { exact: true }).last()).toBeVisible();
});

test("Find passage shows the exact current book, chapter, and page with bookmark color", async ({
  page,
}) => {
  await page.goto("/passage-picker");
  const currentBook = page.getByLabel("Genesis current book");
  await expect(currentBook).toBeVisible({ timeout: 20000 });
  expect(await currentBook.evaluate((element) => getComputedStyle(element).borderColor)).toBe(
    "rgb(212, 167, 44)",
  );
  await currentBook.click();
  const currentChapter = page.getByLabel("Genesis chapter 1", { exact: true });
  await expect(currentChapter).toBeVisible();
  expect(
    await currentChapter.evaluate((element) => getComputedStyle(element).borderColor),
  ).toBe("rgb(212, 167, 44)");
  await currentChapter.click();
  const currentPage = page.getByLabel("Genesis chapter 1 page 1", { exact: true });
  await expect(currentPage).toBeVisible({ timeout: 20000 });
  expect(await currentPage.evaluate((element) => getComputedStyle(element).borderColor)).toBe(
    "rgb(212, 167, 44)",
  );
});

test("Search finds verse text across Scripture", async ({ page }) => {
  await page.goto("/search");
  await page.getByPlaceholder("Search Bible text").fill("created heavens");
  await expect(page.getByText("Genesis 1:1", { exact: true })).toBeVisible({
    timeout: 20000,
  });
  await expect(page.getByTestId("highlighted-match").first()).toBeVisible();
});

test("Daily Reminder time is editable, saveable, and reflected in Settings", async ({ page }) => {
  await page.goto("/settings");
  await page.getByText("Daily Reminders").click();
  await page.getByLabel("Increase minutes").click();
  await page.getByText("PM", { exact: true }).click();
  await page.getByText("Save study rhythm").click();
  await expect(page.getByText("Saved. Selah will remind you at 8:05 PM.")).toBeVisible();
});

test("Daily Reminders cannot be saved while off", async ({ page }) => {
  await page.goto("/reminders");
  const toggle = page.getByLabel("Enable daily reminders");
  if (await toggle.isChecked()) await toggle.click();
  await expect(page.getByLabel("Save study rhythm")).toHaveAttribute("aria-disabled", "true");
});

test("Reader full screen hides navigation and exits on a double tap", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    Object.keys(localStorage)
      .filter((key) => key.startsWith("selah.local.highlights."))
      .forEach((key) => localStorage.removeItem(key));
  });
  await page.reload();
  await page.getByLabel("Enter full screen reading").click();
  const reader = page.getByLabel("Full screen Scripture. Double tap to exit.");
  await expect(reader).toBeVisible();
  await expect(page.getByText("Garden", { exact: true })).not.toBeVisible();
  const fullscreenVerse = page
    .getByText(/In the beginning God created the heavens and the earth/)
    .last();
  await fullscreenVerse.click();
  expect(
    await fullscreenVerse.evaluate(
      (element) => getComputedStyle(element.parentElement as HTMLElement).backgroundColor,
    ),
  ).toBe("rgba(247, 215, 116, 0.38)");
  await fullscreenVerse.click();
  await expect(page.getByLabel("Enter full screen reading")).toBeVisible();
});

test("Reader shows cross references for the current page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("RELATED PASSAGES")).toBeVisible({ timeout: 12000 });
});

test("Garden Insights and Connections remain available by route", async ({ page }) => {
  await page.goto("/garden-insights");
  await expect(page.getByText("What Selah is noticing", { exact: true })).toBeVisible();
  await page.goto("/knowledge-graph");
  await expect(page.getByText("Connections", { exact: true }).first()).toBeVisible();
});

test("Word Study searches Scripture and Garden terms", async ({ page }) => {
  await page.goto("/word-study");
  await page.getByPlaceholder("Search a word or phrase").fill("light");
  await page.getByLabel("Run word study search").click();
  await expect(page.getByText("Genesis 1:3", { exact: true })).toBeVisible({
    timeout: 20000,
  });
  await expect(page.getByTestId("highlighted-match").first()).toBeVisible();
});

test("Reader supports verse highlighting", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    Object.keys(localStorage)
      .filter((key) => key.startsWith("selah.local.highlights."))
      .forEach((key) => localStorage.removeItem(key));
  });
  await page.reload();
  const verseText = page
    .getByText(/In the beginning God created the heavens and the earth/)
    .last();
  await expect(verseText).toBeVisible();
  await verseText.click();
  expect(
    await verseText.evaluate(
      (element) => getComputedStyle(element.parentElement as HTMLElement).backgroundColor,
    ),
  ).toBe("rgba(247, 215, 116, 0.38)");
});

test("Settings changes highlight color and saved highlights route works", async ({ page }) => {
  await page.goto("/settings");
  await page.getByText("Highlight Color").click();
  await expect(
    page.getByRole("radio", { name: "Charcoal highlight color", exact: true }),
  ).toBeVisible();
  await page.getByRole("radio", { name: "Rose highlight color", exact: true }).click();
  await page.goto("/settings");
  await page.getByText("Bookmark Color").click();
  await expect(
    page.getByRole("radio", { name: "Rose bookmark color", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("radio", { name: "Charcoal bookmark color", exact: true }),
  ).toBeVisible();
  await page.goto("/highlights");
  await expect(page.getByText("No highlights yet")).toBeVisible();
});

test("Subscription offers monthly and yearly Selah Pro plans", async ({ page }) => {
  await page.goto("/settings");
  await page.getByText("Subscription", { exact: true }).click();
  await expect(page.getByText("Choose a Selah Pro plan")).toBeVisible();
  await expect(page.getByText("Selah Pro Monthly")).toBeVisible();
  await expect(page.getByText("Selah Pro Yearly")).toBeVisible();
  await expect(page.getByText("Restore Purchases")).toBeVisible();
});

test("Help explains the complete app flow", async ({ page }) => {
  await page.goto("/settings");
  await page.getByText("Help & How to Use Selah").click();
  await expect(page.getByText("Read Scripture", { exact: true })).toBeVisible();
  await expect(page.getByText("Free and Pro", { exact: true })).toBeVisible();
});

test("Settings exposes Face ID login and permanent delete account controls", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByText("Face ID Login", { exact: true })).toBeVisible();
  await expect(page.getByText("Delete Account", { exact: true })).toBeVisible();
});

test("Sign Out returns to the approved login flow", async ({ page }) => {
  await page.goto("/settings");
  await page.getByText("Sign Out").click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText("Sign In", { exact: true })).toBeVisible();
});
