/* ──────────────────────────────────────────────────────────
 * Two-sided matching model behind the Gale–Shapley article.
 *
 * Every function is pure and deterministic (randomness comes from an
 * explicit seed) so the interactive components can rebuild their step
 * lists from scratch and `stable-matching.test.ts` can check the same
 * code against brute force.
 *
 * Conventions
 *   - The "left" side is A, B, C, …  The "right" side is …, X, Y, Z.
 *   - prefs[i] lists indices of the other side, best first. A list may
 *     be incomplete: anybody omitted is unacceptable.
 *   - A one-to-one matching is stored as `left → right | null`.
 * ────────────────────────────────────────────────────────── */

export type Prefs = number[][];
export type Instance = { left: Prefs; right: Prefs };
export type Side = "left" | "right";
export type Order = "round" | "queue" | "stack" | "random";
export type Matching = (number | null)[];

const LEFT_POOL = ["A", "B", "C", "D", "E", "F"];
const RIGHT_POOL = ["U", "V", "W", "X", "Y", "Z"];

export function leftLabel(i: number): string {
  return LEFT_POOL[i] ?? `L${i}`;
}

/** Right-side labels end at Z: n = 4 gives W, X, Y, Z. */
export function rightLabel(j: number, n: number): string {
  return RIGHT_POOL[RIGHT_POOL.length - n + j] ?? `R${j}`;
}

export function label(side: Side, index: number, rightSize: number): string {
  return side === "left" ? leftLabel(index) : rightLabel(index, rightSize);
}

/** rank[i][j] = position of j in i's list (0 = best); Infinity if unacceptable. */
export function rankTable(prefs: Prefs, otherSize: number): number[][] {
  return prefs.map((list) => {
    const rank = new Array<number>(otherSize).fill(Infinity);
    list.forEach((x, k) => {
      rank[x] = k;
    });
    return rank;
  });
}

export function cloneInstance(inst: Instance): Instance {
  return { left: inst.left.map((l) => [...l]), right: inst.right.map((l) => [...l]) };
}

/** Proposers / receivers for a given proposing side. */
export function orient(inst: Instance, proposing: Side): { P: Prefs; R: Prefs } {
  return proposing === "left"
    ? { P: inst.left, R: inst.right }
    : { P: inst.right, R: inst.left };
}

export function invert(match: Matching, otherSize: number): Matching {
  const inv: Matching = new Array(otherSize).fill(null);
  match.forEach((j, i) => {
    if (j !== null) inv[j] = i;
  });
  return inv;
}

/* ── Seeded PRNG ──────────────────────────────────────────── */

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffled(n: number, rng: () => number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const k = Math.floor(rng() * (i + 1));
    [a[i], a[k]] = [a[k], a[i]];
  }
  return a;
}

export function randomInstance(n: number, seed: number): Instance {
  const rng = mulberry32(seed);
  return {
    left: Array.from({ length: n }, () => shuffled(n, rng)),
    right: Array.from({ length: n }, () => shuffled(n, rng)),
  };
}

/* ── Deferred acceptance with a full trace ────────────────── */

export type ProposalOutcome = "held" | "rejected" | "unacceptable";

export type Proposal = {
  p: number;
  r: number;
  /** Outcome at the end of the step in which the proposal was made. */
  outcome: ProposalOutcome;
};

export type TraceStep = {
  /** Proposals made in this step: one in sequential orders, many per round. */
  proposals: Proposal[];
  /** Proposers who were holding a tentative seat and lost it in this step. */
  displaced: { p: number; r: number }[];
  /** receiver → proposers currently held, best first (by the receiver). */
  held: number[][];
  /** proposer → how many entries of their list have been used. */
  next: number[];
  totalProposals: number;
  /** 1-based round number (round order and Boston) or proposal number. */
  round: number;
};

export type Trace = {
  steps: TraceStep[];
  /** proposer → receiver (null = unmatched). */
  match: Matching;
  totalProposals: number;
};

type RunOptions = {
  order?: Order;
  seed?: number;
  /** Receiver capacities (default 1 each). */
  capacity?: number[];
};

function sortHeld(list: number[], rank: number[]) {
  list.sort((a, b) => rank[a] - rank[b]);
}

function snapshotHeld(held: number[][]): number[][] {
  return held.map((h) => [...h]);
}

function matchFromHeld(held: number[][], nP: number): Matching {
  const match: Matching = new Array(nP).fill(null);
  held.forEach((list, r) => {
    for (const p of list) match[p] = r;
  });
  return match;
}

/**
 * Gale–Shapley deferred acceptance. `order` only changes the order in
 * which proposals are made; the resulting matching (and even the set of
 * proposals made) is the same for every order.
 */
