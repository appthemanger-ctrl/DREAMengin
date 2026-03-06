/**
 * LedgerAI — TypeScript engine ported from the Python MCP design.
 *
 * Core concepts:
 *  - strain   : accumulated tension; grows with each recorded outcome
 *  - slog     : signed log — keeps values bounded regardless of magnitude
 *  - throttling: scales a base value by (1 + δP·χ), where χ is strain diff
 *  - explore  : curiosity-driven random choice when strain is low
 *  - exploit  : pick the experience with the highest outcome
 *  - phase shift: compresses all outcomes via slog, halves strain ("levelling up")
 */

export interface LedgerEntry {
  exp: string;
  outcome: number;
  strain: number;
  timestamp: number;
}

export interface LedgerState {
  strain: number;
  ledgerSize: number;
  stepCount: number;
  deltaP: number;
  exploreCount: number;
  exploitCount: number;
  phaseShiftCount: number;
}

export class LedgerAI {
  readonly deltaP: number;
  readonly ledger: LedgerEntry[];
  strain: number;
  stepCount: number;
  exploreCount: number;
  exploitCount: number;
  phaseShiftCount: number;

  constructor(deltaP = 0.1) {
    this.deltaP = deltaP;
    this.ledger = [];
    this.strain = 0;
    this.stepCount = 0;
    this.exploreCount = 0;
    this.exploitCount = 0;
    this.phaseShiftCount = 0;
  }

  /** Signed logarithm — keeps outcomes bounded. */
  slog(x: number): number {
    return Math.sign(x) * Math.log1p(Math.abs(x));
  }

  /** Throttling function: scales base by (1 + δP·χ). */
  throttling(base: number, chi: number): number {
    return base * (1 + this.deltaP * chi);
  }

  /** Record an experience with a numerical outcome. Updates strain. */
  record(experience: string, outcome: number): void {
    this.ledger.push({
      exp: experience,
      outcome,
      strain: this.strain,
      timestamp: Date.now(),
    });
    this.strain += this.slog(Math.abs(outcome)) * this.deltaP;
    this.stepCount++;
  }

  /** Returns true when curiosity exceeds the current threshold. */
  shouldExplore(): boolean {
    const curiosity = this.throttling(1.0, -this.strain);
    const threshold = this.deltaP * (1 + this.deltaP * this.strain);
    return Math.random() < curiosity * threshold;
  }

  /** Choose an action: explore (random) or exploit (best outcome so far). */
  decide(state: string, actionSpace: string[]): string {
    if (actionSpace.length === 0) throw new Error('action_space must not be empty');

    if (this.ledger.length === 0 || this.shouldExplore()) {
      this.strain *= 1.01;
      this.exploreCount++;
      return actionSpace[Math.floor(Math.random() * actionSpace.length)];
    }

    const best = this.ledger.reduce((a, b) => (a.outcome > b.outcome ? a : b));
    const deltaChi = this.strain - best.strain;
    const adjustment = this.throttling(0, deltaChi);

    if (Math.abs(adjustment) > this.deltaP) {
      this.phaseShift();
    }

    this.exploitCount++;
    // Return the experience string that yielded the best outcome.
    // In a real system you'd map experiences → actions; here exp IS the action label.
    return best.exp;
  }

  /** Compress all outcomes via slog and halve strain. */
  phaseShift(): void {
    for (const entry of this.ledger) {
      entry.outcome = this.slog(entry.outcome);
    }
    this.strain *= 0.5;
    this.phaseShiftCount++;
  }

  getState(): LedgerState {
    return {
      strain: this.strain,
      ledgerSize: this.ledger.length,
      stepCount: this.stepCount,
      deltaP: this.deltaP,
      exploreCount: this.exploreCount,
      exploitCount: this.exploitCount,
      phaseShiftCount: this.phaseShiftCount,
    };
  }

  /** Serialise to JSON string for persistence / caching. */
  serialize(): string {
    return JSON.stringify({
      deltaP: this.deltaP,
      ledger: this.ledger,
      strain: this.strain,
      stepCount: this.stepCount,
      exploreCount: this.exploreCount,
      exploitCount: this.exploitCount,
      phaseShiftCount: this.phaseShiftCount,
    });
  }

  /** Restore from a previously serialised string. */
  static deserialize(json: string): LedgerAI {
    const d = JSON.parse(json) as {
      deltaP?: number;
      ledger?: LedgerEntry[];
      strain?: number;
      stepCount?: number;
      exploreCount?: number;
      exploitCount?: number;
      phaseShiftCount?: number;
    };
    const ai = new LedgerAI(d.deltaP ?? 0.1);
    (ai.ledger as LedgerEntry[]).push(...(d.ledger ?? []));
    ai.strain = d.strain ?? 0;
    ai.stepCount = d.stepCount ?? 0;
    ai.exploreCount = d.exploreCount ?? 0;
    ai.exploitCount = d.exploitCount ?? 0;
    ai.phaseShiftCount = d.phaseShiftCount ?? 0;
    return ai;
  }
}
