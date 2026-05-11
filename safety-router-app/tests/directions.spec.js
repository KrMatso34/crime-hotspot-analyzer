import { test, expect } from '@playwright/test';
import { waitForResults } from './testUtils'



async function runTest(page, testData={}, mapSetup={}, {setup, verify}) {

	test.info().annotations.push({ type: 'testData', description: JSON.stringify(testData) });

	await page.goto('http://localhost:5173/');

	if ("incidents" in mapSetup) {
		await test.step('Load incidents', async () => {
			await page.getByRole('button', { name: 'Incident Type' }).click();

			const incidentsFilter = mapSetup.incidents;
			if (incidentsFilter == 'all') {
				await expect(page.locator('#dashboard')).toHaveAttribute('data-heatmap-loaded', 'true', { timeout: 15000 });
				await page.getByRole('button', { name: 'All' }).click();
				await expect(page.locator('#mapData')).toHaveAttribute('data-heatmap-active', 'true', { timeout: 15000 });
			}
		})
	}

	if ("origin" in testData || "destination" in testData) {
		await test.step('Enter trip details', async () => {
			if ("origin" in testData) {
				await page.getByRole('textbox', { name: 'Enter starting point...' }).click();
				await page.getByRole('textbox', { name: 'Enter starting point...' }).fill(testData.origin);
			}

			if ("destination" in testData) {
				await page.getByRole('textbox', { name: 'Enter destination...' }).click();
				await page.getByRole('textbox', { name: 'Enter destination...' }).fill(testData.destination);
			}
		})
	}

	if (setup) await test.step('Setup', async() => await setup(page))

	await test.step('Submit and Wait', async () => {
		await page.getByText('KAGSChange style').click();
		await page.getByRole('button', { name: 'Get Safe Directions' }).click();
		waitForResults(page);
	});

	if (verify) await test.step('Verify Results', async () => await verify(page))
}

function makeVerifyFunc(data) {
	return async (page) => {
		if ("safest" in data) {
			if ("risk" in data.safest) await expect(page.getByTestId('safest')).toContainText(`RISK: ${data.safest.risk}`);
			if ("time" in data.safest) await expect(page.getByTestId('safest')).toContainText(data.safest.time);
			if ("dist" in data.safest) await expect(page.getByTestId('safest')).toContainText(`${data.safest.dist} mi`);
		}
		if ("fastest" in data) {
			if ("risk" in data.fastest) await expect(page.getByTestId('fastest')).toContainText(`RISK: ${data.fastest.risk}`);
			if ("time" in data.fastest) await expect(page.getByTestId('fastest')).toContainText(data.fastest.time);
			if ("dist" in data.fastest) await expect(page.getByTestId('fastest')).toContainText(`${data.fastest.dist} mi`);
		}
		if ("balanced" in data) {
			if ("risk" in data.balanced) await expect(page.getByTestId('balanced')).toContainText(`RISK: ${data.balanced.risk}`);
			if ("time" in data.balanced) await expect(page.getByTestId('balanced')).toContainText(data.balanced.time);
			if ("dist" in data.balanced) await expect(page.getByTestId('balanced')).toContainText(`${data.balanced.dist} mi`);
		}
	}
} 

test('TC-001: Simple route creation', async ({ page }) => {
	const mapSetup = { incidents: 'none' }
	const testData = { origin: 'Bellevue', destination: 'Redmond' };
	const verifyData = {
		safest: {
			risk: 0,
			time: '9m 20s',
			dist: '6.99'
		},
		balanced: {
			risk: 0,
		},
		fastest: {
			risk: 0,
		}
	}

	test.info().annotations.push({ type: 'requirement', description: 'User must see rendered routes' });
	test.info().annotations.push({ type: 'testCaseId', description: 'TC-001' });
	test.info().annotations.push({ type: 'expectedResult', description: "Panel populates with Risk: 0 and correct travel time" });


	const prepareFuncs = {
		verify: makeVerifyFunc(verifyData)
	}

	await runTest(page, testData, mapSetup, prepareFuncs);
	
});

test('TC-002: Simple route creation with heatmap', async ({ page }) => {
	const mapSetup = { incidents: 'all' }
	const testData = { origin: 'Bellevue', destination: 'Redmond' };
	const verifyData = {
		safest: {
			risk: 6,
			time: '11m 43s',
			dist: '7.94'
		},
		fastest: {
			risk: 12,
		}
	}

	test.info().annotations.push({ type: 'requirement', description: 'User must see risk levels for routes' });
	test.info().annotations.push({ type: 'testCaseId', description: 'TC-002' });
	test.info().annotations.push({ type: 'expectedResult', description: "Panel populates with risk higher than 0 and increased travel time" });

	const prepareFuncs = {
		verify: makeVerifyFunc(verifyData)
	}

	await runTest(page, testData, mapSetup, prepareFuncs);
	
});


