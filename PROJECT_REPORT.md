# GraphRecur Lab

## 1. Title page

**Project title:** GraphRecur Lab — An Interactive Graph Theory and Recurrence Relations Learning Platform

**Course:** Discrete Mathematics

| | |
|---|---|
| Student name(s) | **[PLACEHOLDER — student names]** |
| Roll / registration number(s) | **[PLACEHOLDER]** |
| Department and programme | **[PLACEHOLDER]** |
| College / university | **[PLACEHOLDER — college name and logo]** |
| Course instructor / guide | **[PLACEHOLDER]** |
| Academic year / semester | **[PLACEHOLDER]** |
| Date of submission | **[PLACEHOLDER]** |

---

## 2. Abstract

Graph theory and recurrence relations are central topics of Discrete Mathematics, but students often meet them only as static diagrams and formulas. GraphRecur Lab is a web application that lets students *build* graphs, *run* classic algorithms one step at a time (forwards and backwards), and *generate* sequences from linear recurrence relations. It covers vertices and edges, directed / undirected / weighted graphs, adjacency lists and matrices, degree and connectivity, cycles, trees, bipartite graphs, BFS, DFS, shortest paths (BFS and Dijkstra), minimum spanning trees (Kruskal and Prim), greedy colouring, Fibonacci and other linear recurrences, and algorithm complexity. The mathematics is implemented in plain TypeScript modules that are independent of the user interface and are verified by 142 automated unit and component tests and 18 browser tests. Everything runs locally in the browser and user data is kept in localStorage.

## 3. Problem statement

Textbooks present algorithms such as BFS or Dijkstra as pseudocode and a finished picture. A learner cannot easily see the queue change, ask "what if this edge were removed?", step *back* one move, or check a recurrence by hand against a computed table. Existing visualisers are often limited to one algorithm, use fixed graphs, or ignore precision issues when sequences grow quickly. The problem addressed here is to provide one coherent, correct and interactive environment in which the central graph-theory and recurrence-relation ideas of the course can be explored on the student's own examples.

## 4. Objectives

1. Let students create and edit graphs (vertices, edges, directed / undirected / weighted) and see them as a drawing, an adjacency list and an adjacency matrix.
2. Compute and display graph properties: degrees, handshaking check, isolated vertices, components, connectivity, cycles, trees, bipartiteness.
3. Implement BFS, DFS, shortest paths, MST algorithms and greedy colouring with step-by-step, reversible visualisation and explanations.
4. Generate and explain linear recurrence sequences with validation, charts, tables and numerical warnings.
5. Provide a concept library with definitions, formulas, worked examples and demos, and a complexity analysis page.
6. Keep the mathematical code separate from the UI and test it automatically.

## 5. Scope

**In scope:** simple graphs (no self-loops or parallel edges) with up to 100 vertices and 1000 edges; the algorithms listed above; linear homogeneous recurrences with constant coefficients (order 1–10, up to 500 terms); local persistence in the browser; JSON import/export of graphs; CSV export of sequences.

**Out of scope:** multigraphs and self-loops; planar-graph drawing algorithms; Bellman–Ford / negative-weight shortest paths; maximum flow; exact chromatic-number computation for large graphs (it is computed only up to 12 vertices); closed-form solution of recurrences (non-homogeneous recurrences and the characteristic-equation method are explained as theory only); user accounts or server storage.

## 6. Existing approach and proposed solution

**Existing approach.** Lecture notes and textbooks with static figures; general-purpose programming exercises that print results but do not show intermediate states; online visualisers that animate a single fixed example.

**Proposed solution.** A single-page web application with six modules (dashboard, graph explorer, algorithm simulator, recurrence lab, concepts library, complexity analyzer). Its distinguishing design decisions are:

- an **execution engine** that records each algorithm as a list of immutable state snapshots, so that *Previous step* is exact and cheap;
- a documented **neighbour-ordering rule** (vertex-list order) that makes all results reproducible and testable;
- explicit handling of **preconditions** (e.g. Dijkstra refuses negative weights, MST requires an undirected graph) with clear messages;
- honest statements about **limits**: greedy colouring is not guaranteed optimal, numbers above 2^53 − 1 are flagged, closed forms are not computed.

## 7. Hardware and software requirements

| | Minimum |
|---|---|
| Hardware | Any computer or tablet able to run a current web browser; 4 GB RAM recommended |
| Operating system | Windows, macOS or Linux (development and testing were done on Windows 11) |
| Runtime for development | Node.js 20+ (used: 22.20) and npm 10+ |
| Browser | A current Chromium-based browser, Firefox or Safari with JavaScript and localStorage enabled |
| Libraries | React 19, TypeScript, Vite, Tailwind CSS 4, Lucide React, React Flow, Recharts, React Router, Vitest, React Testing Library, Playwright, ESLint (exact versions in `package.json` / `package-lock.json`) |
| Network | Only to install packages; the running application needs no network or API key |

