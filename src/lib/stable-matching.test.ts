import { describe, expect, it } from "vitest";
import {
  CYCLE_EXAMPLE,
  CYCLE_SEQUENCE,
  CYCLE_START,
  EFFICIENCY_EXAMPLE,
  IDENTICAL_LISTS,
  IMPOSSIBILITY_EXAMPLE,
  MAX_LATTICE,
  RESIDENCY_EXAMPLE,
  RUNNING_EXAMPLE,
  TRUNCATION_RISK_EXAMPLE,
  WORST_CASE,
  allReports,
  allStableMatchings,
  applicantProposing,
  bestUnderCutoffs,
  blockingPairs,
  cloneInstance,
  collegeBlockingPairs,
  collegeCutoffs,
  deferredAcceptance,
  hospitalProposing,
  immediateAcceptance,
  isStable,
  joinMeet,
  mulberry32,
  orient,
  permutations,
  randomInstance,
  rankTable,
  resolveBlockingPair,
  sampleRandomMarket,
  scoreMatching,
  searchManipulations,
  stableLattice,
  stableMatchingFor,
  topTradingCycles,
  topTradingCyclesTrace,
  paretoImprovement,
  validPartners,
  type CollegeInstance,
  type Instance,
  type Order,
} from "./stable-matching";

const ORDERS: Order[] = ["round", "queue", "stack", "random"];

function proposalSet(inst: Instance, order: Order, seed = 1): string[] {
  const { P, R } = orient(inst, "left");
  return deferredAcceptance(P, R, { order, seed })
    .steps.flatMap((s) => s.proposals.map((p) => `${p.p}-${p.r}`))
    .sort();
}

function randomIncomplete(n: number, m: number, seed: number): Instance {
  const rng = mulberry32(seed);
  const pick = (size: number) => {
    const all = Array.from({ length: size }, (_, k) => k);
    for (let i = size - 1; i > 0; i--) {
      const k = Math.floor(rng() * (i + 1));
      [all[i], all[k]] = [all[k], all[i]];
    }
    return all.slice(0, Math.floor(rng() * (size + 1)));
  };
  return {
    left: Array.from({ length: n }, () => pick(m)),
    right: Array.from({ length: m }, () => pick(n)),
  };
}