test('TC-003: Route with extra stop', async ({ page }) => {
	const testData = { origin: 'Redmond', destination: 'Bellevue', stop1: 'Bellevue College' };
	const verifyData = {
		safest: {
			dist: '12.04'
		},
		fastest: {
			dist: '11.85',
		}
	}

	test.info().annotations.push({ type: 'requirement', description: 'User must see route that passes through stop' });
	test.info().annotations.push({ type: 'testCaseId', description: 'TC-003' });
	test.info().annotations.push({ type: 'expectedResult', description: "Safest and fastest routes have higher distance than without extra stop" });

	test.info().annotations.push({ type: 'testData', description: JSON.stringify(testData) });

	await page.goto('http://localhost:5173/');
	await page.getByRole('textbox', { name: 'Enter starting point...' }).click();
	await page.getByRole('textbox', { name: 'Enter starting point...' }).fill('Redmond');
	await page.getByRole('textbox', { name: 'Enter destination...' }).click();
	await page.getByRole('textbox', { name: 'Enter destination...' }).fill('Bellevue');
	await page.getByRole('textbox', { name: 'Stop' }).click();
	await page.getByRole('textbox', { name: 'Stop' }).fill('Bellevue College');
	await page.getByRole('button', { name: 'Get Safe Directions' }).click();
	await expect(page.getByTestId('safest')).toContainText('12.04 mi');
	await expect(page.getByTestId('fastest')).toContainText('11.85 mi');
});

test('TC-004: Cancel and reroute', async ({ page }) => {
	const testData = { origin: 'Redmond', destination: 'Bellevue', destination2: 'Seattle' };

	test.info().annotations.push({ type: 'requirement', description: 'User must see two different routes after successfully canceling' });
	test.info().annotations.push({ type: 'testCaseId', description: 'TC-004' });
	test.info().annotations.push({ type: 'expectedResult', description: "2nd route has higher distance than first route" });

	test.info().annotations.push({ type: 'testData', description: JSON.stringify(testData) });

	await page.goto('http://localhost:5173/');
	await page.getByRole('textbox', { name: 'Enter starting point...' }).click();
	await page.getByRole('textbox', { name: 'Enter starting point...' }).fill('Redmond');
	await page.getByRole('textbox', { name: 'Enter starting point...' }).press('Tab');
	await page.getByRole('button', { name: 'Show on Map' }).first().press('Tab');
	await page.getByRole('textbox', { name: 'Enter destination...' }).fill('Bellevue');
	await page.getByRole('textbox', { name: 'Enter destination...' }).press('Tab');
	await page.getByRole('button', { name: 'Show on Map' }).nth(1).press('Tab');
	await page.getByRole('textbox', { name: 'Stop' }).press('Tab');
	await page.getByRole('button', { name: '+ Add another stop' }).press('Tab');
	await page.getByRole('button', { name: 'Get Safe Directions' }).press('Enter');
	await page.getByRole('button', { name: 'Get Safe Directions' }).click();
	await page.getByRole('button', { name: 'Cancel Route' }).click();
	await page.getByRole('textbox', { name: 'Enter destination...' }).click();
	await page.getByRole('textbox', { name: 'Enter destination...' }).press('ControlOrMeta+a');
	await page.getByRole('textbox', { name: 'Enter destination...' }).fill('Seattle');
	await page.getByText('KAGSChange style').click();
	await page.getByRole('button', { name: 'Get Safe Directions' }).click();
	await expect(page.getByTestId('safest')).toContainText('15.23 mi');
	await expect(page.getByTestId('safest')).toContainText('18m 55s');
});

/*
test('TC-001: Simple route creation', async ({ page }) => {
	const mapSetup = { incidents: 'none' }
	const testData = { origin: 'Bellevue', destination: 'Redmond' };

	test.info().annotations.push({ type: 'requirement', description: 'User must see risk levels for route' });
	test.info().annotations.push({ type: 'testCaseId', description: 'TC-001' });
	test.info().annotations.push({ type: 'expectedResult', description: "Panel populates with Risk: 0 and correct travel time" });

	test.info().annotations.push({ type: 'testData', description: JSON.stringify(testData) });

	await page.goto('http://localhost:5173/');
	
	await test.step('Enter trip details', async () => {
		await page.getByRole('textbox', { name: 'Enter starting point...' }).click();
		await page.getByRole('textbox', { name: 'Enter starting point...' }).fill(testData.origin);
		await page.getByRole('textbox', { name: 'Enter destination...' }).click();
		await page.getByRole('textbox', { name: 'Enter destination...' }).fill(testData.destination);
	});

	await test.step('Submit and Wait', async () => {
		await page.getByText('KAGSChange style').click();
		await page.getByRole('button', { name: 'Get Safe Directions' }).click();
		waitForResults(page);
	});

	await test.step('Verify Results', async () => {
		await expect(page.getByTestId('safest')).toContainText('RISK: 0');
		await expect(page.getByTestId('balanced')).toContainText('RISK: 0');
		await expect(page.getByTestId('fastest')).toContainText('RISK: 0');
		await expect(page.getByTestId('safest')).toContainText('9m 20s');
		await expect(page.getByTestId('safest')).toContainText('6.99 mi');
	});
});


import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
	await page.goto('http://localhost:5173/');
	await page.getByRole('button', { name: 'Incident Type' }).click();
	await page.getByRole('button', { name: 'All' }).click();
	await page.getByRole('textbox', { name: 'Enter starting point...' }).click();
	await page.getByRole('textbox', { name: 'Enter starting point...' }).fill('Redmond');
	await page.getByRole('textbox', { name: 'Enter starting point...' }).press('Tab');
	await page.getByRole('textbox', { name: 'Enter destination...' }).click();
	await page.getByRole('textbox', { name: 'Enter destination...' }).fill('Bellevue');
	await page.getByText('KAGSChange style').click();
	await page.getByRole('button', { name: 'Get Safe Directions' }).click();
	await expect(page.getByTestId('safest')).toContainText('RISK: 8');
	await page.getByText('11m 43s').click();
	await expect(page.getByTestId('safest')).toContainText('11m 43s');
	await expect(page.getByTestId('safest')).toContainText('7.63 mi');
	await expect(page.getByTestId('fastest')).toContainText('RISK: 11');
});
*/