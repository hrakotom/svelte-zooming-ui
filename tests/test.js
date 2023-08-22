import { expect, test } from '@playwright/test';
import { ZoomingUIComponent } from '../src/ZoomingUIComponent';

test('index page has expected h1', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'Welcome to SvelteKit' })).toBeVisible();
});

test('ZoomingUIComponent has random id', async () => {
	const component1 = new ZoomingUIComponent();
	const component2 = new ZoomingUIComponent();
	expect(component1.id).not.toBe(component2.id);
});
