export function throttle<T extends (...args: unknown[]) => void>(fn: T, delayMs: number): T {
  let lastCall = 0;
  let pending = false;
  let lastArgs: Parameters<T> | null = null;

  const invoke = () => {
    if (lastArgs) {
      fn(...lastArgs);
      lastArgs = null;
    }
    pending = false;
    lastCall = Date.now();
  };

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delayMs) {
      fn(...args);
      lastCall = now;
      pending = false;
      lastArgs = null;
    } else {
      lastArgs = args;
      if (!pending) {
        pending = true;
        setTimeout(invoke, delayMs - (now - lastCall));
      }
    }
  }) as T;
}
