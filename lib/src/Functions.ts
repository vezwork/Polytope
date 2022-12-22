export const compose =
  (f) =>
  (g) =>
  (...args) =>
    f(g(...args));
export const not = compose((i) => !i);

export const eq = (v1: unknown) => (v2: unknown) => v1 === v2;
export const neq = (v1: unknown) => (v2: unknown) => v1 !== v2;