export function deferredAcceptance(P: Prefs, R: Prefs, opts: RunOptions = {}): Trace {
  const order = opts.order ?? "queue";
  const nP = P.length;
  const nR = R.length;
  const capacity = opts.capacity ?? new Array(nR).fill(1);
  const rank = rankTable(R, nP);
  const next = new Array<number>(nP).fill(0);
  const held: number[][] = Array.from({ length: nR }, () => []);
  const holder = new Array<number | null>(nP).fill(null);
  const steps: TraceStep[] = [];
  let total = 0;

  if (order === "round") {
    let round = 0;
    for (;;) {
      const active: number[] = [];
      for (let i = 0; i < nP; i++) {
        if (holder[i] === null && next[i] < P[i].length) active.push(i);
      }
      if (active.length === 0) break;
      round++;
      const proposals: Proposal[] = [];
      const incoming: number[][] = Array.from({ length: nR }, () => []);
      for (const i of active) {
        const r = P[i][next[i]++];
        total++;
        if (rank[r][i] === Infinity) {
          proposals.push({ p: i, r, outcome: "unacceptable" });
        } else {
          proposals.push({ p: i, r, outcome: "held" });
          incoming[r].push(i);
        }
      }
      const displaced: { p: number; r: number }[] = [];
      for (let r = 0; r < nR; r++) {
        if (incoming[r].length === 0) continue;
        const pool = [...held[r], ...incoming[r]];
        sortHeld(pool, rank[r]);
        const keep = pool.slice(0, capacity[r]);
        for (const p of held[r]) {
          if (!keep.includes(p)) {
            displaced.push({ p, r });
            holder[p] = null;
          }
        }
        for (const p of incoming[r]) {
          if (keep.includes(p)) {
            holder[p] = r;
          } else {
            const rec = proposals.find((x) => x.p === p && x.r === r);
            if (rec) rec.outcome = "rejected";
          }
        }
        held[r] = keep;
      }
      steps.push({
        proposals,
        displaced,
        held: snapshotHeld(held),
        next: [...next],
        totalProposals: total,
        round,
      });
    }
    return { steps, match: matchFromHeld(held, nP), totalProposals: total };
  }

  const rng = mulberry32(opts.seed ?? 1);
  // Queue: FIFO. Stack: LIFO, so a rejected proposer proposes again at once
  // (the "chain" formulation of McVitie and Wilson).
  const pool: number[] =
    order === "stack"
      ? Array.from({ length: nP }, (_, i) => nP - 1 - i)
      : Array.from({ length: nP }, (_, i) => i);
  for (;;) {
    let idx = -1;
    if (order === "queue") {
      idx = pool.findIndex((i) => next[i] < P[i].length);
    } else if (order === "stack") {
      for (let k = pool.length - 1; k >= 0; k--) {
        if (next[pool[k]] < P[pool[k]].length) {
          idx = k;
          break;
        }
      }
    } else {
      const candidates = pool
        .map((i, k) => ({ i, k }))
        .filter(({ i }) => next[i] < P[i].length);
      if (candidates.length > 0) {
        idx = candidates[Math.floor(rng() * candidates.length)].k;
      }
    }
    if (idx < 0) break;
    const i = pool.splice(idx, 1)[0];
    const r = P[i][next[i]++];
    total++;
    const displaced: { p: number; r: number }[] = [];
    let outcome: ProposalOutcome;
    if (rank[r][i] === Infinity) {
      outcome = "unacceptable";
      pool.push(i);
    } else if (held[r].length < capacity[r]) {
      held[r].push(i);
      sortHeld(held[r], rank[r]);
      holder[i] = r;
      outcome = "held";
    } else {
      const worst = held[r][held[r].length - 1];
      if (rank[r][i] < rank[r][worst]) {
        held[r].pop();
        held[r].push(i);
        sortHeld(held[r], rank[r]);
        holder[i] = r;
        holder[worst] = null;
        displaced.push({ p: worst, r });
        pool.push(worst);
        outcome = "held";
      } else {
        outcome = "rejected";
        pool.push(i);
      }
    }
    steps.push({
      proposals: [{ p: i, r, outcome }],
      displaced,
      held: snapshotHeld(held),
      next: [...next],
      totalProposals: total,
      round: total,
    });
  }
  return { steps, match: matchFromHeld(held, nP), totalProposals: total };
}

/**
 * Immediate acceptance ("Boston mechanism"): in round k every unassigned
 * proposer applies to the k-th entry of their list, and receivers accept
 * permanently. Nobody can be displaced, so the result need not be stable.
 */
export function immediateAcceptance(P: Prefs, R: Prefs, capacity?: number[]): Trace {
  const nP = P.length;
  const nR = R.length;
  const cap = capacity ?? new Array(nR).fill(1);
  const rank = rankTable(R, nP);
  const next = new Array<number>(nP).fill(0);
  const held: number[][] = Array.from({ length: nR }, () => []);
  const assigned = new Array<boolean>(nP).fill(false);
  const steps: TraceStep[] = [];
  let total = 0;
  for (let k = 0; ; k++) {
    const active: number[] = [];
    for (let i = 0; i < nP; i++) {
      if (!assigned[i] && P[i].length > k) active.push(i);
    }
    if (active.length === 0) break;
    const proposals: Proposal[] = [];
    const incoming: number[][] = Array.from({ length: nR }, () => []);
    for (const i of active) {
      const r = P[i][k];
      next[i] = k + 1;
      total++;
      if (rank[r][i] === Infinity) {
        proposals.push({ p: i, r, outcome: "unacceptable" });
      } else {
        proposals.push({ p: i, r, outcome: "rejected" });
        incoming[r].push(i);
      }
    }
    for (let r = 0; r < nR; r++) {
      const room = cap[r] - held[r].length;
      if (room <= 0 || incoming[r].length === 0) continue;
      const sorted = [...incoming[r]];
      sortHeld(sorted, rank[r]);
      for (const p of sorted.slice(0, room)) {
        held[r].push(p);
        assigned[p] = true;
        const rec = proposals.find((x) => x.p === p && x.r === r);
        if (rec) rec.outcome = "held";
      }
      sortHeld(held[r], rank[r]);
    }
    steps.push({
      proposals,
      displaced: [],
      held: snapshotHeld(held),
      next: [...next],
      totalProposals: total,
      round: k + 1,
    });
  }
  return { steps, match: matchFromHeld(held, nP), totalProposals: total };
}

