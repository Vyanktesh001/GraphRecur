import { expect, test, type Page } from '@playwright/test';

async function goto(page: Page, hash: string) {
  await page.goto(`/#${hash}`);
}

test.describe('navigation and pages', () => {
  test('every main page loads', async ({ page }) => {
    const pages: [string, RegExp][] = [
      ['/', /GraphRecur Lab/],
      ['/graphs', /Graph Explorer/],
      ['/algorithms', /Algorithm Simulator/],
      ['/recurrence', /Recurrence Relations Lab/],
      ['/concepts', /Mathematical Concepts Library/],
      ['/complexity', /Algorithm Complexity Analyzer/],
    ];
    for (const [hash, title] of pages) {
      await goto(page, hash);
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    }
  });

  test('sidebar navigation works on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await goto(page, '/');
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Recurrence Lab' }).click();
    await expect(page).toHaveURL(/#\/recurrence/);
    await expect(page.getByRole('heading', { level: 1, name: /Recurrence Relations Lab/ })).toBeVisible();
  });

  test('collapsible navigation works on a phone-sized screen', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await goto(page, '/');
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Graph Explorer' }).click();
    await expect(page).toHaveURL(/#\/graphs/);
    await expect(page.getByRole('button', { name: 'Open navigation menu' })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(overflow).toBe(false);
  });
});

test.describe('graph explorer', () => {
  test('renders vertices and edges, and shows the three representations', async ({ page }) => {
    await goto(page, '/graphs');
    await expect(page.locator('.react-flow__node')).toHaveCount(5);
    await expect(page.locator('.react-flow__edge')).toHaveCount(5);
    await page.getByRole('tab', { name: 'Adjacency list' }).click();
    await expect(page.getByRole('list', { name: 'Adjacency list' })).toContainText('D');
    await page.getByRole('tab', { name: 'Adjacency matrix' }).click();
    await expect(page.getByRole('table', { name: 'Adjacency matrix' })).toBeVisible();
  });

  test('add vertex, add edge, rename, remove — and the properties update', async ({ page }) => {
    await goto(page, '/graphs');
    await page.getByRole('button', { name: 'New graph' }).click();
    await expect(page.locator('.react-flow__node')).toHaveCount(0);

    const addVertex = page.getByRole('form', { name: 'Add vertex' });
    for (const name of ['P', 'Q', 'R']) {
      await addVertex.getByLabel('New vertex name').fill(name);
      await addVertex.getByRole('button', { name: 'Add vertex' }).click();
    }
    await expect(page.locator('.react-flow__node')).toHaveCount(3);

    const addEdge = page.getByRole('form', { name: 'Add edge' });
    await addEdge.getByLabel('Vertex 1').selectOption('P');
    await addEdge.getByLabel('Vertex 2').selectOption('Q');
    await addEdge.getByRole('button', { name: 'Add edge' }).click();
    await expect(page.locator('.react-flow__edge')).toHaveCount(1);

    // invalid: duplicate edge
    await addEdge.getByLabel('Vertex 1').selectOption('Q');
    await addEdge.getByLabel('Vertex 2').selectOption('P');
    await addEdge.getByRole('button', { name: 'Add edge' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'already exists' })).toBeVisible();
    await expect(page.locator('.react-flow__edge')).toHaveCount(1);

    // rename
    const rename = page.getByRole('form', { name: 'Rename vertex' });
    await rename.getByLabel('Rename vertex').selectOption('R');
    await rename.getByLabel('New name').fill('Z');
    await rename.getByRole('button', { name: 'Rename' }).click();
    await expect(page.locator('.react-flow__node').filter({ hasText: 'Z' })).toHaveCount(1);

    // properties: 3 vertices, 1 edge, isolated Z
    await expect(page.getByText('Isolated vertices').locator('..')).toContainText('Z');

    // remove vertex
    const remove = page.getByRole('form', { name: 'Remove vertex' });
    await remove.getByLabel('Remove vertex').selectOption('P');
    await remove.getByRole('button', { name: 'Remove chosen vertex' }).click();
    await expect(page.locator('.react-flow__node')).toHaveCount(2);
    await expect(page.locator('.react-flow__edge')).toHaveCount(0);
  });

  test('manual input renders the specified graph and rejects invalid references', async ({ page }) => {
    await goto(page, '/graphs');
    await page.getByLabel('Vertices V').fill('A, B, C');
    await page.getByLabel('Edges E').fill('A-B\nB-Q');
    await page.getByRole('button', { name: 'Apply to graph' }).click();
    await expect(page.getByText(/not in the vertex list/)).toBeVisible();
    await page.getByLabel('Edges E').fill('A-B\nB-C');
    await page.getByRole('button', { name: 'Apply to graph' }).click();
    await expect(page.locator('.react-flow__node')).toHaveCount(3);
    await expect(page.locator('.react-flow__edge')).toHaveCount(2);
  });

  test('dragging from one vertex handle to another adds an edge', async ({ page }) => {
    await goto(page, '/graphs');
    await page.getByLabel('Vertices V').fill('A, B');
    await page.getByLabel('Edges E').fill('');
    await page.getByRole('button', { name: 'Apply to graph' }).click();
    await expect(page.locator('.react-flow__node')).toHaveCount(2);
    await page.locator('.react-flow').first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const handle = page.locator('.react-flow__node').filter({ hasText: 'A' }).locator('.react-flow__handle.source');
    const target = page.locator('.react-flow__node').filter({ hasText: 'B' });
    const h = (await handle.boundingBox())!;
    const t = (await target.boundingBox())!;
    await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2);
    await page.mouse.down();
    await page.mouse.move(t.x + t.width / 2, t.y + t.height / 2, { steps: 12 });
    await page.mouse.up();
    await expect(page.locator('.react-flow__edge')).toHaveCount(1);
  });

  test('toggling directed and weighted works and graph data survives a reload', async ({ page }) => {
    await goto(page, '/graphs');
    await page.getByRole('checkbox', { name: 'Directed' }).check();
    await page.getByRole('checkbox', { name: 'Weighted' }).check();
    await page.getByLabel('Graph name').fill('My persisted graph');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText(/Saved "My persisted graph"/)).toBeVisible();
    await page.reload();
    await expect(page.getByLabel('Graph name')).toHaveValue('My persisted graph');
    await expect(page.getByRole('checkbox', { name: 'Directed' })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'Weighted' })).toBeChecked();
    await expect(page.getByText('Saved graphs').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Load My persisted graph' })).toBeVisible();
  });

  test('asks before discarding unsaved edits', async ({ page }) => {
    await goto(page, '/graphs');
    const addVertex = page.getByRole('form', { name: 'Add vertex' });
    await addVertex.getByLabel('New vertex name').fill('Z');
    await addVertex.getByRole('button', { name: 'Add vertex' }).click();
    await expect(page.locator('.react-flow__node')).toHaveCount(6);
    await page.getByRole('button', { name: 'New graph' }).click();
    await expect(page.getByRole('dialog')).toContainText('not saved');
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.locator('.react-flow__node')).toHaveCount(6);
    await page.getByRole('button', { name: 'New graph' }).click();
    await page.getByRole('button', { name: 'Discard and continue' }).click();
    await expect(page.locator('.react-flow__node')).toHaveCount(0);
  });

  test('exports JSON and imports it back', async ({ page }) => {
    await goto(page, '/graphs');
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export JSON' }).click()]);
    expect(download.suggestedFilename()).toMatch(/\.json$/);
    const path = await download.path();
    await page.getByRole('button', { name: 'New graph' }).click();
    await expect(page.locator('.react-flow__node')).toHaveCount(0);
    await page.getByLabel('Choose a graph JSON file to import').setInputFiles(path);
    await expect(page.locator('.react-flow__node')).toHaveCount(5);
  });
});

