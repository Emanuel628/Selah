import { expect, test } from '@playwright/test';

test('primary navigation exposes the approved top-level pages', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Genesis 1', { exact: true }).first()).toBeVisible();
  await page.getByText('Garden', { exact: true }).last().click();
  await expect(page.getByText('My Garden', { exact: true })).toBeVisible();
  await page.getByText('Search', { exact: true }).last().click();
  await expect(page.getByText('Global Search', { exact: true })).toBeVisible();
  await page.getByText('Settings', { exact: true }).last().click();
  await expect(page.getByText('READER SETTINGS')).toBeVisible();
});

test('Garden supports detail and create-note flows', async ({ page }) => {
  await page.goto('/garden');
  await page.getByText('Life moving over chaos', { exact: true }).click();
  await expect(page.getByText('SCRIPTURE ANCHOR')).toBeVisible();
  await page.getByLabel('Go back').click();
  await page.getByText('New note').click();
  await expect(page.getByText('New reflection', { exact: true })).toBeVisible();
  await page.getByPlaceholder('What are you noticing?').fill('Light brings order to chaos.');
  await page.getByText('Save reflection').click();
  await expect(page).toHaveURL(/\/garden$/);
});

test('Search scopes and opens Garden results', async ({ page }) => {
  await page.goto('/search');
  await page.getByPlaceholder('Search Scripture and your Garden').fill('chaos');
  await expect(page.getByText('2 RESULTS')).toBeVisible();
  await page.getByText('Garden', { exact: true }).first().click();
  await expect(page.getByText('1 RESULTS')).toBeVisible();
  await page.getByText('Life moving over chaos', { exact: true }).click();
  await expect(page.getByText('CONNECTIONS')).toBeVisible();
});

test('Daily Reminder time is editable, saveable, and reflected in Settings', async ({ page }) => {
  await page.goto('/settings');
  await page.getByText('Daily Reminders').click();
  await page.getByLabel('Increase minutes').click();
  await page.getByText('PM', { exact: true }).click();
  await page.getByText('Save study rhythm').click();
  await expect(page.getByText('Saved ✓')).toBeVisible();
  await expect(page.getByText('Reminder saved for 8:05 PM.')).toBeVisible();
  await page.getByLabel('Go back').click();
  await expect(page.getByText('8:05 PM')).toBeVisible();
});

test('Sign Out returns to the approved login flow', async ({ page }) => {
  await page.goto('/settings');
  await page.getByText('Sign Out').click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText('Continue your cultivation in the word.')).toBeVisible();
  await expect(page.getByText('Sign In', { exact: true })).toBeVisible();
  await page.getByText('Create an account').click();
  await expect(page.getByText('Create Free Account')).toBeVisible();
  await expect(page.getByText('A distraction-free home for scriptural study.')).toBeVisible();
});