describe("deferred acceptance", () => {
  it("returns a stable matching for every order, with complete lists", () => {
    for (let n = 1; n <= 6; n++) {
      for (let seed = 1; seed <= 40; seed++) {
        const inst = randomInstance(n, seed * 31 + n);
        const results = ORDERS.map((order) => {
          const { P, R } = orient(inst, "left");
          return deferredAcceptance(P, R, { order, seed });
        });
        for (const r of results) {
          expect(r.match.every((j) => j !== null)).toBe(true);
          expect(isStable(inst, r.match)).toBe(true);
          expect(r.match).toEqual(results[0].match);
          expect(r.totalProposals).toBe(results[0].totalProposals);
        }
      }
    }
  });

  it("makes exactly the same set of proposals in every order", () => {
    for (let seed = 1; seed <= 60; seed++) {
      const inst = randomInstance(5, seed);
      const base = proposalSet(inst, "queue");
      for (const order of ORDERS) {
        expect(proposalSet(inst, order, seed)).toEqual(base);
      }
    }
  });

  it("is stable and order-independent with incomplete lists and unequal sides", () => {
    for (let seed = 1; seed <= 200; seed++) {
      const inst = randomIncomplete(4, 5, seed);
      const { P, R } = orient(inst, "left");
      const base = deferredAcceptance(P, R, { order: "queue" });
      expect(isStable(inst, base.match)).toBe(true);
      for (const order of ORDERS) {
        expect(deferredAcceptance(P, R, { order, seed }).match).toEqual(base.match);
      }
    }
  });

  it("is proposer-optimal and receiver-pessimal among all stable matchings", () => {
    for (let n = 2; n <= 5; n++) {
      for (let seed = 1; seed <= 40; seed++) {
        const inst = randomInstance(n, 1000 + seed * 7 + n);
        const stable = allStableMatchings(inst);
        const top = stableMatchingFor(inst, "left");
        const bottom = stableMatchingFor(inst, "right");
        const rL = rankTable(inst.left, n);
        const rR = rankTable(inst.right, n);
        for (const m of stable) {
          for (let i = 0; i < n; i++) {
            expect(rL[i][top[i]!]).toBeLessThanOrEqual(rL[i][m[i]]);
            expect(rL[i][bottom[i]!]).toBeGreaterThanOrEqual(rL[i][m[i]]);
            // the right partner of top[i] is i; it is that receiver's worst stable partner
            expect(rR[top[i]!][i]).toBeGreaterThanOrEqual(rR[top[i]!][m.indexOf(top[i]!)]);
          }
        }
      }
    }
  });

  it("never needs more than n² − n + 1 proposals, and the bound is tight", () => {
    for (let n = 1; n <= 6; n++) {
      for (let seed = 1; seed <= 50; seed++) {
        const inst = randomInstance(n, seed * 13 + n);
        const { P, R } = orient(inst, "left");
        expect(deferredAcceptance(P, R).totalProposals).toBeLessThanOrEqual(n * n - n + 1);
      }
    }
    const { P, R } = orient(WORST_CASE, "left");
    const worst = deferredAcceptance(P, R);
    expect(worst.totalProposals).toBe(13);
    expect(worst.match).toEqual([2, 0, 1, 3]); // AY BW CX DZ
  });

  it("counts proposals as the sum of the proposers' final ranks", () => {
    for (let seed = 1; seed <= 60; seed++) {
      const inst = randomInstance(5, seed);
      const { P, R } = orient(inst, "left");
      const r = deferredAcceptance(P, R);
      const sum = scoreMatching(inst, r.match as number[]).leftSum;
      expect(r.totalProposals).toBe(sum);
    }
    const { P, R } = orient(IDENTICAL_LISTS, "left");
    expect(deferredAcceptance(P, R).totalProposals).toBe(10);
  });
});

describe("running example", () => {
  it("has the outcome described in the article", () => {
    const { P, R } = orient(RUNNING_EXAMPLE, "left");
    const seq = deferredAcceptance(P, R, { order: "queue" });
    expect(seq.match).toEqual([1, 0, 2, 3]); // AX BW CY DZ
    expect(seq.totalProposals).toBe(7);
    expect(seq.steps.flatMap((s) => s.displaced).length).toBe(3);
    const rounds = deferredAcceptance(P, R, { order: "round" });
    expect(rounds.steps.length).toBe(3);
    expect(stableMatchingFor(RUNNING_EXAMPLE, "right")).toEqual([3, 2, 0, 1]); // AZ BY CW DX
    const right = orient(RUNNING_EXAMPLE, "right");
    expect(deferredAcceptance(right.P, right.R).totalProposals).toBe(4);
  });

  it("lets immediate acceptance produce an unstable matching", () => {
    const { P, R } = orient(RUNNING_EXAMPLE, "left");
    const boston = immediateAcceptance(P, R);
    expect(boston.match).toEqual([0, 1, 2, 3]); // AW BX CY DZ
    expect(blockingPairs(RUNNING_EXAMPLE, boston.match)).toEqual([
      [1, 0],
      [1, 2],
    ]);
  });

  it("has a diamond-shaped lattice of four stable matchings", () => {
    const lattice = stableLattice(RUNNING_EXAMPLE);
    expect(lattice.nodes.length).toBe(4);
    expect(lattice.edges.length).toBe(4);
    expect(lattice.nodes[lattice.top].match).toEqual([1, 0, 2, 3]);
    expect(lattice.nodes[lattice.bottom].match).toEqual([3, 2, 0, 1]);
    expect(lattice.nodes.map((n) => n.level).sort()).toEqual([0, 1, 1, 2]);
    const rotations = new Set(
      lattice.edges.map((e) => e.rotation.map((m) => m.left).sort().join("")),
    );
    expect(rotations).toEqual(new Set(["12", "03"]));
  });

  it("lets a receiver gain by misreporting but never a proposer", () => {
    const w = searchManipulations(RUNNING_EXAMPLE, "left", "right", 0);
    expect(w.truthful.trueRank).toBe(2);
    expect(w.best.trueRank).toBe(1);
    expect(w.examined).toBe(65);
    for (let i = 0; i < 4; i++) {
      const r = searchManipulations(RUNNING_EXAMPLE, "left", "left", i);
      expect(r.best.trueRank).toBe(r.truthful.trueRank);
    }
  });
});

