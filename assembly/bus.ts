// assembly/bus.ts — lock-free SharedArrayBuffer queue for the dual runtime bus

export const QUEUE_SIZE: i32 = 1024; // number of entries
const ENTRY_WORDS: i32 = 4; // channel/event, payloadPtr, payloadLen, reserved

const queue = new StaticArray<u32>(QUEUE_SIZE * ENTRY_WORDS);
let head: i32 = 0;
let tail: i32 = 0;

@inline
function entryIndex(pos: i32): i32 {
  return pos * ENTRY_WORDS;
}

/**
 * Enqueue a message.
 * @param channel     Upper 16 bits of the packed channel/event word.
 * @param event       Lower 16 bits of the packed channel/event word.
 * @param payloadPtr  Pointer to the payload bytes in shared memory.
 * @param payloadLen  Length of the payload in bytes (JSON string).
 * @returns 1 on success, 0 if the queue is full.
 */
export function enqueue(channel: u32, event: u32, payloadPtr: u32, payloadLen: u32): i32 {
  const next = (head + 1) % QUEUE_SIZE;
  if (next == tail) return 0; // full

  const idx = entryIndex(head);
  const base = changetype<usize>(queue) + (idx << 2); // <<2 for bytes

  atomic.store<u32>(base, (channel << 16) | (event & 0xffff));
  atomic.store<u32>(base + 4, payloadPtr);
  atomic.store<u32>(base + 8, payloadLen);
  atomic.store<u32>(base + 12, 0); // reserved

  head = next;
  return 1;
}

/**
 * Dequeue the next message into outPtr.
 * outPtr must have space for 4 u32 words.
 * @returns 1 on success, 0 if the queue is empty.
 */
export function dequeue(outPtr: usize): i32 {
  if (tail == head) return 0; // empty

  const idx = entryIndex(tail);
  const base = changetype<usize>(queue) + (idx << 2);

  store<u32>(outPtr, atomic.load<u32>(base));
  store<u32>(outPtr + 4, atomic.load<u32>(base + 4));
  store<u32>(outPtr + 8, atomic.load<u32>(base + 8));
  store<u32>(outPtr + 12, atomic.load<u32>(base + 12));

  tail = (tail + 1) % QUEUE_SIZE;
  return 1;
}

/** Reset the queue to an empty state. */
export function reset(): void {
  head = 0;
  tail = 0;
}
