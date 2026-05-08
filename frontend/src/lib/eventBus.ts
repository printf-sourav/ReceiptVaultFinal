type Callback = (...args: any[]) => void;

const listeners: Record<string, Callback[]> = {};

export function subscribe(event: string, cb: Callback) {
  listeners[event] = listeners[event] || [];
  listeners[event].push(cb);
  return () => {
    listeners[event] = (listeners[event] || []).filter((fn) => fn !== cb);
  };
}

export function publish(event: string, ...args: any[]) {
  (listeners[event] || []).slice().forEach((cb) => {
    try {
      cb(...args);
    } catch (e) {
      // ignore
    }
  });
}

export default { subscribe, publish };