test.describe('algorithm simulator', () => {
  test('BFS steps forward and backward with queue contents', async ({ page }) => {
    await goto(page, '/algorithms');
    const explanation = page.getByTestId('step-explanation');
    await expect(explanation).toContainText('Start: mark A as visited');
    await page.getByRole('button', { name: 'Next step' }).click();
    await expect(explanation).toContainText('Dequeue A');
    await page.getByRole('button', { name: 'Next step' }).click();
    await expect(explanation).toContainText('Edge A–B');
    await page.getByRole('button', { name: 'Previous step' }).click();
    await expect(explanation).toContainText('Dequeue A');
    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(explanation).toContainText('Start: mark A as visited');
    await expect(page.getByText('Step 1 of')).toBeVisible();
    // play runs to the end
    await page.getByRole('combobox', { name: 'Speed' }).selectOption({ label: 'Fast' });
    await page.getByRole('button', { name: 'Play' }).click();
    await expect(explanation).toContainText('BFS is finished', { timeout: 15_000 });
    await expect(page.getByText('A → B → C → D → E').first()).toBeVisible();
  });

  test('DFS shows the recursion stack and backtracking', async ({ page }) => {
    await goto(page, '/algorithms');
    await page.getByRole('tab', { name: 'DFS' }).click();
    await page.getByRole('button', { name: 'Next step' }).click();
    await expect(page.getByText('Recursion stack (bottom → top)')).toBeVisible();
    await page.getByRole('combobox', { name: 'Speed' }).selectOption({ label: 'Fast' });
    await page.getByRole('button', { name: 'Play' }).click();
    await expect(page.getByTestId('step-explanation')).toContainText('DFS is finished', { timeout: 15_000 });
    await expect(page.getByText('A → B → D → C → E').first()).toBeVisible();
  });

  test('Dijkstra rejects negative weights, handles weighted example, and unreachable targets', async ({ page }) => {
    await goto(page, '/algorithms');
    await page.getByLabel('Switch graph').selectOption({ label: 'Negative weight (Dijkstra demo)' });
    await page.getByRole('button', { name: 'Load' }).click();
    await page.getByRole('tab', { name: 'Shortest path' }).click();
    await page.getByRole('combobox', { name: 'Algorithm', exact: true }).selectOption('dijkstra');
    await expect(page.getByRole('alert').filter({ hasText: 'non-negative' }).first()).toBeVisible();

    await page.getByLabel('Switch graph').selectOption({ label: 'Weighted graph' });
    await page.getByRole('button', { name: 'Load' }).click();
    await page.getByLabel('Destination').selectOption('D');
    await expect(page.getByText('A → B → C → D').first()).toBeVisible();
    await expect(page.getByText('Total cost:')).toBeVisible();

    await page.getByLabel('Switch graph').selectOption({ label: 'Disconnected graph' });
    await page.getByRole('button', { name: 'Load' }).click();
    await page.getByRole('combobox', { name: 'Algorithm', exact: true }).selectOption('bfs');
    await page.getByLabel('Destination').selectOption('D');
    await expect(page.getByText('Unreachable')).toBeVisible();
  });

  test('MST and colouring run on the weighted example', async ({ page }) => {
    await goto(page, '/algorithms');
    await page.getByLabel('Switch graph').selectOption({ label: 'Weighted graph' });
    await page.getByRole('button', { name: 'Load' }).click();
    await page.getByRole('tab', { name: 'Minimum spanning tree' }).click();
    await expect(page.getByText('Total weight:').locator('..')).toContainText('6');
    await page.getByRole('combobox', { name: 'Algorithm', exact: true }).selectOption('prim');
    await expect(page.getByText('Total weight:').locator('..')).toContainText('6');
    await page.getByRole('tab', { name: 'Graph colouring' }).click();
    await expect(page.getByText('Proper colouring:')).toBeVisible();
    await expect(page.getByText(/does not guarantee the minimum|do(es)? not necessarily use the fewest/i).first()).toBeVisible();
  });

  test('disconnected graph yields a spanning forest', async ({ page }) => {
    await goto(page, '/algorithms');
    await page.getByLabel('Switch graph').selectOption({ label: 'Disconnected graph' });
    await page.getByRole('button', { name: 'Load' }).click();
    await page.getByRole('tab', { name: 'Minimum spanning tree' }).click();
    await expect(page.getByText('Minimum spanning forest:')).toBeVisible();
  });
});

