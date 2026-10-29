# Algorithms

Notation: V = number of vertices, E = number of edges, N = number of recurrence terms, k = recurrence order. All graph algorithms live in `src/algorithms`, the recurrence code in `src/recurrence`; none of them depends on React.

## Common rules

- **Valid input.** Every algorithm first checks the graph (`assertValidGraph`): unique, well-formed vertex names; edges refer to existing vertices; no self-loops; no parallel edges; finite weights. Invalid graphs raise `GraphError`; invalid arguments (unknown start vertex, negative weight for Dijkstra, directed graph for MST) raise `AlgorithmError`.
- **Neighbour ordering.** The adjacency list sorts each neighbour list by the neighbour's position in the vertex list V. BFS, DFS, Dijkstra and Prim therefore give the same answer every time for the same input. (Kruskal sorts edges by weight; ties keep the order in which the edges were added, because `Array.prototype.sort` is stable.)
- **Weights.** If a graph is not marked "weighted", every edge counts as weight 1.
- **Traces.** Each algorithm records a `TraceStep` after every action (`TraceBuilder` deep-copies the data it is given). A step contains: explanation, current vertex / edge, visited vertices, queue / stack / priority-queue contents, traversal order, tree edges, selected / rejected edges, distances, parents, colours, running total weight. The UI moves an index over this list — *Previous step* is just `index − 1`.
- Recording copies state per step, which costs up to O(V + E) extra per step. The complexity figures below describe the algorithms, not the recorder.

## Graph properties (`connectivity.ts`, `cycleDetection.ts`, `bipartite.ts`, `graphProperties.ts`)

| Property | Method | Time |
|---|---|---|
| Degree | count incident edges; digraph: in-degree, out-degree, total | O(V + E) |
| Handshaking check | undirected: Σdeg = 2\|E\|; digraph: Σin = Σout = \|E\| | O(V) |
| Isolated vertices | vertices with no incident edge | O(V + E) |
| Connected components | BFS on the underlying undirected graph (weak components for digraphs) | O(V + E) |
| Connected | exactly one component. **Convention:** the empty graph is *not* connected | O(V + E) |
| Strongly connected components | Tarjan's algorithm (digraphs) | O(V + E) |
| Cycle | DFS. Undirected: a visited neighbour other than the parent (tracked by edge id). Directed: edge to a vertex still on the recursion stack. Returns an actual cycle | O(V + E) |
| Tree | undirected, connected and acyclic, V ≥ 1. "Not applicable" for digraphs (reported as DAG instead) | O(V + E) |
| Bipartite | BFS 2-colouring of the underlying undirected graph; reports the two sides or a conflicting edge | O(V + E) |

## Breadth-First Search (`bfs.ts`)

FIFO queue (array with a head index, O(1) dequeue). A vertex is marked visited when it is first discovered, so it is enqueued at most once. Records hop distance (level) and parent of each vertex. Visits only vertices reachable from the start. **Time O(V + E), extra space O(V)** with an adjacency list. Directed graphs follow out-edges.

## Depth-First Search (`dfs.ts`)

Recursive DFS; the recorded "stack" is the recursion stack (current path). Each step is a visit, an examined edge to an already visited vertex, or a backtrack. Visits only vertices reachable from the start. **Time O(V + E), space O(V).**

## Shortest paths

- **BFS shortest path (`shortestPath.ts`)** – runs the BFS above and reads the path from the parent pointers. Minimises the *number of edges*; weights are ignored. Between equally short paths the neighbour-ordering rule decides. Source = destination gives path `[s]`, cost 0. Unreachable destination is reported, not an error. O(V + E).
- **Dijkstra (`dijkstra.ts`)** – binary min-heap (`utils/minHeap.ts`) ordered by (distance, vertex position). Lazy deletion: outdated heap entries are skipped when popped. A vertex is *settled* when popped with its current best distance; its out-edges are *relaxed*: `d[u] + w < d[v]` (strict) ⇒ update `d[v]` and `parent[v]`. Every update or non-update is a recorded step. **Negative weights are rejected** because the settled-distance argument fails with them. Zero weights are allowed. Runs to completion so all distances are available. **Time O((V + E) log V), space O(V + E)** (the lazy heap may hold up to E entries).

