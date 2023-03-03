export const withHistory = function* <T>(
  iterable: Iterable<T>
): Generator<[T, T[]]> {
  let history: T[] = [];
  for (const item of iterable) {
    yield [item, history] as [T, T[]];
    history.push(item);
  }
};
export const historyArray = function* <T>(
  iterable: Iterable<T>,
  number = Infinity
): Generator<T[]> {
  let history = Array(number);
  for (const result of iterable) {
    history = [result, ...history];
    history.length = number;
    yield history;
  }
};
export const take = function* <T>(number: number, iterable: Iterable<T>) {
  let i = 0;
  for (const item of iterable) {
    i++;
    if (i > number) break;
    yield item;
  }
};

export function* concat<T, Y>(
  i1: Iterable<T>,
  i2: Iterable<Y>
): Generator<T | Y> {
  for (const item of i1) yield item;
  for (const item of i2) yield item;
}
export const isEmpty = <T>(iterable: Iterable<T>) => {
  for (const _ of iterable) return false;
  return true;
};
export const first = <T>(iterable: Iterable<T>): T | undefined => {
  for (const i of iterable) return i;
};
export const last = <T>(iterable: Iterable<T>): T | undefined => {
  let l: T | undefined = undefined;
  for (const i of iterable) l = i;
  return l;
};
export const skip = function* <T>(
  number: number,
  iterable: Iterable<T>
): Generator<T> {
  let i = 0;
  for (const item of iterable) {
    i++;
    if (i <= number) continue;
    yield item;
  }
};
export const map = function* <T, Y>(
  iterable: Iterable<T>,
  func: (t: T) => Y
): Generator<Y> {
  for (const item of iterable) yield func(item);
};
export const flatMap = function* <T, Y>(
  iterable: Iterable<T>,
  gen: (t: T) => Generator<Y>
): Generator<Y> {
  for (const item of iterable) yield* gen(item);
};
export const some = function <T>(
  iterable: Iterable<T>,
  predicate: (t: T) => boolean
) {
  for (const item of iterable) {
    if (predicate(item)) return true;
  }
  return false;
};
export const filter = function* <T>(
  iterable: Iterable<T>,
  func: (t: T) => boolean
): Generator<T> {
  for (const item of iterable) if (func(item)) yield item;
};
export const withIndex = function* <T>(
  iterable: Iterable<T>
): Generator<[T, number]> {
  let i = 0;
  for (const item of iterable) {
    yield [item, i] as [T, number];
    i++;
  }
};

export const find = <T>(
  iterable: Iterable<T>,
  predicate: (t: T) => boolean
): T | null => {
  for (const item of iterable) if (predicate(item)) return item;
  return null;
};

export const indexOf = <T>(
  iterable: Iterable<T>,
  predicate: (t: T, i: number) => boolean
): number | null => {
  for (const [item, i] of withIndex(iterable)) if (predicate(item, i)) return i;
  return null;
};

// non iteratable inputs:
export function* pairs<T>(l: T[]): Generator<[T, T]> {
  for (let i = 0; i < l.length - 1; i++) yield [l[i], l[i + 1]];
}
export const range = function* (start: number, end: number, step = 1) {
  for (let n = start; n < end; n += step) {
    yield n;
  }
};

// iterable outputs:

export function* recurse<T>(
  func: (t: any) => any,
  initialInput: T,
  shouldStopRecursing: (t: T) => boolean
): Generator<T> {
  let curInput: T = initialInput;
  while (true) {
    const nextInput = func(curInput);
    if (shouldStopRecursing(nextInput)) return;
    curInput = nextInput;
    yield curInput;
  }
}