test.describe('recurrence lab', () => {
  test('Fibonacci example, CSV export and persistence', async ({ page }) => {
    await goto(page, '/recurrence');
    await page.getByRole('button', { name: 'Use example: Fibonacci sequence' }).click();
    await expect(page.getByTestId('sequence-preview')).toHaveText('0, 1, 1, 2, 3, 5, 8, 13, 21, 34');
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export CSV' }).click()]);
    expect(download.suggestedFilename()).toBe('recurrence_sequence.csv');
    await page.reload();
    await expect(page.getByTestId('sequence-preview')).toHaveText('0, 1, 1, 2, 3, 5, 8, 13, 21, 34');
    await goto(page, '/');
    await expect(page.getByText('a(n) = a(n-1) + a(n-2)').first()).toBeVisible();
  });

  test('shows validation errors and a chart', async ({ page }) => {
    await goto(page, '/recurrence');
    await page.getByLabel(/^c1/).fill('x');
    await expect(page.getByText(/is not a valid number/)).toBeVisible();
    await page.getByLabel(/^c1/).fill('2');
    await page.getByRole('button', { name: 'Generate sequence' }).click();
    await expect(page.locator('.recharts-line')).toBeVisible();
  });
});

test.describe('concepts', () => {
  test('a BFS concept demo can be stepped', async ({ page }) => {
    await goto(page, '/concepts/bfs');
    await expect(page.getByRole('heading', { name: 'Breadth-First Search (BFS)' })).toBeVisible();
    await page.getByRole('button', { name: 'Next step' }).click();
    await expect(page.getByText(/Dequeue A and process it/)).toBeVisible();
  });
});