/** Run DA on an instance and return the result as a left → right matching. */
export function stableMatchingFor(inst: Instance, proposing: Side): Matching {
  const { P, R } = orient(inst, proposing);
  const { match } = deferredAcceptance(P, R);
  return proposing === "left" ? match : invert(match, inst.left.length);
}

/* ── Stability ────────────────────────────────────────────── */

export type Pair = [number, number];

/** All (left, right) pairs that block a one-to-one matching. */
export function blockingPairs(inst: Instance, leftMatch: Matching): Pair[] {
  const nL = inst.left.length;
  const nR = inst.right.length;
  const rL = rankTable(inst.left, nR);
  const rR = rankTable(inst.right, nL);
  const rightMatch = invert(leftMatch, nR);
  const out: Pair[] = [];
  for (let i = 0; i < nL; i++) {
    const mine = leftMatch[i];
    const cur = mine === null ? Infinity : rL[i][mine];
    for (const j of inst.left[i]) {
      if (rL[i][j] >= cur) break;
      if (rR[j][i] === Infinity) continue;
      const theirs = rightMatch[j];
      const curR = theirs === null ? Infinity : rR[j][theirs];
      if (rR[j][i] < curR) out.push([i, j]);
    }
  }
  return out;
}

/** True when every matched pair is mutually acceptable and nothing blocks. */
export function isStable(inst: Instance, leftMatch: Matching): boolean {
  const nR = inst.right.length;
  const rL = rankTable(inst.left, nR);
  const rR = rankTable(inst.right, inst.left.length);
  for (let i = 0; i < leftMatch.length; i++) {
    const j = leftMatch[i];
    if (j !== null && (rL[i][j] === Infinity || rR[j][i] === Infinity)) return false;
  }
  return blockingPairs(inst, leftMatch).length === 0;
}

/**
 * Knuth-style "divorce": the blocking pair (i, j) marry and their abandoned
 * partners marry each other, so a perfect matching stays perfect.
 */
export function resolveBlockingPair(leftMatch: number[], pair: Pair): number[] {
  const [i, j] = pair;
  const next = [...leftMatch];
  const other = leftMatch.indexOf(j);
  const mine = leftMatch[i];
  next[i] = j;
  if (other >= 0) next[other] = mine;
  return next;
}

/* ── Enumerating stable matchings (complete lists, n × n) ─── */

export function permutations(n: number): number[][] {
  const out: number[][] = [];
  const cur: number[] = [];
  const used = new Array<boolean>(n).fill(false);
  const rec = () => {
    if (cur.length === n) {
      out.push([...cur]);
      return;
    }
    for (let k = 0; k < n; k++) {
      if (used[k]) continue;
      used[k] = true;
      cur.push(k);
      rec();
      cur.pop();
      used[k] = false;
    }
  };
  rec();
  return out;
}

export function allStableMatchings(inst: Instance): number[][] {
  return permutations(inst.left.length).filter((m) => blockingPairs(inst, m).length === 0);
}

/** Every partner an agent has in some stable matching, best first (n × n, complete lists). */
export function validPartners(inst: Instance, side: Side, agent: number): number[] {
  const partners = new Set<number>();
  for (const m of allStableMatchings(inst)) {
    partners.add(side === "left" ? m[agent] : m.indexOf(agent));
  }
  const list = side === "left" ? inst.left[agent] : inst.right[agent];
  return [...partners].sort((a, b) => list.indexOf(a) - list.indexOf(b));
}

export type MatchingScore = {
  /** 1-based rank each left agent gives their partner. */
  leftRanks: number[];
  /** 1-based rank each right agent gives their partner. */
  rightRanks: number[];
  leftSum: number;
  rightSum: number;
  /** Worst rank anybody receives. */
  regret: number;
};

export function scoreMatching(inst: Instance, leftMatch: number[]): MatchingScore {
  const n = inst.left.length;
  const rL = rankTable(inst.left, inst.right.length);
  const rR = rankTable(inst.right, n);
  const leftRanks = leftMatch.map((j, i) => rL[i][j] + 1);
  const inv = invert(leftMatch, inst.right.length);
  const rightRanks = inv.map((i, j) => (i === null ? Infinity : rR[j][i] + 1));
  const leftSum = leftRanks.reduce((a, b) => a + b, 0);
  const rightSum = rightRanks.reduce((a, b) => a + b, 0);
  return {
    leftRanks,
    rightRanks,
    leftSum,
    rightSum,
    regret: Math.max(...leftRanks, ...rightRanks),
  };
}

