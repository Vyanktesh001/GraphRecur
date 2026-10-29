import { test } from '@playwright/test';

/**
 * Captures real screenshots of the running app into docs/screenshots.
 * Only runs when SCREENSHOTS=1 (npm run screenshots), so normal test runs stay fast.
 */
test.skip(!process.env.SCREENSHOTS, 'set SCREENSHOTS=1 to capture screenshots');

const shots: [string, string][] = [
  ['01-dashboard', '/'],
  ['02-graph-explorer', '/graphs'],
  ['03-algorithm-simulator-bfs', '/algorithms'],
  ['05-recurrence-lab', '/recurrence'],
  ['06-concepts-library', '/concepts/handshaking'],
  ['07-complexity-analyzer', '/complexity'],
];

test.use({ viewport: { width: 1440, height: 900 } });

for (const [name, hash] of shots) {
  test(`screenshot ${name}`, async ({ page }) => {
    await page.goto(`/#${hash}`);
    if (hash === '/recurrence') await page.getByRole('button', { name: 'Use example: Fibonacci sequence' }).click();
    if (hash === '/algorithms') for (let i = 0; i < 6; i += 1) await page.getByRole('button', { name: 'Next step' }).click();
    await page.waitForTimeout(900);
    await page.screenshot({ path: `docs/screenshots/${name}.png`, fullPage: true });
  });
}

test('screenshot 04-shortest-path-dijkstra', async ({ page }) => {
  await page.goto('/#/algorithms');
  await page.getByLabel('Switch graph').selectOption({ label: 'Weighted graph' });
  await page.getByRole('button', { name: 'Load' }).click();
  await page.getByRole('tab', { name: 'Shortest path' }).click();
  await page.getByRole('combobox', { name: 'Algorithm', exact: true }).selectOption('dijkstra');
  await page.getByLabel('Destination').selectOption('D');
  await page.getByRole('slider', { name: 'Jump to step' }).press('End');
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'docs/screenshots/04-shortest-path-dijkstra.png', fullPage: true });
});

test('screenshot 08-mobile-dashboard', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'docs/screenshots/08-mobile-dashboard.png', fullPage: false });
});
