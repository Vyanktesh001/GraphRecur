/** Union-Find with path compression and union by rank (near-constant amortised time). */
export class DisjointSet {
  private parent = new Map<string, string>();
  private rank = new Map<string, number>();
  private count: number;

  constructor(items: string[]) {
    for (const item of items) {
      this.parent.set(item, item);
      this.rank.set(item, 0);
    }
    this.count = items.length;
  }

  get componentCount(): number {
    return this.count;
  }

  find(x: string): string {
    let root = x;
    while (this.parent.get(root) !== root) root = this.parent.get(root) as string;
    let cur = x;
    while (cur !== root) {
      const next = this.parent.get(cur) as string;
      this.parent.set(cur, root);
      cur = next;
    }
    return root;
  }

  connected(a: string, b: string): boolean {
    return this.find(a) === this.find(b);
  }

  /** Returns true if a merge happened (the two items were in different sets). */
  union(a: string, b: string): boolean {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return false;
    const rankA = this.rank.get(ra) as number;
    const rankB = this.rank.get(rb) as number;
    if (rankA < rankB) this.parent.set(ra, rb);
    else if (rankA > rankB) this.parent.set(rb, ra);
    else {
      this.parent.set(rb, ra);
      this.rank.set(ra, rankA + 1);
    }
    this.count -= 1;
    return true;
  }
}