/** M1 is weakly better than M2 for every left agent. */
export function leftDominates(inst: Instance, m1: number[], m2: number[]): boolean {
  const rL = rankTable(inst.left, inst.right.length);
  return m1.every((j, i) => rL[i][j] <= rL[i][m2[i]]);
}

/**
 * Lattice operations: the join gives every left agent the better of its two
 * partners, the meet the worse. For stable inputs both are stable (Conway).
 */
export function joinMeet(
  inst: Instance,
  m1: number[],
  m2: number[],
): { join: number[]; meet: number[] } {
  const rL = rankTable(inst.left, inst.right.length);
  return {
    join: m1.map((j, i) => (rL[i][j] <= rL[i][m2[i]] ? j : m2[i])),
    meet: m1.map((j, i) => (rL[i][j] >= rL[i][m2[i]] ? j : m2[i])),
  };
}

export type Rotation = { left: number; from: number; to: number }[];

export type StableLattice = {
  nodes: { match: number[]; level: number; score: MatchingScore }[];
  /** Covering relations, from the upper (better for left) to the lower node. */
  edges: { from: number; to: number; rotation: Rotation }[];
  top: number;
  bottom: number;
  /** n! — how many perfect matchings were examined. */
  examined: number;
};

/**
 * Brute-force lattice of stable matchings ordered by the left side.
 * Each covering edge removes exactly one rotation: the left agents whose
 * partner changes, each moving to the partner of the next one in the cycle.
 */
export function stableLattice(inst: Instance): StableLattice {
  const n = inst.left.length;
  const stable = allStableMatchings(inst);
  const k = stable.length;
  const above = (a: number, b: number) =>
    a !== b && leftDominates(inst, stable[a], stable[b]);
  const edges: StableLattice["edges"] = [];
  for (let a = 0; a < k; a++) {
    for (let b = 0; b < k; b++) {
      if (!above(a, b)) continue;
      let covered = true;
      for (let c = 0; c < k; c++) {
        if (above(a, c) && above(c, b)) {
          covered = false;
          break;
        }
      }
      if (!covered) continue;
      const rotation: Rotation = [];
      for (let i = 0; i < n; i++) {
        if (stable[a][i] !== stable[b][i]) {
          rotation.push({ left: i, from: stable[a][i], to: stable[b][i] });
        }
      }
      edges.push({ from: a, to: b, rotation });
    }
  }
  const top = stable.findIndex((_, a) => stable.every((__, b) => a === b || above(a, b)));
  const bottom = stable.findIndex((_, b) => stable.every((__, a) => a === b || above(a, b)));
  const level = new Array<number>(k).fill(-1);
  level[top] = 0;
  const queue = [top];
  while (queue.length > 0) {
    const u = queue.shift()!;
    for (const e of edges) {
      if (e.from === u && level[e.to] < 0) {
        level[e.to] = level[u] + 1;
        queue.push(e.to);
      }
    }
  }
  return {
    nodes: stable.map((match, i) => ({
      match,
      level: level[i],
      score: scoreMatching(inst, match),
    })),
    edges,
    top,
    bottom,
    examined: permutations(n).length,
  };
}

/* ── Strategic misreporting ───────────────────────────────── */

/** All ordered selections of `items` of every length 0..items.length. */
export function allReports(items: number[]): number[][] {
  const out: number[][] = [[]];
  const cur: number[] = [];
  const used = new Array<boolean>(items.length).fill(false);
  const rec = () => {
    for (let k = 0; k < items.length; k++) {
      if (used[k]) continue;
      used[k] = true;
      cur.push(items[k]);
      out.push([...cur]);
      rec();
      cur.pop();
      used[k] = false;
    }
  };
  rec();
  return out;
}

export type ManipulationOutcome = {
  /** Partner obtained (null = unmatched). */
  partner: number | null;
  /** 1-based rank of that partner in the agent's TRUE list; Infinity if unmatched. */
  trueRank: number;
  reports: number;
  example: number[];
};

export type ManipulationResult = {
  truthful: { partner: number | null; trueRank: number };
  outcomes: ManipulationOutcome[];
  best: ManipulationOutcome;
  /** Number of reports examined. */
  examined: number;
};

export type Mechanism = "da" | "boston";

/** Outcome of a mechanism as a left → right matching. */
export function matchingFor(inst: Instance, proposing: Side, mechanism: Mechanism = "da"): Matching {
  if (mechanism === "da") return stableMatchingFor(inst, proposing);
  const { P, R } = orient(inst, proposing);
  const { match } = immediateAcceptance(P, R);
  return proposing === "left" ? match : invert(match, inst.left.length);
}

function partnerOf(
  inst: Instance,
  proposing: Side,
  side: Side,
  agent: number,
  mechanism: Mechanism,
): number | null {
  const m = matchingFor(inst, proposing, mechanism);
  if (side === "left") return m[agent];
  const i = m.indexOf(agent);
  return i < 0 ? null : i;
}