describe("lattice of stable matchings", () => {
  it("puts the two DA outcomes at the top and the bottom, joined by rotations", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const inst = randomInstance(5, 500 + seed);
      const lattice = stableLattice(inst);
      expect(lattice.nodes[lattice.top].match).toEqual(stableMatchingFor(inst, "left"));
      expect(lattice.nodes[lattice.bottom].match).toEqual(stableMatchingFor(inst, "right"));
      for (const e of lattice.edges) {
        const from = e.rotation.map((m) => m.from).sort();
        const to = e.rotation.map((m) => m.to).sort();
        expect(from).toEqual(to);
        expect(e.rotation.length).toBeGreaterThanOrEqual(2);
        expect(lattice.nodes[e.to].level).toBe(lattice.nodes[e.from].level + 1);
      }
    }
  });

  it("finds ten stable matchings in the n = 4 maximum example", () => {
    expect(allStableMatchings(MAX_LATTICE).length).toBe(10);
    const lattice = stableLattice(MAX_LATTICE);
    const perLevel = new Map<number, number>();
    for (const node of lattice.nodes) {
      perLevel.set(node.level, (perLevel.get(node.level) ?? 0) + 1);
    }
    // three diamonds stacked on top of each other: 1,2,1,2,1,2,1
    expect([...perLevel.entries()].sort((a, b) => a[0] - b[0]).map((e) => e[1])).toEqual([
      1, 2, 1, 2, 1, 2, 1,
    ]);
  });

  it("closes the stable matchings under join and meet", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const inst = randomInstance(5, 7000 + seed);
      const stable = allStableMatchings(inst);
      const keys = new Set(stable.map((m) => m.join()));
      for (const a of stable) {
        for (const b of stable) {
          const { join, meet } = joinMeet(inst, a, b);
          expect(keys.has(join.join())).toBe(true);
          expect(keys.has(meet.join())).toBe(true);
        }
      }
    }
  });

  it("can make every minimum-total-rank matching unstable", () => {
    let unstable = 0;
    const trials = 400;
    for (let seed = 1; seed <= trials; seed++) {
      const inst = randomInstance(4, 9000 + seed);
      const all = permutations(4).map((m) => ({ m, s: scoreMatching(inst, m) }));
      const best = Math.min(...all.map((x) => x.s.leftSum + x.s.rightSum));
      const argmin = all.filter((x) => x.s.leftSum + x.s.rightSum === best);
      if (argmin.every((x) => !isStable(inst, x.m))) unstable++;
    }
    expect(unstable / trials).toBeGreaterThan(0.15);
    expect(unstable / trials).toBeLessThan(0.35);
  });
});

