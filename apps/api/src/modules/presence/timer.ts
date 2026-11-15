/** Schedules callbacks (DIP: tests may inject a fake). Returns a cancel function. */
export interface Timer {
  schedule(ms: number, callback: () => void): () => void;
}

export const TIMER = Symbol("TIMER");

export const systemTimer: Timer = {
  schedule(ms, callback) {
    const handle = setTimeout(callback, ms);
    handle.unref?.();
    return () => clearTimeout(handle);
  },
};