## Minimum spanning tree (undirected graphs only)

Directed graphs are rejected. Negative weights are *allowed*: both algorithms only compare weights, so correctness does not depend on their sign (this is tested).

- **Kruskal (`kruskal.ts`)** – sort edges by weight; scan them; keep an edge iff its endpoints are in different components (union-find with path compression and union by rank). Each step says whether an edge is selected or rejected and why (cycle). Stops early when one component remains. **O(E log E)**.
- **Prim (`prim.ts`)** – lazy version: grow a tree from the start vertex using a heap of candidate edges ordered by (weight, edge position). A popped edge whose both ends are already in the tree is rejected (cycle). **O((V + E) log V)**.
- **Disconnected graphs.** Kruskal naturally yields a forest; Prim restarts from the first unreached vertex (in V order). Results report `isSpanningTree = false`, the number of components, and the explanation "minimum spanning *forest* with V − k edges".
- Empty graph: nothing to span (not a spanning tree). Single vertex: spanning tree with 0 edges.

## Greedy graph colouring (`graphColoring.ts`)

Vertices are processed in a fixed order — the vertex-list order, or decreasing degree (Welsh–Powell) — and each gets the smallest positive colour not used by an already coloured neighbour. Edge directions are ignored. The result is always a *proper* colouring (checked by `isProperColoring`) and uses at most Δ + 1 colours, but **greedy is a heuristic: it does not necessarily find the chromatic number χ(G)**, and the colour count depends on the order (a test shows greedy using 3 colours on a bipartite graph with χ = 2). To make this visible, graphs with ≤ 12 vertices also get the exact χ(G) from an exhaustive backtracking search (exponential time, hence the limit); for larger graphs the app states that optimality is unknown. Greedy itself: O(V + E) (+ O(V log V) for the degree order).

## Linear recurrences (`generateSequence.ts`)

`a(n) = c1·a(n-1) + … + ck·a(n-k)`; `coefficients[i]` is c(i+1) and multiplies `a(n-1-i)`. The first k terms are the initial conditions `a(0)…a(k-1)`. Terms are evaluated in order: **O(N·k) time, O(N) space**.

Validation: order 1–10; every coefficient and initial value a finite number; exactly k initial conditions; term count a whole number from 1 to 500. The form accepts integers, decimals, exponent notation and fractions such as `1/2`.

Numerical safeguards (JavaScript numbers are IEEE-754 doubles):

- *Unsafe integers* — with all-integer inputs, once a term, a product `c·a`, or a partial sum exceeds 2^53 − 1 = 9 007 199 254 740 991, that term and all later terms are flagged "may be inexact". (Fibonacci: a(78) = 8 944 394 323 791 464 is exact; a(79) is the first flagged term.)
- *Overflow* — if a term would exceed ≈ 1.8 × 10^308 (becomes ±Infinity), generation stops before it and the result reports where.
- *Non-integer inputs* — an informational note that decimals are binary approximations and rounding error can accumulate.

The lab does **not** solve recurrences in closed form. The Concepts Library explains the characteristic-equation method as theory and does the example by hand; the demos only compare closed forms with generated terms as a check.

## Complexity summary

| Algorithm / structure | Time | Space |
|---|---|---|
| BFS, DFS, BFS shortest path | O(V + E) | O(V) |
| Dijkstra (binary heap) | O((V + E) log V) | O(V + E) |
| Kruskal | O(E log E) | O(V + E) |
| Prim (binary heap) | O((V + E) log V) | O(V + E) |
| Greedy colouring | O(V + E) (+ O(V log V) sort) | O(V + E) |
| Components, bipartite, cycle detection | O(V + E) | O(V + E) |
| Adjacency matrix | O(1) edge lookup, O(V²) build | O(V²) |
| Adjacency list | O(deg v) edge lookup | O(V + E) |
| Recurrence generation | O(N·k) | O(N) |

Building the sorted adjacency list sorts each neighbour list, which is O(E log E) in the worst case; the traversals themselves are O(V + E). Actual performance depends on the implementation and data representation; the project does not report measured running times.
