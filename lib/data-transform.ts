export interface DataPhysicsConfig {
  readonly n: number;
  readonly a0: number;
  readonly participation: number;
}

export const DATA_PHYSICS: DataPhysicsConfig = Object.freeze({
  n: 2.1,
  a0: 1.2e-10,
  participation: 0.1,
});

export function encodeToLedger(buffer: readonly number[]): number[] {
  return buffer.map((value) => Math.sign(value) * Math.log1p(Math.abs(value)));
}

export function applyPhysicsFilter(encodedBuffer: readonly number[]): number[] {
  return encodedBuffer.filter((dataPoint) => {
    const x = Math.abs(dataPoint) / DATA_PHYSICS.a0;
    const expected =
      x / Math.pow(1 + Math.pow(x, DATA_PHYSICS.n), 1 / DATA_PHYSICS.n);

    return Math.abs(dataPoint - expected) > DATA_PHYSICS.participation * 0.01;
  });
}

export function decodeFromLedger(buffer: readonly number[]): number[] {
  return buffer.map((value) => Math.sign(value) * Math.expm1(Math.abs(value)));
}
