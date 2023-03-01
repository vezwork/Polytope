import { forkLift } from "./Functions.js";
import { clamp } from "./math/Number.js";

export const arrLiftFn = (fn) => (ps) => ps.map(fn);
export const arrFork = forkLift(arrLiftFn);

export function findIndex2D<T>(
  array2D: T[][],
  predicate: (value: T, index: number, obj: T[]) => boolean
): [number, number] {
  return array2D.reduce(
    (acc, line, i) => {
      const foundIndex = line.findIndex(predicate);
      if (foundIndex !== -1) return [i, foundIndex];
      else return acc;
    },
    [-1, -1]
  );
}

export function compareIndex2D(
  [y1, x1]: [number, number],
  [y2, x2]: [number, number]
): -1 | 0 | 1 {
  if (y1 < y2) return -1;
  if (y1 === y2) {
    if (x1 < x2) return -1;
    if (x1 === x2) return 0;
    return 1;
  }
  return 1;
}

/**
 * note: non-commutative.
 * note: wraps horizontally, does not wrap vertically. Clamped to start and end of array.
 */
export function wrapLinesAddXIndex2D<T>(
  array2D: T[][],
  [y, x]: [number, number],
  addX: number
) {
  let newY = y;
  let newX = x + addX;
  if (newX > array2D[newY].length - 1) {
    while (newX > array2D[newY].length - 1) {
      newX -= array2D[newY].length;
      newY += 1;
      if (newY > array2D.length - 1) return [Infinity, Infinity];
    }
  }
  if (newX < 0) {
    while (newX < 0) {
      newY -= 1;
      if (newY < 0) return [-Infinity, -Infinity];
      newX += array2D[newY].length;
    }
  }
  return [newY, newX];
}

/**
 * note: non-commutative.
 * note: wraps horizontally, does not wrap vertically. Clamped to start and end of array.
 */
export function wrapLinesAddXIndex2DClamped<T>(
  array2D: T[][],
  index: [number, number],
  addX: number
) {
  const [y, x] = wrapLinesAddXIndex2D(array2D, index, addX);

  const clampY = clamp(0, y, array2D.length - 1);
  const clampX = clamp(0, x, array2D[clampY].length - 1);
  return [clampY, clampX];
}

// finds the maximum valued element
export function max<T>(els: T[], valueOf: (el: T) => number) {
  return sortFirst(els, (el1, el2) => valueOf(el1) - valueOf(el2));
}

export function min<T>(els: T[], valueOf: (el: T) => number) {
  return sortFirst(els, (el1, el2) => valueOf(el2) - valueOf(el1));
}

// the same as sort, but just takes the first element. Linear time.
// 0 represents "equal", >0 means el1 > el2, <0 means el2 > el2
export function sortFirst<T>(els: T[], compare: (el1: T, el2: T) => number) {
  return els.reduce(
    (acc, el: T) => (acc === null || compare(el, acc) > 0 ? el : acc),
    null as null | T
  );
}