/**
 * Try every possible reported list (any order, any truncation) for one agent
 * while everyone else reports truthfully, and score each result with the
 * agent's true preferences.
 */
export function searchManipulations(
  inst: Instance,
  proposing: Side,
  side: Side,
  agent: number,
  mechanism: Mechanism = "da",
): ManipulationResult {
  const truthList = side === "left" ? inst.left[agent] : inst.right[agent];
  const otherSize = side === "left" ? inst.right.length : inst.left.length;
  const trueRank = (partner: number | null) => {
    if (partner === null) return Infinity;
    const k = truthList.indexOf(partner);
    return k < 0 ? Infinity : k + 1;
  };
  const truthfulPartner = partnerOf(inst, proposing, side, agent, mechanism);
  const byPartner = new Map<string, ManipulationOutcome>();
  const reports = allReports(Array.from({ length: otherSize }, (_, k) => k));
  for (const report of reports) {
    const lied = cloneInstance(inst);
    if (side === "left") lied.left[agent] = report;
    else lied.right[agent] = report;
    const partner = partnerOf(lied, proposing, side, agent, mechanism);
    const key = String(partner);
    const prev = byPartner.get(key);
    if (prev) prev.reports++;
    else {
      byPartner.set(key, {
        partner,
        trueRank: trueRank(partner),
        reports: 1,
        example: report,
      });
    }
  }
  const outcomes = [...byPartner.values()].sort((a, b) => a.trueRank - b.trueRank);
  return {
    truthful: { partner: truthfulPartner, trueRank: trueRank(truthfulPartner) },
    outcomes,
    best: outcomes[0],
    examined: reports.length,
  };
}

/* ── Random markets ───────────────────────────────────────── */

export type MarketSample = {
  nLeft: number;
  nRight: number;
  trials: number;
  /** Average 1-based rank of partners, over matched agents. */
  leftRankWhenLeftProposes: number;
  rightRankWhenLeftProposes: number;
  leftRankWhenRightProposes: number;
  rightRankWhenRightProposes: number;
  /** Average number of proposals made by the left side when it proposes. */
  proposalsWhenLeftProposes: number;
  /** Share of left agents whose partner differs between the two extremes. */
  leftAgentsWithDifferentPartners: number;
};

function fastDA(
  nP: number,
  nR: number,
  prefP: Int32Array,
  rankR: Int32Array,
): { matchP: Int32Array; proposals: number } {
  const next = new Int32Array(nP);
  const heldBy = new Int32Array(nR).fill(-1);
  const matchP = new Int32Array(nP).fill(-1);
  const stack: number[] = [];
  for (let i = nP - 1; i >= 0; i--) stack.push(i);
  let proposals = 0;
  while (stack.length > 0) {
    const i = stack.pop()!;
    if (next[i] >= nR) continue;
    const r = prefP[i * nR + next[i]];
    next[i]++;
    proposals++;
    const cur = heldBy[r];
    if (cur < 0) {
      heldBy[r] = i;
      matchP[i] = r;
    } else if (rankR[r * nP + i] < rankR[r * nP + cur]) {
      heldBy[r] = i;
      matchP[i] = r;
      matchP[cur] = -1;
      stack.push(cur);
    } else {
      stack.push(i);
    }
  }
  return { matchP, proposals };
}

/** Monte Carlo over uniformly random complete preference lists. */
export function sampleRandomMarket(
  nLeft: number,
  nRight: number,
  trials: number,
  seed: number,
): MarketSample {
  const rng = mulberry32(seed);
  const acc = {
    lL: 0,
    rL: 0,
    lR: 0,
    rR: 0,
    props: 0,
    diff: 0,
  };
  const prefL = new Int32Array(nLeft * nRight);
  const rankL = new Int32Array(nLeft * nRight);
  const prefR = new Int32Array(nRight * nLeft);
  const rankR = new Int32Array(nRight * nLeft);
  for (let t = 0; t < trials; t++) {
    for (let i = 0; i < nLeft; i++) {
      const perm = shuffled(nRight, rng);
      for (let k = 0; k < nRight; k++) {
        prefL[i * nRight + k] = perm[k];
        rankL[i * nRight + perm[k]] = k;
      }
    }
    for (let j = 0; j < nRight; j++) {
      const perm = shuffled(nLeft, rng);
      for (let k = 0; k < nLeft; k++) {
        prefR[j * nLeft + k] = perm[k];
        rankR[j * nLeft + perm[k]] = k;
      }
    }
    const a = fastDA(nLeft, nRight, prefL, rankR);
    const b = fastDA(nRight, nLeft, prefR, rankL);
    acc.props += a.proposals;
    let sL = 0;
    let cL = 0;
    let sR = 0;
    let cR = 0;
    for (let i = 0; i < nLeft; i++) {
      const j = a.matchP[i];
      if (j < 0) continue;
      sL += rankL[i * nRight + j] + 1;
      cL++;
      sR += rankR[j * nLeft + i] + 1;
      cR++;
    }
    acc.lL += sL / cL;
    acc.rL += sR / cR;
    let sL2 = 0;
    let sR2 = 0;
    let c2 = 0;
    const leftUnderB = new Int32Array(nLeft).fill(-1);
    for (let j = 0; j < nRight; j++) {
      const i = b.matchP[j];
      if (i < 0) continue;
      leftUnderB[i] = j;
      sR2 += rankR[j * nLeft + i] + 1;
      sL2 += rankL[i * nRight + j] + 1;
      c2++;
    }
    acc.rR += sR2 / c2;
    acc.lR += sL2 / c2;
    let diff = 0;
    for (let i = 0; i < nLeft; i++) {
      if (a.matchP[i] !== leftUnderB[i]) diff++;
    }
    acc.diff += diff / nLeft;
  }
  return {
    nLeft,
    nRight,
    trials,
    leftRankWhenLeftProposes: acc.lL / trials,
    rightRankWhenLeftProposes: acc.rL / trials,
    leftRankWhenRightProposes: acc.lR / trials,
    rightRankWhenRightProposes: acc.rR / trials,
    proposalsWhenLeftProposes: acc.props / trials,
    leftAgentsWithDifferentPartners: acc.diff / trials,
  };
}

