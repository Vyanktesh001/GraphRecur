# GraphRecur Lab

**An Interactive Graph Theory and Recurrence Relations Learning Platform** — a Discrete Mathematics course project.

GraphRecur Lab runs entirely in the browser (no server, no API key, no paid service). Students can build graphs, watch BFS / DFS / Dijkstra / Kruskal / Prim / greedy colouring run step by step (forwards **and backwards**), and explore linear recurrence relations with tables, charts and step-by-step calculations.

## Features

| Module | What it does |
|---|---|
| **Dashboard** | Real statistics (saved graphs, current graph's |V| and |E|, saved recurrences), recently used graphs, recently generated sequences, module shortcuts, list of covered concepts. Empty states when there is no data. |
| **Graph Explorer** | Create / clear graphs; add, remove, rename and drag vertices; add / remove edges (form, text input, or drag between vertices); undirected, directed and weighted graphs; adjacency-list and adjacency-matrix views; JSON import / export; localStorage save / load; 9 example graphs. Properties: |V|, |E|, degrees (in/out for digraphs), handshaking check, isolated vertices, components, connectivity, strongly connected components, cycles, DAG, tree, bipartite. |
| **Algorithm Simulator** | BFS, DFS, shortest path (BFS by edge count, Dijkstra by weight), minimum spanning tree (Kruskal, Prim; spanning forest for disconnected graphs), greedy colouring. Play / Pause / Next / Previous / Reset, speed control, step scrubber, per-step explanation, queue / stack / priority-queue contents, distances, parents. |
| **Recurrence Lab** | Linear recurrences `a(n) = c1·a(n-1) + … + ck·a(n-k)` (order 1–10, up to 500 terms), validation, table, chart (optional log axis), step-through of each calculation, precision / overflow warnings, CSV export, saved configurations, 5 built-in examples. |
| **Concepts Library** | 19 topics, each with definition, formulas, worked example, plain-language explanation and an interactive demo that runs the real algorithms. |
| **Complexity Analyzer** | Time / space bounds of every implemented algorithm with the assumptions they depend on, numeric evaluation for the current graph, and a check that BFS/DFS really examine the predicted number of adjacency entries. |

**Design choices worth knowing**

- Graphs are *simple* (no self-loops, no parallel edges). A directed graph may contain both `A→B` and `B→A`.
- **Neighbour-ordering rule** (all algorithms): neighbours are explored in the order the vertices appear in the vertex list V. This makes every result deterministic.
- Algorithms record a list of immutable snapshots ("trace"); the UI only moves an index through that list, so *Previous step* never re-runs anything.
- MST algorithms accept negative weights (they remain correct); Dijkstra rejects them.
- The Recurrence Lab evaluates recurrences term by term. It does **not** compute closed-form solutions.

## Technology stack

React 19 · TypeScript · Vite · Tailwind CSS 4 · Lucide React · React Flow (`@xyflow/react`) · Recharts · React Router (hash routing) · Vitest + React Testing Library · Playwright · ESLint. Storage: browser `localStorage`.

## Prerequisites

- Node.js 20 or newer (developed with Node 22) and npm
- A modern browser (Chrome, Edge, Firefox, Safari)

## Installation

```bash
npm install
# only needed for the browser (end-to-end) tests and screenshots:
npx playwright install chromium
```

## Running the application

```bash
npm run dev        # development server (http://localhost:5173)
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build (http://localhost:4173)
```

## Testing and quality checks

```bash
npm test               # unit + component tests (Vitest)         – 142 tests
npm run test:e2e       # browser tests (Playwright, builds first) – 18 tests
npm run lint           # ESLint
npm run typecheck      # TypeScript (app + config files)
npm run screenshots    # regenerate docs/screenshots with real captures
```

Test details are in [TEST_CASES.md](TEST_CASES.md).

## Project structure

```
src/
  app/             App.tsx, router.tsx
  algorithms/      bfs, dfs, shortestPath, dijkstra, kruskal, prim, graphColoring,
                   connectivity, cycleDetection, bipartite, graphProperties, adjacency,
                   trace (step recorder)      ← pure TypeScript, no React
  recurrence/      generateSequence, recurrenceValidation, examples
  types/           graph.ts, algorithm.ts, recurrence.ts
  utils/           graph edit operations & validation, text/JSON import-export,
                   heap, disjoint set, storage, formatting, step→visual mapping
  hooks/           useStepPlayer, useStructuralGraph
  store/           GraphStore, RecurrenceStore (state + localStorage persistence)
  content/         example graphs, concept texts, complexity table
  components/
    layout/ graph/ algorithms/ recurrence/ charts/ concepts/ ui/
  pages/           Dashboard, GraphExplorer, AlgorithmSimulator, RecurrenceLab,
                   Concepts, Complexity
  tests/           unit and component tests
e2e/               Playwright tests and screenshot script
docs/screenshots/  real screenshots of the running application
```

## Documentation

- [ALGORITHMS.md](ALGORITHMS.md) – every algorithm, its rules, complexity and correctness notes
- [TEST_CASES.md](TEST_CASES.md) – what is tested and how to run it
- [PROJECT_REPORT.md](PROJECT_REPORT.md) – full project report (fill in the placeholders for names and college details)
