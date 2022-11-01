import { distance } from "./Vec2.js";

// intervals are two (unordered) numbers representing the range of all numbers in between them

export const orderIncreasing = ([n1, n2]: [number, number]): [
  number,
  number
] => [Math.min(n1, n2), Math.max(n1, n2)];

export const size = (i: [number, number]) => {
  const [min, max] = orderIncreasing(i);
  return max - min;
};

// positive result n means seperated by n units, negative n means overlapping by n units
export const dist = (a: [number, number], b: [number, number]): number => {
  const [min1, max1] = orderIncreasing(a);
  const [min2, max2] = orderIncreasing(b);
  return Math.max(min1, min2) - Math.min(max1, max2);
};

// is number in interval, inclusive of min and max?
export const isInInterval = (n: number, i: [number, number]) => {
  const [min, max] = orderIncreasing(i);
  return n >= min && n <= max;
};

export const seperatingInterval = (
  a: [number, number],
  b: [number, number]
): [number, number] | null => {
  const [min1, max1] = orderIncreasing(a);
  const [min2, max2] = orderIncreasing(b);
  if (min1 > max2) return [max2, min1];
  if (min2 > max1) return [max1, min2];
  return null;
};
export const overlappingInterval = (
  a: [number, number],
  b: [number, number]
): [number, number] | null => {
  const [min1, max1] = orderIncreasing(a);
  const [min2, max2] = orderIncreasing(b);
  if (isInInterval(min1, b)) return [min1, Math.min(max1, max2)];
  if (isInInterval(min2, a)) return [min2, Math.min(max1, max2)];
  if (isInInterval(max1, b)) return [Math.max(min1, min2), max1];
  if (isInInterval(max2, a)) return [Math.max(min1, min2), max2];
  return null;
};

// signed seperation
// - 0 result means they are overlapping
// - positive result means a is above b
// - negative result means b is above a
export const seperation = (
  a: [number, number],
  b: [number, number]
): number => {
  const d = dist(a, b);
  if (d < 0) return 0;
  else return Math.min(...a) > Math.max(...b) ? d : -d;
};
export const areSeperated = (a: [number, number], b: [number, number]) =>
  dist(a, b) < 0;
export const areOverlapped = (a: [number, number], b: [number, number]) =>
  dist(a, b) > 0;

// distance between these two intervals: e.g.
//
// interval-axis
// ^
// |  |
// |  |
// |  |
// |
// |               |
// |               |
// ---------------------> n-axis
//
export const axisAlignedIntervalDist = (
  a: { n: number; interval: [number, number] },
  b: { n: number; interval: [number, number] }
): number => {
  const i = seperatingInterval(a.interval, b.interval);
  if (i === null) return Math.abs(a.n - b.n); // intervals overlap so just get 1D distance
  return distance([a.n, i[0]], [b.n, i[1]]);
};