/* ── Many-to-one: residents and hospitals ─────────────────── */

export type CollegeInstance = {
  /** Applicants' lists of hospitals (may be incomplete). */
  applicants: Prefs;
  /** Hospitals' lists of applicants (may be incomplete). */
  hospitals: Prefs;
  capacity: number[];
};

/** Applicant-proposing DA, one round per step (the 1962 formulation). */
export function applicantProposing(inst: CollegeInstance): Trace {
  return deferredAcceptance(inst.applicants, inst.hospitals, {
    order: "round",
    capacity: inst.capacity,
  });
}

/**
 * Hospital-proposing DA via the standard reduction: hospital h becomes
 * capacity[h] single-seat copies, which applicants rank h#1 > h#2 > ….
 */
export function hospitalProposing(inst: CollegeInstance): Matching {
  const seats: { h: number; k: number }[] = [];
  inst.capacity.forEach((q, h) => {
    for (let k = 0; k < q; k++) seats.push({ h, k });
  });
  const seatPrefs = seats.map(({ h }) => [...inst.hospitals[h]]);
  const applicantPrefs = inst.applicants.map((list) =>
    list.flatMap((h) =>
      seats.map((s, idx) => ({ s, idx })).filter(({ s }) => s.h === h).map(({ idx }) => idx),
    ),
  );
  const { match } = deferredAcceptance(seatPrefs, applicantPrefs, { order: "queue" });
  const result: Matching = new Array(inst.applicants.length).fill(null);
  match.forEach((a, seat) => {
    if (a !== null) result[a] = seats[seat].h;
  });
  return result;
}

/**
 * Cutoff of each hospital: its lowest-ranked admitted applicant when it is
 * full, or null when a seat is still free.
 */
export function collegeCutoffs(inst: CollegeInstance, assign: Matching): (number | null)[] {
  const rH = rankTable(inst.hospitals, inst.applicants.length);
  return inst.capacity.map((q, h) => {
    const members = assign.flatMap((x, a) => (x === h ? [a] : []));
    if (members.length < q) return null;
    return members.reduce((worst, a) => (rH[h][a] > rH[h][worst] ? a : worst));
  });
}

/**
 * The hospital an applicant would get by "demanding" the best hospital that
 * would take them given the cutoffs: acceptable to it, and either a free
 * seat or ranked at least as high as the cutoff.
 */
export function bestUnderCutoffs(
  inst: CollegeInstance,
  cutoffs: (number | null)[],
  applicant: number,
): number | null {
  const rH = rankTable(inst.hospitals, inst.applicants.length);
  for (const h of inst.applicants[applicant]) {
    if (rH[h][applicant] === Infinity) continue;
    const c = cutoffs[h];
    if (c === null || rH[h][applicant] <= rH[h][c]) return h;
  }
  return null;
}

/** Blocking pairs for a many-to-one matching with responsive preferences. */
export function collegeBlockingPairs(inst: CollegeInstance, assign: Matching): Pair[] {
  const nA = inst.applicants.length;
  const nH = inst.hospitals.length;
  const rA = rankTable(inst.applicants, nH);
  const rH = rankTable(inst.hospitals, nA);
  const out: Pair[] = [];
  for (let a = 0; a < nA; a++) {
    const mine = assign[a];
    const cur = mine === null ? Infinity : rA[a][mine];
    for (const h of inst.applicants[a]) {
      if (rA[a][h] >= cur) break;
      if (rH[h][a] === Infinity) continue;
      const members = assign
        .map((x, b) => (x === h ? b : -1))
        .filter((b) => b >= 0);
      if (members.length < inst.capacity[h] || members.some((b) => rH[h][a] < rH[h][b])) {
        out.push([a, h]);
      }
    }
  }
  return out;
}

/* ── Top trading cycles (school choice) ───────────────────── */

export type TTCRound = {
  /** student → school she points to (−1 if inactive). */
  pointS: number[];
  /** school → student it points to (−1 if it has no seat or no student). */
  pointH: number[];
  /** Students whose cycles trade in this round. */
  traded: number[];
};

