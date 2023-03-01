export const _ = (f) => (g) => (...args) => f(g(...args));
export const forkLift = (liftFn) => (ps) => (arg) => liftFn((fn) => fn(arg))(ps);
export const jsonLiftFn = (fn) => (arg) => {
    if (Array.isArray(arg))
        return arg.map(jsonLiftFn(fn));
    if (typeof arg === "object" && arg !== null) {
        return Object.fromEntries(Object.entries(arg).map(([key, value]) => [key, jsonLiftFn(fn)(value)]));
    }
    return fn(arg);
};
export const not = _((i) => !i);
export const eq = (v1) => (v2) => v1 === v2;
export const neq = (v1) => (v2) => v1 !== v2;
