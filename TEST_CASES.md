# Test cases

All numbers below come from actual runs on the delivered code (Node 22, Windows 11, Chromium via Playwright).

| Suite | Command | Result |
|---|---|---|
| Unit + component tests (Vitest, 8 files) | `npm test` | **142 passed, 0 failed** |
| Browser tests (Playwright, Chromium) | `npm run test:e2e` | **18 passed** (+ 8 opt-in screenshot tests skipped) |
| ESLint | `npm run lint` | no errors |
| TypeScript | `npm run typecheck` | no errors |
| Production build | `npm run build` | succeeds |

Tests per file: `graphIo` 26, `graphProperties` 26, `recurrence` 22, `mst` 20, `shortestPath` 15, `traversal` 14, `pages` 11, `useStepPlayer` 8.

## Graph tests (`src/tests/graphProperties.test.ts`)

| # | Case | Expected |
|---|---|---|
| 1 | Empty graph | 0 vertices/edges, no components, not connected (documented convention), not a tree, bipartite |
| 2 | Single vertex | connected, tree, isolated, degree 0 |
| 3 | Vertices, no edges | one component per vertex, not connected |
| 4 | Connected graph (A–E example) | 1 component, degrees 2,2,2,3,1, handshaking 10 = 2·5 |
| 5 | Disconnected graph | components `[A,B] [C,D]` |
| 6 | Cycle (undirected / directed / directed 2-cycle) | cycle found; DAG not flagged |
| 7 | Tree detection | tree yes; cyclic or disconnected graphs not trees; trees "not applicable" to digraphs |
| 8–9 | Bipartite / non-bipartite | even cycle partitions `[A,C] [B,D]`; triangle rejected; checks every component |
| 10 | Isolated vertices | reported |
| 11 | Directed degrees | in/out/total and Σin = Σout = \|E\| |
| 12 | Invalid references | unknown vertex, self-loop, duplicate edge/vertex, bad name → errors; algorithms throw `GraphError`; edits leave the graph unchanged |
| + | Strongly connected components, adjacency list order, matrices (symmetric, directed, weighted with 0/null), vertex rename/remove, directed→undirected merge | see file |

## BFS / DFS (`traversal.test.ts`)

Neighbour-ordering rule under test: V order. BFS from A on the sample graph = `A B C D E` (levels 0,1,1,2,3); DFS = `A B D C E`. Also: disconnected graph (only the start component, unreachable list), single vertex, invalid start vertex / empty graph / dangling edge (errors), directed edges, queue contents per step, recursion-stack depth and backtracking steps, determinism, snapshot independence.

## Shortest paths (`shortestPath.test.ts`)

Multiple equal paths (deterministic `A,B,D`), direct edge preferred, unreachable destination, source = destination, unknown vertices; Dijkstra on the weighted sample (A→D = `A,B,C,D`, cost 6, distances `{A:0,B:2,C:3,D:6}`), intermediate updates (C first 4, then 3), zero-weight edges, **negative weight rejected**, unweighted graph treated as weight 1, directed reachability, tie determinism, directed weighted sample (cost 7).

## Minimum spanning trees and colouring (`mst.test.ts`)

Connected weighted graph (weight 6, edges A–B, B–C, C–D) for Kruskal and Prim; selected/rejected explanations; several valid MSTs (same weight, deterministic edges); **disconnected graph → spanning forest** (V − k edges, message); single vertex / no edges / empty graph; **negative weights supported** (total −8); directed graphs rejected; Prim start vertex; a 25-case randomised check that Kruskal and Prim agree. Colouring: triangle (3), bipartite (2), no edges, empty, **greedy not optimal on a bipartite "crown" graph (3 vs χ = 2)**, exact χ for K4 / C5 / empty / too large, directed edges, degree ordering.

## Recurrences (`recurrence.test.ts`)

Fibonacci `0,1,1,2,3,5,8,13,21,34`; F(20) = 6765, F(50) = 12 586 269 025; first-order; coefficient order (`[2,3]` vs `[3,2]` differ); `3a(n-1) − 2a(n-2)` = 2ⁿ − 1; arithmetic progression; tribonacci; count < order; step text (`a(5) = 1·a(4) + 1·a(3)`, `= 1·3 + 1·2 = 5`); formula formatting; **wrong number of initial conditions**; **invalid coefficients**; **invalid term counts** (0, −3, 2.5, 501, NaN); number parsing; form errors per field; **precision warning** (first unsafe term a(79)); **overflow** (10ⁿ stops at a(309)); non-integer warning; built-in examples; CSV content and inexact marking.

## Other unit/component tests

- `useStepPlayer.test.ts` — Next/Previous/Reset/GoTo, clamping, Play/Pause timing, restart on new run, empty list, and that Previous returns the *same recorded snapshot object* (no recomputation).
- `graphIo.test.ts` — manual text parsing (weights in several notations, all errors with line numbers), position preservation, round trip, JSON export/import, malformed JSON, every example graph is valid.
- `pages.test.tsx` — Recurrence Lab (Fibonacci example, validation errors, stepping, saving to localStorage, precision warning), Dashboard (real statistics, empty states, persisted data, corrupted localStorage), Complexity page, manual graph input.

## Browser tests (`e2e/app.spec.ts`)

Every page loads; sidebar navigation (desktop) and collapsible menu without horizontal overflow (390 px wide); the graph renders 5 vertices and 5 edges; adjacency list/matrix views; add vertex / add edge / duplicate-edge error / rename / remove; manual input with invalid reference; drag from one vertex's handle to another creates an edge; directed/weighted toggles and persistence after reload; confirmation before discarding unsaved edits; JSON export and re-import; BFS Next/Previous/Reset/Play to completion; DFS stack and order; Dijkstra negative-weight rejection, weighted result, unreachable destination; MST (Kruskal, Prim) total 6; colouring; spanning forest message; Fibonacci example, CSV download, persistence after reload; validation error and chart; BFS demo in the Concepts Library.

Note: the first complete browser run during development had 8 failures. Three were caused by a real usability defect (the app asked for confirmation before switching away from an untouched example graph; fixed by tracking whether the graph was actually edited). The others were ambiguous test locators and a test that tried to drag while the canvas was scrolled off-screen; while investigating the drag I also changed the invisible connection handle so it no longer covers (and blocks dragging of) the vertex. After the fixes the final full run passed: 18 passed, 8 skipped (the opt-in screenshot captures).

## How to run

```bash
npm test
npx playwright install chromium   # once
npm run test:e2e
```
