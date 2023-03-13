// Mini custom Vec2 library
export const UP = [0, -1];
export const LEFT = [-1, 0];
export const DOWN = [0, 1];
export const RIGHT = [1, 0];
export const x = (v) => v[0];
export const y = (v) => v[1];
export const copy = (v) => [v[0], v[1]];
export const add = (v1, v2) => [v1[0] + v2[0], v1[1] + v2[1]];
export const sub = (v1, v2) => [v1[0] - v2[0], v1[1] - v2[1]];
export const mul = (n, v) => [n * v[0], n * v[1]];
export const scale = (v1, v2) => [
    v1[0] * v2[0],
    v1[1] * v2[1],
];
export const dot = (v1, v2) => v1[0] * v2[0] + v1[1] * v2[1];
export const length = (v) => Math.sqrt(dot(v, v));
export const normalize = (v) => mul(1 / length(v), v);
export const setLength = (l, v) => mul(l, normalize(v));
export const angleOf = (v) => Math.atan2(v[1], v[0]);
export const angleBetween = (v1, v2) => angleOf(sub(v2, v1));
export const distance = (v1, v2) => length(sub(v1, v2));
export const round = (v) => v.map(Math.round);
// name ref: https://twitter.com/FreyaHolmer/status/1587900959891472384
export const basisProj = (base) => (v) => dot(v, base) / dot(base, base);
export const proj = (base) => (v) => mul(dot(v, base) / dot(base, base), base); // equal to: `mul(dot(v, normalize(base)), normalize(base))`
export const scalarProj = (base) => (v) => dot(v, base) / length(base);
// reference: https://en.wikipedia.org/wiki/Rotation_matrix
export const rotate = (v, theta) => [
    Math.cos(theta) * v[0] - Math.sin(theta) * v[1],
    Math.sin(theta) * v[0] + Math.cos(theta) * v[1],
];
export const rotateQuarter = (v) => [-v[1], v[0]];
export const normalVec2FromAngle = (theta) => [
    Math.cos(theta),
    Math.sin(theta),
];
