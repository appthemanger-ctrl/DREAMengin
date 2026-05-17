type MadMaxiWasmExports = {
  memory: WebAssembly.Memory;
  getSnapshotSize: () => number;
  writeSnapshot: (ptr: number) => void;
  loadSnapshot: (ptr: number) => void;
};

let madMaxiExportsPromise: Promise<MadMaxiWasmExports | null> | null = null;

async function loadMadMaxiExports(: Promise<MadMaxiWasmExports | null> {
  if (madMaxiExportsPromise) return madMaxiExportsPromise;
  madMaxiExportsPromise = (async () => {
    try {
      const wasmPath = typeof window === 'undefined'
        ? `${process.cwd()}/public/cartridges/mad-maxi/logic/main.wasm`
        : '/cartridges/mad-maxi/logic/main.wasm';
      const bytes = typeof window === 'undefined'
        ? await (await import(/* webpackIgnore: true */ 'fs/promises')).readFile(wasmPath)
        : new Uint8Array(await (await fetch(wasmPath)).arrayBuffer());
      const { instance } = await WebAssembly.instantiate(bytes as BufferSource, {});
      return instance.exports as unknown as MadMaxiWasmExports;
    } catch {
      return null;
    }
  })();
  return madMaxiExportsPromise;
}

export async function invokeMadMaxiSnapshotTransfer(: Promise<void> {
  const exp = await loadMadMaxiExports();
  if (!exp) return;

  const size = exp.getSnapshotSize();
  const bytesPerPage = 65536;
  const requiredPages = Math.max(1, Math.ceil((size + 64) / bytesPerPage));
  const currentPages = exp.memory.buffer.byteLength / bytesPerPage;
  if (currentPages < requiredPages) {
    exp.memory.grow(requiredPages - currentPages);
  }

  const ptr = 32;
  exp.writeSnapshot(ptr);
  exp.loadSnapshot(ptr);
}
