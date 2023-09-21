import { expect, test } from '@playwright/test';

test('index page has expected div with id starting with zui-', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('div[id^="zui-"]')).toBeVisible();
});
