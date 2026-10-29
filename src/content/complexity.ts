export interface ComplexityEntry {
  id: string;
  name: string;
  time: string;
  space: string;
  /** Which parameters make the bound: used by the numeric evaluator on the Complexity page. */
  growth: 'V+E' | '(V+E)logV' | 'ElogE' | 'V^2' | 'V+2E' | 'N*k' | 'exp';
  conditions: string;
  matchesCode: string;
}

/**
 * Every row below describes the code in src/algorithms (or src/recurrence). The "matchesCode"
 * column states which implementation detail the bound depends on.
 */
export const COMPLEXITY_ENTRIES: ComplexityEntry[] = [
  {
    id: 'bfs',
    name: 'Breadth-First Search',
    time: 'O(V + E)',
    space: 'O(V)',
    growth: 'V+E',
    conditions: 'Adjacency list. Each vertex is enqueued at most once and each adjacency entry is examined once.',
    matchesCode: 'bfs.ts: array-backed queue with a head index (O(1) dequeue) and a Set for visited vertices.',
  },
  {
    id: 'dfs',
    name: 'Depth-First Search',
    time: 'O(V + E)',
    space: 'O(V)',
    growth: 'V+E',
    conditions: 'Adjacency list. Space is for the visited set and the recursion stack (up to V deep on a path-like graph).',
    matchesCode: 'dfs.ts: recursive; every vertex is visited once and every adjacency entry examined once.',
  },
  {
    id: 'bfs-sp',
    name: 'BFS shortest path (unweighted)',
    time: 'O(V + E)',
    space: 'O(V)',
    growth: 'V+E',
    conditions: 'One BFS from the source plus walking the parent pointers (at most V steps).',
    matchesCode: 'shortestPath.ts: reuses bfs.ts, then reconstructPath.',
  },
  {
    id: 'dijkstra',
    name: "Dijkstra's algorithm",
    time: 'O((V + E) log V)',
    space: 'O(V + E)',
    growth: '(V+E)logV',
    conditions: 'Binary-heap priority queue and adjacency list; non-negative weights. The heap uses lazy deletion, so it can hold up to E entries (hence O(V + E) space and O(E log E) = O(E log V) heap work).',
    matchesCode: 'dijkstra.ts with utils/minHeap.ts (binary heap, push/pop O(log n)). With an array scan instead of a heap it would be O(V²).',
  },
  {
    id: 'kruskal',
    name: "Kruskal's algorithm",
    time: 'O(E log E)',
    space: 'O(V + E)',
    growth: 'ElogE',
    conditions: 'Sorting the edges dominates; union-find with path compression and union by rank is nearly constant time per operation. Since E ≤ V², O(E log E) = O(E log V).',
    matchesCode: 'kruskal.ts: Array.prototype.sort on a copy of the edges, then utils/disjointSet.ts.',
  },
  {
    id: 'prim',
    name: "Prim's algorithm",
    time: 'O((V + E) log V)',
    space: 'O(V + E)',
    growth: '(V+E)logV',
    conditions: 'Binary-heap priority queue and adjacency lists (lazy version: stale edges are skipped when popped, so the heap may hold up to E entries).',
    matchesCode: 'prim.ts with utils/minHeap.ts. Restarts from the next unvisited vertex for disconnected graphs (same bound).',
  },
  {
    id: 'coloring',
    name: 'Greedy graph colouring',
    time: 'O(V + E)  (+ O(V log V) to sort by degree)',
    space: 'O(V + E)',
    growth: 'V+E',
    conditions: 'For a given vertex order each vertex looks at its neighbours once. It does NOT find the minimum number of colours.',
    matchesCode: 'graphColoring.ts: greedyColoring. The optional exact chromatic number search is exponential and limited to 12 vertices.',
  },
  {
    id: 'components',
    name: 'Components, bipartite test, cycle detection',
    time: 'O(V + E)',
    space: 'O(V + E)',
    growth: 'V+E',
    conditions: 'Each is a single BFS/DFS pass over the adjacency structure.',
    matchesCode: 'connectivity.ts, bipartite.ts, cycleDetection.ts.',
  },
  {
    id: 'matrix',
    name: 'Adjacency matrix (storage)',
    time: 'O(1) edge lookup · O(V) to list neighbours · O(V²) to build',
    space: 'O(V²)',
    growth: 'V^2',
    conditions: 'One cell for every ordered pair of vertices, regardless of how few edges exist.',
    matchesCode: 'adjacency.ts: buildAdjacencyMatrix allocates a V × V array.',
  },
  {
    id: 'list',
    name: 'Adjacency list (storage)',
    time: 'O(deg v) edge lookup · O(1) per neighbour · O(V + E) to build before sorting',
    space: 'O(V + E)',
    growth: 'V+2E',
    conditions: 'An undirected edge appears in two lists, so V + 2E entries are stored. Neighbour lists are then sorted by vertex order to make traversals deterministic, which adds O(E log E) in the worst case.',
    matchesCode: 'adjacency.ts: buildAdjacencyList.',
  },
  {
    id: 'recurrence',
    name: 'Linear recurrence generation',
    time: 'O(N · k)',
    space: 'O(N)',
    growth: 'N*k',
    conditions: 'N terms, order k: each new term needs k multiplications and additions.',
    matchesCode: 'recurrence/generateSequence.ts.',
  },
];

export const COMPLEXITY_CAVEATS = [
  'Big-O describes how the running time grows with the input size; it ignores constant factors, so two O(V + E) algorithms can differ a lot in practice.',
  'Actual performance depends on the implementation, the graph representation and the hardware. This page lists the bounds of the code in this project; it does not report measured running times.',
  'The step-by-step simulator additionally copies the algorithm state at every step so that Previous Step works. That recording costs extra time and memory (up to O(V + E) per step) and is not part of the bounds above, which describe the algorithms themselves.',
];