describe("resolving blocking pairs one by one", () => {
  it("can cycle forever", () => {
    let m = [...CYCLE_START];
    const seen: string[] = [m.join()];
    for (const pair of CYCLE_SEQUENCE) {
      expect(blockingPairs(CYCLE_EXAMPLE, m)).toContainEqual(pair);
      m = resolveBlockingPair(m, pair);
      seen.push(m.join());
    }
    expect(m).toEqual(CYCLE_START);
    expect(new Set(seen.slice(0, -1)).size).toBe(4);
    for (const s of seen) {
      expect(isStable(CYCLE_EXAMPLE, s.split(",").map(Number))).toBe(false);
    }
  });

  it("can also reach stability when a different pair is chosen", () => {
    const m = resolveBlockingPair(CYCLE_START, [2, 1]);
    expect(m).toEqual([0, 2, 1]); // AX BZ CY
    expect(isStable(CYCLE_EXAMPLE, m)).toBe(true);
    expect(allStableMatchings(CYCLE_EXAMPLE)).toEqual([
      [0, 2, 1],
      [1, 2, 0],
    ]);
  });
});

describe("strategic behaviour", () => {
  it("lets a proposer gain under immediate acceptance (Boston) but not under DA", () => {
    const boston = searchManipulations(RUNNING_EXAMPLE, "left", "left", 1, "boston");
    expect(boston.truthful.trueRank).toBe(4); // B ends at X
    expect(boston.best.trueRank).toBe(2); // listing W first gets W
    expect(boston.best.example[0]).toBe(0);
    const da = searchManipulations(RUNNING_EXAMPLE, "left", "left", 1, "da");
    expect(da.best.trueRank).toBe(da.truthful.trueRank);
  });

  it("shows that truncation can backfire when the stable matching is unique", () => {
    expect(allStableMatchings(TRUNCATION_RISK_EXAMPLE)).toEqual([[0, 1, 2]]);
    const lied = cloneInstance(TRUNCATION_RISK_EXAMPLE);
    lied.right[0] = [1]; // X reports "B only"
    expect(stableMatchingFor(lied, "left")).toEqual([2, 1, null]); // AZ BY, C unmatched
    const r = searchManipulations(TRUNCATION_RISK_EXAMPLE, "left", "right", 0);
    expect(r.best.trueRank).toBe(r.truthful.trueRank);
  });

  it("reproduces Roth's 2x2 impossibility argument", () => {
    expect(allStableMatchings(IMPOSSIBILITY_EXAMPLE)).toEqual([
      [0, 1],
      [1, 0],
    ]);
    // left proposing picks AY BZ; Y gains by reporting "B only"
    const y = searchManipulations(IMPOSSIBILITY_EXAMPLE, "left", "right", 0);
    expect(y.truthful.trueRank).toBe(2);
    expect(y.best.trueRank).toBe(1);
    // right proposing picks AZ BY; A gains by reporting "Y only"
    const a = searchManipulations(IMPOSSIBILITY_EXAMPLE, "right", "left", 0);
    expect(a.truthful.trueRank).toBe(2);
    expect(a.best.trueRank).toBe(1);
  });

  it("enumerates every ordered truncation", () => {
    expect(allReports([0, 1, 2]).length).toBe(16);
    expect(allReports([0, 1, 2, 3]).length).toBe(65);
  });

  it("is strategy-proof for proposers on random instances", () => {
    for (let seed = 1; seed <= 25; seed++) {
      const inst = randomInstance(4, 2000 + seed);
      for (let i = 0; i < 4; i++) {
        const r = searchManipulations(inst, "left", "left", i);
        expect(r.best.trueRank).toBe(r.truthful.trueRank);
      }
    }
  });

  it("is manipulable by a receiver whenever her stable partners differ", () => {
    expect(validPartners(RUNNING_EXAMPLE, "left", 0)).toEqual([1, 3]); // A: X, Z
    expect(validPartners(RUNNING_EXAMPLE, "right", 0)).toEqual([2, 1]); // W: C, B
    for (let seed = 1; seed <= 25; seed++) {
      const inst = randomInstance(4, 3000 + seed);
      for (let j = 0; j < 4; j++) {
        const r = searchManipulations(inst, "left", "right", j);
        const several = validPartners(inst, "right", j).length >= 2;
        expect(r.best.trueRank < r.truthful.trueRank).toBe(several);
      }
    }
  });
});

