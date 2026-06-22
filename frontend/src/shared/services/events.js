const listeners = {};

export function emit(event, data) {
  (listeners[event] || []).forEach((fn) => fn(data));
}

export function on(event, fn) {
  if (!listeners[event]) listeners[event] = [];
  listeners[event].push(fn);
  return () => {
    listeners[event] = (listeners[event] || []).filter((f) => f !== fn);
  };
}
