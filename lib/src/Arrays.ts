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

export function max<T>(els: T[], valueOf: (el: T) => number) {
  return sortFirst(els, (el1, el2) => valueOf(el1) - valueOf(el2));
}

// the same as sort, but just takes the first element. Linear time.
export function sortFirst<T>(els: T[], compare: (el1: T, el2: T) => number) {
  return els.reduce(
    (acc, el: T) => (acc === null || compare(el, acc) ? el : acc),
    null as null | T
  );
}