/**
 * Top trading cycles: every remaining student points to her favourite school
 * with a free seat, every such school points to its highest-priority
 * remaining student, and each cycle trades. Pareto-efficient and
 * strategy-proof for students, but not stable.
 */
export function topTradingCyclesTrace(inst: CollegeInstance): {
  rounds: TTCRound[];
  match: Matching;
} {
  const nA = inst.applicants.length;
  const nH = inst.hospitals.length;
  const seats = [...inst.capacity];
  const assigned: Matching = new Array(nA).fill(null);
  const done = new Array<boolean>(nA).fill(false);
  const rankA = rankTable(inst.applicants, nH);
  const rankH = rankTable(inst.hospitals, nA);
  const rounds: TTCRound[] = [];
  for (;;) {
    const pointS = new Array<number>(nA).fill(-1);
    for (let a = 0; a < nA; a++) {
      if (done[a]) continue;
      const h = inst.applicants[a].find(
        (x) => seats[x] > 0 && rankA[a][x] < Infinity && rankH[x][a] < Infinity,
      );
      if (h === undefined) done[a] = true;
      else pointS[a] = h;
    }
    const pointH = new Array<number>(nH).fill(-1);
    for (let h = 0; h < nH; h++) {
      if (seats[h] <= 0) continue;
      const a = inst.hospitals[h].find((x) => !done[x]);
      if (a !== undefined) pointH[h] = a;
    }
    if (pointS.every((h) => h < 0)) break;
    // Walk the student → school → student graph to find cycles.
    const inCycle = new Array<boolean>(nA).fill(false);
    for (let start = 0; start < nA; start++) {
      if (pointS[start] < 0) continue;
      const seen = new Set<number>();
      let a = start;
      while (a >= 0 && pointS[a] >= 0 && !seen.has(a)) {
        seen.add(a);
        a = pointH[pointS[a]];
      }
      if (a >= 0 && seen.has(a)) {
        let b = a;
        do {
          inCycle[b] = true;
          b = pointH[pointS[b]];
        } while (b !== a);
      }
    }
    const traded: number[] = [];
    for (let a = 0; a < nA; a++) {
      if (!inCycle[a]) continue;
      assigned[a] = pointS[a];
      seats[pointS[a]]--;
      done[a] = true;
      traded.push(a);
    }
    rounds.push({ pointS, pointH, traded });
    if (traded.length === 0) break;
  }
  return { rounds, match: assigned };
}

export function topTradingCycles(inst: CollegeInstance): Matching {
  return topTradingCyclesTrace(inst).match;
}

/**
 * A feasible assignment that every applicant weakly prefers and someone
 * strictly prefers (brute force; small instances only). null if none.
 */
export function paretoImprovement(inst: CollegeInstance, assign: Matching): Matching | null {
  const nA = inst.applicants.length;
  const rankA = rankTable(inst.applicants, inst.hospitals.length);
  const rankH = rankTable(inst.hospitals, nA);
  const r = (a: number, h: number | null) => (h === null ? Infinity : rankA[a][h]);
  const cur: Matching = new Array(nA).fill(null);
  const load = new Array<number>(inst.hospitals.length).fill(0);
  let found: Matching | null = null;
  const rec = (a: number, strictly: boolean) => {
    if (found) return;
    if (a === nA) {
      if (strictly) found = [...cur];
      return;
    }
    const options: (number | null)[] = [...inst.applicants[a], null];
    for (const h of options) {
      if (r(a, h) > r(a, assign[a])) continue;
      if (h !== null && (load[h] >= inst.capacity[h] || rankH[h][a] === Infinity)) continue;
      cur[a] = h;
      if (h !== null) load[h]++;
      rec(a + 1, strictly || r(a, h) < r(a, assign[a]));
      if (h !== null) load[h]--;
      cur[a] = null;
    }
  };
  rec(0, false);
  return found;
}

/**
 * School choice example where stability costs efficiency: students 1–3 are
 * A–C, schools a–c are X–Z (one seat each).
 *   priorities  X(a): A > C > B   Y(b): B > A > C   Z(c): A > B > C
 *   preferences A: Y > X > Z      B: X > Y > Z      C: X > Z > Y
 */
export const EFFICIENCY_EXAMPLE: CollegeInstance = {
  applicants: [
    [1, 0, 2],
    [0, 1, 2],
    [0, 2, 1],
  ],
  hospitals: [
    [0, 2, 1],
    [1, 0, 2],
    [0, 1, 2],
  ],
  capacity: [1, 1, 1],
};

/* ── Presets used by the article ──────────────────────────── */

/**
 * Running example (n = 4). Left A–D, right W–Z.
 *   A: W > X > Z > Y    W: C > B > D > A
 *   B: Z > W > Y > X    X: D > B > A > C
 *   C: Z > Y > W > X    Y: B > C > D > A
 *   D: Z > X > Y > W    Z: A > D > C > B
 * Four stable matchings forming a diamond; immediate acceptance is unstable.
 */
export const RUNNING_EXAMPLE: Instance = {
  left: [
    [0, 1, 3, 2],
    [3, 0, 2, 1],
    [3, 2, 0, 1],
    [3, 1, 2, 0],
  ],
  right: [
    [2, 1, 3, 0],
    [3, 1, 0, 2],
    [1, 2, 3, 0],
    [0, 3, 2, 1],
  ],
};