## 8. System architecture

The application is a client-side single-page app with four layers:

1. **Mathematical core** (`src/algorithms`, `src/recurrence`, `src/utils/graph.ts`, `minHeap`, `disjointSet`): pure TypeScript functions with no React imports. Inputs are `Graph` / `RecurrenceConfig` values; outputs are results plus (for algorithms) an `AlgorithmTrace`.
2. **State and persistence** (`src/store`, `src/utils/storage.ts`): React context stores keep the working graph, saved graphs, recurrence form, saved configurations and history, and mirror them to localStorage with validation of everything that is read back (corrupted data falls back to defaults).
3. **Hooks** (`useStepPlayer`, `useStructuralGraph`): `useStepPlayer` navigates a recorded list; `useStructuralGraph` keeps an algorithm run stable while a vertex is merely dragged.
4. **Presentation** (`src/components`, `src/pages`): React components; the graph drawing uses React Flow with custom vertex and edge components, charts use Recharts.

```
UI pages ──► stores (context + localStorage) ──► core algorithms (pure TS)
   │                                                  │
   └──────── useStepPlayer ◄── AlgorithmTrace (list of snapshots)
```

## 9. Mathematical background

- **Graph.** G = (V, E). Undirected edges are unordered pairs, directed edges ordered pairs, weighted graphs have w: E → ℝ.
- **Degree and handshaking lemma.** deg(v) = number of incident edges; Σ deg(v) = 2\|E\|; in a digraph Σ deg⁻ = Σ deg⁺ = \|E\|.
- **Representations.** Adjacency matrix (V × V, O(V²) space) and adjacency list (O(V + E) space).
- **Connectivity, trees, cycles.** A graph with n vertices, m edges and c components has m ≥ n − c, with equality iff it is acyclic; a tree is a connected acyclic graph (m = n − 1).
- **Bipartite graphs.** Bipartite ⇔ no odd cycle ⇔ 2-colourable.
- **Colouring.** χ(G) ≤ Δ + 1; greedy colouring achieves this bound but need not reach χ(G).
- **Shortest paths.** Path weight = sum of edge weights; relaxation `d[v] ← min(d[v], d[u] + w(u,v))`; Dijkstra is correct for non-negative weights.
- **Spanning trees.** A spanning tree has V − 1 edges; the cut property justifies Kruskal's and Prim's greedy choices.
- **Recurrences.** `a(n) = c1 a(n−1) + … + ck a(n−k)` with k initial values defines a unique sequence. Fibonacci: F(0)=0, F(1)=1, F(n)=F(n−1)+F(n−2), Σ F(0..n) = F(n+2) − 1. Arithmetic: a(n)=a(0)+nd; geometric: a(n)=a(0)rⁿ.
- **Complexity.** Big-O notation for time and space in terms of V and E.

## 10. Algorithm descriptions

See [ALGORITHMS.md](ALGORITHMS.md) for the full description, neighbour-ordering rule, correctness notes and complexity of: BFS, DFS, BFS shortest path, Dijkstra, Kruskal, Prim, greedy colouring (with exact χ for ≤ 12 vertices), connected components, strongly connected components, cycle detection, bipartite test and linear recurrence generation.

## 11. Implementation details

- **Trace engine.** `TraceBuilder.add()` stores a deep copy of the algorithm state (visited vertices, queue/stack/heap contents, distances, parents, selected/rejected edges, colours, explanation). The UI maps a step to colours/labels with `stepToVisuals`, so drawings never depend on how the algorithm is written.
- **Accessibility.** Every state is also written as text (vertex state table, labels under vertices, badges for order/distance/colour, dashed/solid line styles); forms have labels and inline errors; tabs support arrow keys; navigation collapses on small screens; a skip link is provided.
- **Validation.** Graph names (1–12 letters/digits/underscores), references, duplicates, weights, JSON imports, manual text input (all problems reported with line numbers), and recurrence inputs are validated before use; failed edits change nothing.
- **Persistence.** Working graph, saved graphs, recurrence form, last generated sequence, saved configurations and history are stored in localStorage and survive a refresh. Unsaved edits trigger a confirmation before they would be discarded.
- **Numerical safeguards.** Warnings for integers beyond 2^53 − 1, truncation at overflow, notes for decimal inputs.
- **Performance of the UI.** Pages are loaded on demand (React lazy); a production build is ≈ 105 kB gzipped for the main bundle plus ≈ 98 kB for the charting library, loaded when needed.

## 12. Screenshots