describe("many-to-one", () => {
  it("reproduces the residency example", () => {
    const trace = applicantProposing(RESIDENCY_EXAMPLE);
    // A→Y, B→X, C→Z, D unmatched, E→X, F→Y
    expect(trace.match).toEqual([1, 0, 2, null, 0, 1]);
    expect(trace.steps.length).toBe(4);
    expect(trace.steps.flatMap((s) => s.displaced)).toEqual([
      { p: 4, r: 1 },
      { p: 3, r: 0 },
    ]);
    expect(collegeBlockingPairs(RESIDENCY_EXAMPLE, trace.match)).toEqual([]);
    const byHospitals = hospitalProposing(RESIDENCY_EXAMPLE);
    expect(byHospitals).toEqual([1, 1, 2, null, 0, 0]);
    expect(collegeBlockingPairs(RESIDENCY_EXAMPLE, byHospitals)).toEqual([]);
  });

  it("explains the residency example with cutoffs", () => {
    const a = applicantProposing(RESIDENCY_EXAMPLE).match;
    // X: cutoff B (#5 on X's list); Y: cutoff F (#4); Z: a seat is free
    expect(collegeCutoffs(RESIDENCY_EXAMPLE, a)).toEqual([1, 5, null]);
  });

  it("assigns every applicant their best hospital under the cutoffs (random instances)", () => {
    for (let seed = 1; seed <= 150; seed++) {
      const rng = mulberry32(10_000 + seed);
      const pick = (size: number, min: number) => {
        const all = Array.from({ length: size }, (_, k) => k);
        for (let i = size - 1; i > 0; i--) {
          const k = Math.floor(rng() * (i + 1));
          [all[i], all[k]] = [all[k], all[i]];
        }
        return all.slice(0, min + Math.floor(rng() * (size - min + 1)));
      };
      const inst: CollegeInstance = {
        applicants: Array.from({ length: 7 }, () => pick(3, 1)),
        hospitals: Array.from({ length: 3 }, () => pick(7, 2)),
        capacity: Array.from({ length: 3 }, () => 1 + Math.floor(rng() * 3)),
      };
      for (const match of [applicantProposing(inst).match, hospitalProposing(inst)]) {
        const cutoffs = collegeCutoffs(inst, match);
        match.forEach((h, s) => {
          expect(bestUnderCutoffs(inst, cutoffs, s)).toBe(h);
        });
      }
    }
  });

  it("satisfies the rural hospitals theorem on random instances", () => {
    for (let seed = 1; seed <= 150; seed++) {
      const rng = mulberry32(seed);
      const pick = (size: number, min: number) => {
        const all = Array.from({ length: size }, (_, k) => k);
        for (let i = size - 1; i > 0; i--) {
          const k = Math.floor(rng() * (i + 1));
          [all[i], all[k]] = [all[k], all[i]];
        }
        return all.slice(0, min + Math.floor(rng() * (size - min + 1)));
      };
      const inst: CollegeInstance = {
        applicants: Array.from({ length: 6 }, () => pick(3, 1)),
        hospitals: Array.from({ length: 3 }, () => pick(6, 2)),
        capacity: Array.from({ length: 3 }, () => 1 + Math.floor(rng() * 2)),
      };
      const a = applicantProposing(inst).match;
      const h = hospitalProposing(inst);
      expect(collegeBlockingPairs(inst, a)).toEqual([]);
      expect(collegeBlockingPairs(inst, h)).toEqual([]);
      expect(a.map((x) => x === null)).toEqual(h.map((x) => x === null));
      inst.capacity.forEach((q, hos) => {
        const ma = a.flatMap((x, s) => (x === hos ? [s] : []));
        const mh = h.flatMap((x, s) => (x === hos ? [s] : []));
        expect(ma.length).toBe(mh.length);
        if (ma.length < q) expect(ma).toEqual(mh);
      });
    }
  });
});

