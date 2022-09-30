// Mini custom Vec2 library
export const UP = [0, -1];
export const LEFT = [-1, 0];
export const DOWN = [0, 1];
export const RIGHT = [1, 0];
export const copy = (v) => [v[0], v[1]];
export const add = (v1, v2) => [v1[0] + v2[0], v1[1] + v2[1]];
export const sub = (v1, v2) => [v1[0] - v2[0], v1[1] - v2[1]];
export const mul = (n, v) => [n * v[0], n * v[1]];
export const dot = (v1, v2) => v1[0] * v2[0] + v1[1] * v2[1];
export const length = (v) => Math.sqrt(dot(v, v));
export const normalize = (v) => mul(1 / length(v), v);
export const angleOf = (v) => Math.atan2(v[1], v[0]);
export const angleBetween = (v1, v2) => angleOf(sub(v2, v1));
export const distance = (v1, v2) => length(sub(v1, v2));
export const round = (v) => [Math.round(v[0]), Math.round(v[1])];
// reference: https://en.wikipedia.org/wiki/Rotation_matrix
export const rotate = (v, theta) => [
    Math.cos(theta) * v[0] - Math.sin(theta) * v[1],
    Math.sin(theta) * v[0] + Math.cos(theta) * v[1],
];
export const normalVec2FromAngle = (theta) => [
    Math.cos(theta),
    Math.sin(theta),
];
