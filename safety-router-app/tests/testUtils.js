import { expect } from '@playwright/test';

export async function waitForResults(page) {
	//await expect(page.locator('#quick-select-panel')).toContainText(/./, { timeout: 15000 });
	await expect(page.locator('#quick-select-panel')).toHaveAttribute('data-all-routes-ready', 'true', { timeout: 15000 });
}