describe("stability versus efficiency (school choice)", () => {
  it("shows a Pareto improvement over DA that stability forbids, which TTC takes", () => {
    const da = applicantProposing(EFFICIENCY_EXAMPLE).match;
    expect(da).toEqual([0, 1, 2]); // 1a 2b 3c
    const ttc = topTradingCycles(EFFICIENCY_EXAMPLE);
    expect(ttc).toEqual([1, 0, 2]); // 1b 2a 3c
    const rank = (s: number, h: number | null) =>
      h === null ? Infinity : EFFICIENCY_EXAMPLE.applicants[s].indexOf(h);
    for (let s = 0; s < 3; s++) expect(rank(s, ttc[s])).toBeLessThanOrEqual(rank(s, da[s]));
    expect(collegeBlockingPairs(EFFICIENCY_EXAMPLE, da)).toEqual([]);
    expect(collegeBlockingPairs(EFFICIENCY_EXAMPLE, ttc)).toEqual([[2, 0]]); // (3, a)
    expect(paretoImprovement(EFFICIENCY_EXAMPLE, da)).toEqual([1, 0, 2]);
    expect(paretoImprovement(EFFICIENCY_EXAMPLE, ttc)).toBeNull();
    const trace = topTradingCyclesTrace(EFFICIENCY_EXAMPLE);
    expect(trace.rounds.map((r) => r.traded)).toEqual([[0, 1], [2]]);
    expect(trace.rounds[0].pointS).toEqual([1, 0, 0]);
    expect(trace.rounds[0].pointH).toEqual([0, 1, 0]);
  });

  it("returns feasible, individually rational assignments on random instances", () => {
    for (let seed = 1; seed <= 100; seed++) {
      const rng = mulberry32(20_000 + seed);
      const pick = (size: number) => {
        const all = Array.from({ length: size }, (_, k) => k);
        for (let i = size - 1; i > 0; i--) {
          const k = Math.floor(rng() * (i + 1));
          [all[i], all[k]] = [all[k], all[i]];
        }
        return all.slice(0, 1 + Math.floor(rng() * size));
      };
      const inst: CollegeInstance = {
        applicants: Array.from({ length: 6 }, () => pick(3)),
        hospitals: Array.from({ length: 3 }, () => pick(6)),
        capacity: Array.from({ length: 3 }, () => 1 + Math.floor(rng() * 2)),
      };
      const ttc = topTradingCycles(inst);
      inst.capacity.forEach((q, h) => {
        expect(ttc.filter((x) => x === h).length).toBeLessThanOrEqual(q);
      });
      ttc.forEach((h, s) => {
        if (h === null) return;
        expect(inst.applicants[s]).toContain(h);
        expect(inst.hospitals[h]).toContain(s);
      });
    }
  });
});

describe("random markets", () => {
  it("shows the ln n versus n / ln n asymmetry and its collapse when unbalanced", () => {
    const n = 80;
    const balanced = sampleRandomMarket(n, n, 40, 7);
    const ln = Math.log(n);
    expect(balanced.leftRankWhenLeftProposes).toBeLessThan(1.5 * ln);
    expect(balanced.rightRankWhenLeftProposes).toBeGreaterThan((0.6 * n) / ln);
    expect(balanced.leftRankWhenRightProposes).toBeGreaterThan((0.6 * n) / ln);
    expect(balanced.leftAgentsWithDifferentPartners).toBeGreaterThan(0.5);
    const unbalanced = sampleRandomMarket(n, n + 1, 40, 7);
    expect(unbalanced.leftRankWhenRightProposes).toBeLessThan(1.5 * ln);
    expect(unbalanced.leftAgentsWithDifferentPartners).toBeLessThan(0.3);
    let harmonic = 0;
    for (let k = 1; k <= n; k++) harmonic += 1 / k;
    expect(balanced.proposalsWhenLeftProposes).toBeLessThanOrEqual(n * harmonic * 1.05);
  });
});
