// Mini custom Vec2 library

export type Vec2 = [number, number];

export const UP: Vec2 = [0, -1];
export const LEFT: Vec2 = [-1, 0];
export const DOWN: Vec2 = [0, 1];
export const RIGHT: Vec2 = [1, 0];

export const copy = (v: Vec2): Vec2 => [v[0], v[1]];

export const add = (v1: Vec2, v2: Vec2): Vec2 => [v1[0] + v2[0], v1[1] + v2[1]];

export const sub = (v1: Vec2, v2: Vec2): Vec2 => [v1[0] - v2[0], v1[1] - v2[1]];

export const mul = (n: number, v: Vec2): Vec2 => [n * v[0], n * v[1]];

export const dot = (v1: Vec2, v2: Vec2): number =>
  v1[0] * v2[0] + v1[1] * v2[1];

export const length = (v: Vec2): number => Math.sqrt(dot(v, v));

export const normalize = (v: Vec2): Vec2 => mul(1 / length(v), v);

export const angleOf = (v: Vec2): number => Math.atan2(v[1], v[0]);

export const angleBetween = (v1: Vec2, v2: Vec2): number =>
  angleOf(sub(v2, v1));

export const distance = (v1: Vec2, v2: Vec2): number => length(sub(v1, v2));

export const round = (v: Vec2) => [Math.round(v[0]), Math.round(v[1])];

// reference: https://en.wikipedia.org/wiki/Rotation_matrix
export const rotate = (v: Vec2, theta: number): Vec2 => [
  Math.cos(theta) * v[0] - Math.sin(theta) * v[1],
  Math.sin(theta) * v[0] + Math.cos(theta) * v[1],
];
export const normalVec2FromAngle = (theta: number): Vec2 => [
  Math.cos(theta),
  Math.sin(theta),
];
