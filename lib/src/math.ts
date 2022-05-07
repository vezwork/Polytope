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

export type LineSegment = [Vec2, Vec2];

export const lerp = ([start, end]: LineSegment, t: number) =>
  add(start, mul(t, sub(end, start)));

// reference: https://stackoverflow.com/a/6853926/5425899
// StackOverflow answer license: CC BY-SA 4.0
// Gives the shortest Vec2 from the point v to the line segment.
export const subLineSegment = (v: Vec2, [start, end]: LineSegment) => {
  const startToV = sub(v, start);
  const startToEnd = sub(end, start);

  const lengthSquared = dot(startToEnd, startToEnd);
  const parametrizedLinePos =
    lengthSquared === 0
      ? -1
      : Math.max(0, Math.min(1, dot(startToV, startToEnd) / lengthSquared));

  const closestPointOnLine = lerp([start, end], parametrizedLinePos);
  return sub(v, closestPointOnLine);
};

export const reflectAngle = (theta1: number, theta2: number): number =>
  theta2 + subAngles(theta1, theta2);

export const subAngles = (theta1: number, theta2: number): number =>
  mod(theta2 - theta1 + Math.PI, Math.PI * 2) - Math.PI;

export const mod = (a: number, n: number): number => a - Math.floor(a / n) * n;

export const smoothStep = (
  currentValue: number,
  targetValue: number,
  slowness: number
): number => currentValue - (currentValue - targetValue) / slowness;