Real screenshots captured from the running application (command `npm run screenshots`) are stored in `docs/screenshots/`. **[PLACEHOLDER — insert or replace with the students' own screenshots if the college requires them.]**

| Figure | File |
|---|---|
| Dashboard | `docs/screenshots/01-dashboard.png` |
| Graph Explorer | `docs/screenshots/02-graph-explorer.png` |
| Algorithm Simulator (BFS, step 7) | `docs/screenshots/03-algorithm-simulator-bfs.png` |
| Shortest path (Dijkstra) | `docs/screenshots/04-shortest-path-dijkstra.png` |
| Recurrence Lab (Fibonacci) | `docs/screenshots/05-recurrence-lab.png` |
| Concepts Library | `docs/screenshots/06-concepts-library.png` |
| Complexity Analyzer | `docs/screenshots/07-complexity-analyzer.png` |
| Mobile layout | `docs/screenshots/08-mobile-dashboard.png` |

## 13. Testing and results

Results of the final runs (details in [TEST_CASES.md](TEST_CASES.md)):

| Check | Result |
|---|---|
| Unit and component tests (`npm test`) | 142 passed, 0 failed (8 files) |
| Browser tests (`npm run test:e2e`) | 18 passed (8 opt-in screenshot tests skipped) |
| ESLint | no errors |
| TypeScript | no errors |
| Production build | succeeds |

The unit tests cover the required cases: empty graph, single vertex, no edges, connected / disconnected, cycles, trees, bipartite and non-bipartite graphs, isolated vertices, directed degrees, invalid references; BFS/DFS order under the neighbour rule, disconnected graphs, invalid start; shortest paths with multiple paths, unreachable targets, source = destination, weights, zero weights and negative-weight rejection; MSTs for connected, multi-MST, disconnected and single-vertex graphs and negative weights; recurrences (Fibonacci, first order, custom second order, bad initial conditions, bad coefficients, bad term count, precision and overflow warnings). **No performance measurements were taken, and none are claimed.**

## 14. Limitations

- Only simple graphs (no self-loops or parallel edges); at most 100 vertices and 1000 edges.
- DFS and BFS visit only the component of the start vertex.
- Dijkstra does not handle negative weights (by design); Bellman–Ford is not implemented.
- Greedy colouring is a heuristic; the exact chromatic number is computed only for graphs of at most 12 vertices.
- Recurrence terms are ordinary JavaScript numbers: integers above 2^53 − 1 are inexact (the app warns) and values above ≈ 1.8 × 10^308 cannot be represented. Only homogeneous linear recurrences are supported, and no closed-form solving is performed.
- Data is stored per browser; clearing browser data deletes it (use Export JSON).
- Automatic layout is limited to a circular arrangement; large graphs must be arranged by hand.
- Browser testing was done with Chromium only.

## 15. Future enhancements

Arbitrary-precision (BigInt) recurrence evaluation; non-homogeneous recurrences and closed-form solving (characteristic equation); Bellman–Ford, Floyd–Warshall, topological sort, maximum flow; multigraphs and self-loops; automatic force-directed layout; exact colouring for larger graphs with better algorithms; export of a drawing as an image; shareable links; user-defined exercises with automatic checking.

## 16. Conclusion

GraphRecur Lab turns the main ideas of a graph-theory and recurrence-relation unit into something a student can try: draw a graph, predict what BFS will do, press *Next step*, step back, and compare with the explanation. Keeping the mathematics in testable, UI-independent modules and recording every algorithm as reversible snapshots made the step-by-step feature both exact and simple. The project also illustrates the difference between a theoretical bound and a practical limit (the 2^53 precision warning, the greedy-colouring caveat).

## 17. References

Only generally known sources are listed; the students should add the editions they actually used. **[PLACEHOLDER — complete with the exact edition and page numbers used.]**

1. K. H. Rosen, *Discrete Mathematics and Its Applications*, McGraw-Hill.
2. T. H. Cormen, C. E. Leiserson, R. L. Rivest, C. Stein, *Introduction to Algorithms*, MIT Press.
3. E. W. Dijkstra, "A note on two problems in connexion with graphs", *Numerische Mathematik* 1 (1959), 269–271.
4. J. B. Kruskal, "On the shortest spanning subtree of a graph and the traveling salesman problem", *Proc. AMS* 7 (1956), 48–50.
5. R. C. Prim, "Shortest connection networks and some generalizations", *Bell System Technical Journal* 36 (1957), 1389–1401.
6. R. E. Tarjan, "Depth-first search and linear graph algorithms", *SIAM J. Computing* 1 (1972), 146–160.
7. Documentation of the libraries used: React, Vite, Tailwind CSS, React Flow (xyflow), Recharts, Vitest, Playwright.
