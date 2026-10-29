export type ConceptCategory = 'Graph basics' | 'Graph structure' | 'Graph algorithms' | 'Recurrence relations' | 'Analysis';

export type GraphFact = 'degrees' | 'handshake' | 'matrix' | 'list' | 'components' | 'cycle' | 'tree' | 'bipartite';

export type DemoSpec =
  | { type: 'graph-facts'; exampleId: string; facts: GraphFact[] }
  | { type: 'trace'; algorithm: 'bfs' | 'dfs' | 'dijkstra' | 'bfs-path' | 'kruskal' | 'prim' | 'coloring'; exampleId: string; start?: string; target?: string }
  | { type: 'sequence'; preset: 'fibonacci' | 'arithmetic' | 'geometric' | 'second-order' }
  | { type: 'link'; to: string; label: string };

export interface Concept {
  id: string;
  title: string;
  category: ConceptCategory;
  /** 1. short definition */
  definition: string;
  /** 2. formulas (plain text, shown in monospace) */
  formulas: string[];
  /** 3. worked example */
  example: { title: string; steps: string[] };
  /** 4. simple student-friendly explanation */
  simple: string;
  /** 5. interactive example */
  demo: DemoSpec;
  related?: string[];
}

export const CONCEPTS: Concept[] = [
  {
    id: 'graphs',
    title: 'Graphs and their components',
    category: 'Graph basics',
    definition: 'A graph G = (V, E) consists of a set V of vertices (nodes) and a set E of edges, where each edge joins two vertices.',
    formulas: ['G = (V, E)', 'n = |V| (order), m = |E| (size)'],
    example: {
      title: 'The graph with V = {A, B, C, D, E} and E = {AB, AC, BD, CD, DE}',
      steps: ['|V| = 5 vertices.', '|E| = 5 edges.', 'A and B are adjacent (joined by an edge); A and D are not.', 'The edge AB is incident to the vertices A and B.'],
    },
    simple: 'Think of cities (vertices) and roads (edges). A graph only records which cities are directly connected, not how far apart they are drawn.',
    demo: { type: 'graph-facts', exampleId: 'simple-connected', facts: ['list'] },
    related: ['types', 'degree'],
  },
  {
    id: 'types',
    title: 'Types of graphs',
    category: 'Graph basics',
    definition:
      'In an undirected graph an edge is an unordered pair {u, v}; in a directed graph (digraph) it is an ordered pair (u, v) drawn as an arrow. A weighted graph also has a function w: E → ℝ. A simple graph has no self-loops and no parallel edges (this app works with simple graphs).',
    formulas: ['Undirected edge: {u, v} = {v, u}', 'Directed edge: (u, v) ≠ (v, u)', 'Complete graph Kₙ has n(n − 1)/2 edges'],
    example: {
      title: 'How many edges does K₅ have?',
      steps: ['Each of the 5 vertices is joined to the other 4: 5 · 4 = 20 endpoint pairs.', 'Every edge was counted twice, so |E| = 20 / 2 = 10 = 5·4/2.'],
    },
    simple: 'Undirected edges are two-way streets, directed edges are one-way streets, and weights are the distances or costs written on the streets.',
    demo: { type: 'graph-facts', exampleId: 'directed-weighted', facts: ['list', 'matrix'] },
    related: ['graphs', 'adjacency-matrix'],
  },
  {
    id: 'degree',
    title: 'Degree of a vertex',
    category: 'Graph basics',
    definition:
      'In an undirected graph deg(v) is the number of edges incident to v. In a directed graph the in-degree deg⁻(v) counts edges entering v and the out-degree deg⁺(v) counts edges leaving v. A vertex of degree 0 is isolated.',
    formulas: ['deg(v) = number of edges at v', 'Directed: deg(v) = deg⁻(v) + deg⁺(v)'],
    example: {
      title: 'Degrees in the graph E = {AB, AC, BD, CD, DE}',
      steps: ['deg(A) = 2 (B, C)', 'deg(B) = 2 (A, D)', 'deg(C) = 2 (A, D)', 'deg(D) = 3 (B, C, E)', 'deg(E) = 1 (D)'],
    },
    simple: 'The degree is just "how many roads meet at this city".',
    demo: { type: 'graph-facts', exampleId: 'simple-connected', facts: ['degrees'] },
    related: ['handshaking'],
  },
  {
    id: 'handshaking',
    title: 'Handshaking lemma',
    category: 'Graph basics',
    definition:
      'In every undirected graph the sum of the degrees equals twice the number of edges, because each edge contributes 1 to the degree of each of its two endpoints. Consequently the number of vertices with odd degree is even. In a digraph, the sum of in-degrees equals the sum of out-degrees equals |E|.',
    formulas: ['Σ deg(v) over all v ∈ V = 2|E|', 'Digraph: Σ deg⁻(v) = Σ deg⁺(v) = |E|'],
    example: {
      title: 'Check with the example graph',
      steps: ['Degrees: 2 + 2 + 2 + 3 + 1 = 10.', '2|E| = 2 · 5 = 10. Equal ✓.', 'Odd-degree vertices: D and E → 2 of them, an even number ✓.'],
    },
    simple: 'If everyone at a party counts how many hands they shook, the total is always twice the number of handshakes, since every handshake involves two people.',
    demo: { type: 'graph-facts', exampleId: 'simple-connected', facts: ['degrees', 'handshake'] },
    related: ['degree'],
  },
  {
    id: 'adjacency-matrix',
    title: 'Adjacency matrix',
    category: 'Graph basics',
    definition:
      'For vertices v₁ … vₙ the adjacency matrix A is the n × n matrix with A[i][j] = 1 if there is an edge from vᵢ to vⱼ and 0 otherwise (for weighted graphs the entry is the weight). It is symmetric for undirected graphs and needs O(V²) memory.',
    formulas: ['A[i][j] = 1 if (vᵢ, vⱼ) ∈ E, else 0', 'Undirected: A = Aᵀ', '(Aᵏ)[i][j] = number of walks of length k from vᵢ to vⱼ', 'Undirected simple graph: (A²)[i][i] = deg(vᵢ)'],
    example: {
      title: 'Matrix of the example graph (order A, B, C, D, E)',
      steps: ['Row A: 0 1 1 0 0 (A is adjacent to B and C).', 'Row D: 0 1 1 0 1 (D is adjacent to B, C and E).', 'The matrix is symmetric, and each row sum equals the degree of that vertex.'],
    },
    simple: 'A table with one row and one column per vertex; put a 1 where a road exists. Looking up "is there a road from X to Y?" is instant.',
    demo: { type: 'graph-facts', exampleId: 'simple-connected', facts: ['matrix'] },
    related: ['adjacency-list'],
  },
  {
    id: 'adjacency-list',
    title: 'Adjacency list',
    category: 'Graph basics',
    definition: 'An adjacency list stores, for every vertex, the list of its neighbours (out-neighbours in a digraph). It needs O(V + E) memory and is the representation used by the algorithms in this project.',
    formulas: ['Storage: V + 2E entries (undirected), V + E entries (directed)', 'Listing the neighbours of v takes O(deg v)'],
    example: {
      title: 'Lists for the example graph',
      steps: ['A → B, C', 'B → A, D', 'C → A, D', 'D → B, C, E', 'E → D'],
    },
    simple: 'For each city keep a short address book of the cities it has a road to. Good when there are few roads.',
    demo: { type: 'graph-facts', exampleId: 'simple-connected', facts: ['list'] },
    related: ['adjacency-matrix', 'complexity'],
  },
  {
    id: 'bfs',
    title: 'Breadth-First Search (BFS)',
    category: 'Graph algorithms',
    definition:
      'BFS explores a graph level by level using a queue: starting from a source it visits all vertices at distance 1, then all at distance 2, and so on. In an unweighted graph it finds shortest paths measured in number of edges.',
    formulas: ['Time O(V + E) with adjacency lists', 'dist(v) = dist(parent(v)) + 1'],
    example: {
      title: 'BFS from A on the example graph (neighbours in V order)',
      steps: ['Queue [A]. Dequeue A → enqueue B, C. Queue [B, C].', 'Dequeue B → enqueue D. Queue [C, D].', 'Dequeue C → D already seen. Queue [D].', 'Dequeue D → enqueue E. Queue [E]. Dequeue E.', 'Order: A, B, C, D, E.'],
    },
    simple: 'Like ripples in a pond: everything one step from the start is reached first, then everything two steps away, and so on.',
    demo: { type: 'trace', algorithm: 'bfs', exampleId: 'simple-connected', start: 'A' },
    related: ['dfs', 'shortest-paths'],
  },
  {
    id: 'dfs',
    title: 'Depth-First Search (DFS)',
    category: 'Graph algorithms',
    definition:
      'DFS goes as deep as possible along one path before backtracking, using a stack (here the recursion stack). When a vertex has no unvisited neighbours it is finished and the search returns to the previous vertex.',
    formulas: ['Time O(V + E) with adjacency lists', 'Space O(V) for the visited set and stack'],
    example: {
      title: 'DFS from A on the example graph (neighbours in V order)',
      steps: ['Visit A → go to B (its first neighbour).', 'Visit B → go to D (A is already visited).', 'Visit D → go to C (B is visited).', 'C has no new neighbours → backtrack to D → go to E.', 'Order: A, B, D, C, E.'],
    },
    simple: 'Like exploring a maze: keep walking down a corridor until you hit a dead end, then step back to the last junction and try another corridor.',
    demo: { type: 'trace', algorithm: 'dfs', exampleId: 'simple-connected', start: 'A' },
    related: ['bfs', 'cycles'],
  },
  {
    id: 'connected',
    title: 'Connected graphs',
    category: 'Graph structure',
    definition:
      'An undirected graph is connected if there is a path between every pair of vertices. Otherwise it splits into connected components. A directed graph is strongly connected if every vertex can reach every other following arrow directions, and weakly connected if it is connected after ignoring directions.',
    formulas: ['A connected graph on n vertices has at least n − 1 edges', 'A graph with c components has at least n − c edges'],
    example: {
      title: 'V = {A, B, C, D}, E = {AB, CD}',
      steps: ['A and B can reach each other; C and D can reach each other.', 'No path joins {A, B} to {C, D}, so there are 2 components and the graph is not connected.', 'n − c = 4 − 2 = 2 = |E| ✓.'],
    },
    simple: 'A graph is connected if you can travel from any city to any other. If not, it is made of separate "islands" called components.',
    demo: { type: 'graph-facts', exampleId: 'disconnected', facts: ['components'] },
    related: ['trees', 'bfs'],
  },
  {
    id: 'trees',
    title: 'Trees',
    category: 'Graph structure',
    definition:
      'A tree is a connected undirected graph with no cycles. Equivalent statements for a graph with n ≥ 1 vertices: it is connected and has n − 1 edges; between any two vertices there is exactly one path; removing any edge disconnects it.',
    formulas: ['Tree on n vertices: |E| = n − 1', 'Every tree with n ≥ 2 vertices has at least 2 leaves (degree-1 vertices)'],
    example: {
      title: 'The 7-vertex tree in the demo',
      steps: ['n = 7 and |E| = 6 = n − 1.', 'It is connected and has no cycle.', 'Leaves (degree 1): D, E, F, G.'],
    },
    simple: 'A tree is a network with no loops where everything is connected, like a family tree or folder structure.',
    demo: { type: 'graph-facts', exampleId: 'tree', facts: ['tree', 'degrees'] },
    related: ['connected', 'cycles', 'mst'],
  },
  {
    id: 'cycles',
    title: 'Cycles',
    category: 'Graph structure',
    definition:
      'A cycle is a closed path that returns to its start without repeating other vertices (at least 3 vertices in a simple undirected graph). A graph with no cycle is acyclic. DFS detects cycles by finding an edge back to a vertex that is still on the recursion stack.',
    formulas: ['Undirected graph with n vertices, m edges and c components: it has a cycle ⇔ m > n − c', 'Directed acyclic graph = DAG'],
    example: {
      title: 'Triangle A–B–C–A',
      steps: ['n = 3, m = 3, c = 1.', 'm = 3 > n − c = 2, so a cycle must exist: A → B → C → A.'],
    },
    simple: 'A cycle is a loop you can walk around and end up where you started.',
    demo: { type: 'graph-facts', exampleId: 'cycle', facts: ['cycle', 'tree'] },
    related: ['trees', 'dfs'],
  },
  {
    id: 'bipartite',
    title: 'Bipartite graphs',
    category: 'Graph structure',
    definition:
      'A graph is bipartite if its vertices can be split into two sets X and Y so that every edge joins a vertex of X to a vertex of Y. A graph is bipartite exactly when it has no odd cycle, which is the same as being 2-colourable. BFS can test this in O(V + E).',
    formulas: ['Bipartite ⇔ no odd cycle ⇔ χ(G) ≤ 2', 'K_{m,n} has m · n edges'],
    example: {
      title: 'K₃,₃ versus a triangle',
      steps: ['K₃,₃ with X = {A, B, C} and Y = {D, E, F}: every edge goes between X and Y → bipartite, 3 · 3 = 9 edges.', 'A triangle has an odd cycle (length 3) → not bipartite.'],
    },
    simple: 'Can you split the people into two teams so that every pair of friends (edge) is on opposite teams? If yes, the graph is bipartite.',
    demo: { type: 'graph-facts', exampleId: 'bipartite', facts: ['bipartite'] },
    related: ['coloring', 'cycles'],
  },
  {
    id: 'coloring',
    title: 'Graph colouring',
    category: 'Graph algorithms',
    definition:
      'A proper colouring assigns colours to vertices so that adjacent vertices get different colours. The chromatic number χ(G) is the smallest number of colours possible. Greedy colouring processes vertices in some order and gives each the smallest colour not used by its coloured neighbours; it is fast but only a heuristic.',
    formulas: ['χ(G) ≥ size of the largest clique', 'χ(G) ≤ Δ(G) + 1, and greedy never uses more than Δ + 1 colours', 'Greedy colouring: O(V + E)'],
    example: {
      title: 'Triangle A–B–C',
      steps: ['A gets colour 1.', 'B is adjacent to A (1) → colour 2.', 'C is adjacent to A (1) and B (2) → colour 3.', 'χ = 3 here, so greedy is optimal. On other graphs or orders greedy may use more colours than χ(G).'],
    },
    simple: 'Like scheduling exams: connected vertices are exams that share students, colours are time slots, and you want as few slots as possible.',
    demo: { type: 'trace', algorithm: 'coloring', exampleId: 'cycle' },
    related: ['bipartite'],
  },
  {
    id: 'shortest-paths',
    title: 'Shortest paths',
    category: 'Graph algorithms',
    definition:
      'The length of a path in a weighted graph is the sum of its edge weights, and d(s, t) is the smallest length of any path from s to t. BFS solves the unweighted case. Dijkstra\'s algorithm solves single-source shortest paths when all weights are non-negative by repeatedly settling the vertex with the smallest tentative distance and relaxing its outgoing edges.',
    formulas: ['Relaxation: if d[u] + w(u, v) < d[v] then d[v] ← d[u] + w(u, v)', 'Dijkstra: O((V + E) log V) with a binary heap', 'Requires w(e) ≥ 0 for every edge'],
    example: {
      title: 'Weighted example: A → D',
      steps: ['d[A] = 0. Relax A–B: d[B] = 2, A–C: d[C] = 4.', 'Settle B (2). Relax B–C: 2 + 1 = 3 < 4 → d[C] = 3. Relax B–D: d[D] = 9.', 'Settle C (3). Relax C–D: 3 + 3 = 6 < 9 → d[D] = 6.', 'Shortest path A → B → C → D with cost 6 (the path with fewest edges, A → B → D, costs 9).'],
    },
    simple: 'Find the cheapest route, not just the one with the fewest stops. Dijkstra always finalises the closest unfinished city first.',
    demo: { type: 'trace', algorithm: 'dijkstra', exampleId: 'weighted', start: 'A', target: 'D' },
    related: ['bfs', 'mst'],
  },
  {
    id: 'mst',
    title: 'Minimum spanning trees',
    category: 'Graph algorithms',
    definition:
      'A spanning tree of a connected undirected graph is a tree that contains all vertices. A minimum spanning tree (MST) is a spanning tree of least total weight. Kruskal adds the cheapest edge that does not create a cycle; Prim grows one tree by repeatedly adding the cheapest edge leaving it. A disconnected graph has a minimum spanning forest instead.',
    formulas: ['A spanning tree has exactly V − 1 edges', 'Kruskal: O(E log E)', 'Prim (binary heap): O((V + E) log V)'],
    example: {
      title: 'Weighted example',
      steps: ['Sorted edges: BC(1), AB(2), CD(3), AC(4), BD(7).', 'Take BC, AB, CD (each joins different components); the next edges AC and BD would create cycles.', 'MST = {BC, AB, CD}, total weight 1 + 2 + 3 = 6.'],
    },
    simple: 'Connect all the towns with cable using as little cable as possible and no unnecessary loops.',
    demo: { type: 'trace', algorithm: 'kruskal', exampleId: 'weighted' },
    related: ['trees', 'shortest-paths'],
  },
  {
    id: 'recurrence',
    title: 'Recurrence relations',
    category: 'Recurrence relations',
    definition:
      'A recurrence relation defines each term of a sequence from earlier terms. A linear homogeneous recurrence of order k with constant coefficients has the form a(n) = c₁·a(n−1) + … + cₖ·a(n−k) and needs k initial conditions a(0) … a(k−1) to determine the whole sequence.',
    formulas: ['a(n) = c₁a(n−1) + c₂a(n−2) + … + cₖa(n−k)', 'Theory (not computed by this app): characteristic equation rᵏ = c₁rᵏ⁻¹ + … + cₖ'],
    example: {
      title: 'a(n) = 3a(n−1) − 2a(n−2), a(0) = 0, a(1) = 1',
      steps: ['a(2) = 3·1 − 2·0 = 3', 'a(3) = 3·3 − 2·1 = 7', 'a(4) = 3·7 − 2·3 = 15', 'Sequence 0, 1, 3, 7, 15, … (the pattern 2ⁿ − 1 can be found by solving the characteristic equation r² = 3r − 2, whose roots are 1 and 2 — this is done by hand here; the Recurrence Lab only evaluates the recurrence).'],
    },
    simple: 'A recurrence is a rule like "each number is built from the previous ones" plus the starting numbers.',
    demo: { type: 'sequence', preset: 'second-order' },
    related: ['fibonacci', 'sequences'],
  },
  {
    id: 'fibonacci',
    title: 'Fibonacci sequence',
    category: 'Recurrence relations',
    definition: 'The Fibonacci numbers are defined by F(0) = 0, F(1) = 1 and F(n) = F(n−1) + F(n−2) for n ≥ 2: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, …',
    formulas: ['F(n) = F(n−1) + F(n−2)', 'Σ_{i=0..n} F(i) = F(n+2) − 1', 'Binet: F(n) = (φⁿ − ψⁿ)/√5 with φ = (1+√5)/2, ψ = (1−√5)/2', 'F(n+1)/F(n) → φ ≈ 1.6180'],
    example: {
      title: 'Sum identity for n = 10',
      steps: ['0 + 1 + 1 + 2 + 3 + 5 + 8 + 13 + 21 + 34 + 55 = 143.', 'F(12) − 1 = 144 − 1 = 143 ✓.'],
    },
    simple: 'Each number is the sum of the two before it. Rabbit-breeding puzzles, spirals in shells and many algorithms follow this pattern.',
    demo: { type: 'sequence', preset: 'fibonacci' },
    related: ['recurrence'],
  },
  {
    id: 'sequences',
    title: 'Arithmetic and geometric sequences',
    category: 'Recurrence relations',
    definition:
      'In an arithmetic sequence consecutive terms differ by a constant d: a(n) = a(n−1) + d. In a geometric sequence consecutive terms have a constant ratio r: a(n) = r·a(n−1).',
    formulas: [
      'Arithmetic: a(n) = a(0) + n·d, sum of the first N terms = N(2a(0) + (N−1)d)/2',
      'Geometric: a(n) = a(0)·rⁿ, sum of the first N terms = a(0)(rᴺ − 1)/(r − 1) for r ≠ 1',
      'In the Recurrence Lab an arithmetic sequence is entered as the order-2 recurrence a(n) = 2a(n−1) − a(n−2)',
    ],
    example: {
      title: 'a(0) = 2, d = 4 and a(0) = 2, r = 3',
      steps: ['Arithmetic: 2, 6, 10, 14; sum of 4 terms = 4(4 + 12)/2 = 32 = 2 + 6 + 10 + 14 ✓.', 'Geometric: 2, 6, 18, 54; sum of 4 terms = 2(3⁴ − 1)/2 = 80 = 2 + 6 + 18 + 54 ✓.'],
    },
    simple: 'Arithmetic = keep adding the same number (steady growth). Geometric = keep multiplying by the same number (doubling, halving, compound interest).',
    demo: { type: 'sequence', preset: 'arithmetic' },
    related: ['recurrence'],
  },
  {
    id: 'complexity',
    title: 'Time complexity of the implemented algorithms',
    category: 'Analysis',
    definition:
      'Big-O notation describes how an algorithm\'s running time or memory grows with the input size. For graphs the size is given by V (vertices) and E (edges), and the bound depends on the representation used.',
    formulas: ['BFS, DFS: O(V + E)', 'Dijkstra (binary heap): O((V + E) log V)', 'Kruskal: O(E log E)', 'Prim (binary heap): O((V + E) log V)', 'Adjacency matrix: O(V²) space; adjacency list: O(V + E) space'],
    example: {
      title: 'Why BFS is O(V + E)',
      steps: ['Each vertex is enqueued and dequeued at most once: O(V).', 'Each adjacency entry is examined once when its vertex is dequeued: O(E) (2E for undirected).', 'Total O(V + E).'],
    },
    simple: 'It tells you how much slower an algorithm gets when the graph gets bigger, ignoring tiny details such as the speed of your computer.',
    demo: { type: 'link', to: '/complexity', label: 'Open the Complexity Analyzer' },
    related: ['bfs', 'dfs'],
  },
];

export const CONCEPT_CATEGORIES: ConceptCategory[] = ['Graph basics', 'Graph structure', 'Graph algorithms', 'Recurrence relations', 'Analysis'];