/**
 * Worst case for n = 4: 13 = n² − n + 1 proposals.
 *   A: W > X > Y > Z    W: B > A > C > D
 *   B: X > Y > W > Z    X: C > B > A > D
 *   C: Y > W > X > Z    Y: A > D > C > B
 *   D: W > X > Y > Z    Z: A > B > C > D
 */
export const WORST_CASE: Instance = {
  left: [
    [0, 1, 2, 3],
    [1, 2, 0, 3],
    [2, 0, 1, 3],
    [0, 1, 2, 3],
  ],
  right: [
    [1, 0, 2, 3],
    [2, 1, 0, 3],
    [0, 3, 2, 1],
    [0, 1, 2, 3],
  ],
};

/** Everybody on the left agrees: W > X > Y > Z. Proposals = 1 + 2 + 3 + 4. */
export const IDENTICAL_LISTS: Instance = {
  left: [
    [0, 1, 2, 3],
    [0, 1, 2, 3],
    [0, 1, 2, 3],
    [0, 1, 2, 3],
  ],
  right: [
    [2, 0, 3, 1],
    [1, 3, 0, 2],
    [3, 2, 1, 0],
    [0, 1, 2, 3],
  ],
};

/**
 * n = 3 instance where resolving blocking pairs one at a time can cycle:
 *   A: X > Y > Z    X: C > A > B
 *   B: X > Y > Z    Y: A > C > B
 *   C: Y > X > Z    Z: A > B > C
 * From AX BY CZ, resolving (C,X), (C,Y), (A,Y), (A,X) returns to the start.
 */
export const CYCLE_EXAMPLE: Instance = {
  left: [
    [0, 1, 2],
    [0, 1, 2],
    [1, 0, 2],
  ],
  right: [
    [2, 0, 1],
    [0, 2, 1],
    [0, 1, 2],
  ],
};
export const CYCLE_START: number[] = [0, 1, 2];
export const CYCLE_SEQUENCE: Pair[] = [
  [2, 0],
  [2, 1],
  [0, 1],
  [0, 0],
];

/**
 * Classic truncation example (n = 3):
 *   A: X > Y > Z    X: B > A > C
 *   B: Y > X > Z    Y: A > B > C
 *   C: X > Y > Z    Z: A > B > C
 * With A–C proposing, X gets A (her #2). Reporting just "B" gets her B (#1).
 */
export const TRUNCATION_EXAMPLE: Instance = {
  left: [
    [0, 1, 2],
    [1, 0, 2],
    [0, 1, 2],
  ],
  right: [
    [1, 0, 2],
    [0, 1, 2],
    [0, 1, 2],
  ],
};

/**
 * Same as TRUNCATION_EXAMPLE except Y ranks B > A > C. Now the stable
 * matching is unique, and X's truncation to "B only" leaves X unmatched.
 */
export const TRUNCATION_RISK_EXAMPLE: Instance = {
  left: [
    [0, 1, 2],
    [1, 0, 2],
    [0, 1, 2],
  ],
  right: [
    [1, 0, 2],
    [1, 0, 2],
    [0, 1, 2],
  ],
};

/**
 * Roth's (1982) impossibility in its smallest form (n = 2):
 *   A: Y > Z    Y: B > A
 *   B: Z > Y    Z: A > B
 * Stable matchings: AY BZ and AZ BY. Whichever one a stable mechanism picks,
 * someone gains by truncating their list to their first choice.
 */
export const IMPOSSIBILITY_EXAMPLE: Instance = {
  left: [
    [0, 1],
    [1, 0],
  ],
  right: [
    [1, 0],
    [0, 1],
  ],
};

/** n = 4 instance with 10 stable matchings, the maximum for n = 4. */
export const MAX_LATTICE: Instance = {
  left: [
    [2, 0, 3, 1],
    [1, 3, 0, 2],
    [0, 2, 1, 3],
    [3, 1, 2, 0],
  ],
  right: [
    [3, 1, 0, 2],
    [0, 2, 3, 1],
    [1, 3, 2, 0],
    [2, 0, 1, 3],
  ],
};

/**
 * Residents A–F and hospitals X, Y, Z (capacity 2 each). Z plays the "rural"
 * hospital: of the residents who list it (A, C, E), only C is on Z's own
 * rank list. Incomplete lists on both sides.
 *   A: Z > Y > X     X(2): C > F > A > E > B > D
 *   B: X > Y         Y(2): B > A > C > F > E
 *   C: Z > Y         Z(2): F > D > C > B
 *   D: Y > X
 *   E: Y > Z > X
 *   F: Y > X
 */
export const RESIDENCY_EXAMPLE: CollegeInstance = {
  applicants: [[2, 1, 0], [0, 1], [2, 1], [1, 0], [1, 2, 0], [1, 0]],
  hospitals: [
    [2, 5, 0, 4, 1, 3],
    [1, 0, 2, 5, 4],
    [5, 3, 2, 1],
  ],
  capacity: [2, 2, 2],
};
