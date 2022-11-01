import { skip } from "./Iterable.js";

export class SetMap<K, V> extends Map<K, Set<V>> {
  add(key: K, value: V) {
    if (this.has(key)) {
      this.get(key)?.add(value);
    } else {
      this.set(key, new Set([value]));
    }
    return this;
  }
  remove(key: K, value: V) {
    this.get(key)?.delete(value);
  }
}

const REVERSE_KEY = Symbol('reverse')

type SetMapWithReverseArgs<K, V> = ConstructorParameters<typeof SetMap<K, V>> | [{ [REVERSE_KEY]: SetMapWithReverse<V, K> }]

// A directed graph that keeps track of both the to and from connections between nodes.
export class SetMapWithReverse<K, V> extends SetMap<K, V> {
  // `super.set` may be used in the Map constructor, so this may be initialized already
  _reverse: SetMapWithReverse<V, K>;
  get reverse() {
    return this._reverse;
  }

  constructor(...args: SetMapWithReverseArgs<K, V>) {
    if (args?.[0]?.[REVERSE_KEY]) { // constructing the reverse
      super();
      this._reverse = args[0][REVERSE_KEY];
    } else { // constructing the non-reverse
      super(...(args as ConstructorParameters<typeof SetMap<K, V>>));
      this._reverse = new SetMapWithReverse<V, K>({ [REVERSE_KEY]: this })
    }
  }

  add(key: K, value: V) {
    // if (!this._reverse)
    //   this._reverse = new SetMapWithReverse<V, K>({ [REVERSE_KEY]: this });

    super.add(key, value);
    this.reverse._addFromReverse(value, key);
    return this;
  }
  protected _addFromReverse(key: K, value: V) {
    super.add(key, value);
  }
  remove(key: K, value: V) {
    super.remove(key, value);
    this.reverse._removeFromReverse(value, key);
  }
  protected _removeFromReverse(key: K, value: V) {
    super.remove(key, value);
  }
  delete(key: K) {
    for (const value of this.get(key) ?? [])
      this.reverse._removeFromReverse(value, key)
    return super.delete(key)
  }
  protected _deleteFromReverse(key: K) {
    return super.delete(key)
  }
  clear() {
    super.clear();
    this.reverse._clearFromReverse();
  }
  protected _clearFromReverse() {
    super.clear();
  }
  replaceKey(key: K, replacementKey: K) {
    for (const value of this.get(key) ?? []) this.add(replacementKey, value)
    this.delete(key)
  }
  replaceValue(value: V, replacementValue: V) {
    this.reverse.replaceKey(value, replacementValue)
  }
}

type PartialBinaryRelation<T> = (a: T, b: T) => boolean | null;

// Endo is shorted for "endomorphic" which means the underlying SetMap maps from a type T to itself
export class EndoSetMapWithReverse<T> extends SetMapWithReverse<T, T> {
  _reverse: EndoSetMapWithReverse<T>;
  get reverse() {
    return this._reverse;
  }

  constructor(...args: SetMapWithReverseArgs<T, T>) {
    if (args?.[0]?.[REVERSE_KEY]) { // constructing the reverse
      super();
      this._reverse = args[0][REVERSE_KEY];
    } else { // constructing the non-reverse
      super(...(args as ConstructorParameters<typeof SetMap<T, T>>));
      this._reverse = new EndoSetMapWithReverse<T>({ [REVERSE_KEY]: this })
    }
  }

  *traverseBreadthFirst(start: T) {
    const toVisit = [start];
    const visited = new Set();
    while (toVisit.length > 0) {
      const cur = toVisit.pop() as T;
      visited.add(cur);
      for (const next of this.get(cur) ?? []) {
        if (!visited.has(next)) toVisit.push(next);
      }
      yield cur;
    }
  }

  // deprecated because `hasPathBetween` is simpler, more effecient in most basic cases. The transitive
  // closure doesn't have to be pre-computed unless you are gonna do > |nodes| queries.
  // Adds edges to the MultiMap in-place to form its transitive closure
  // future ref: https://cs.stackexchange.com/questions/152297/transitive-closure-of-a-graph
  // future ref: https://arxiv.org/pdf/0707.1532v1.pdf "Sorting and Selection in Posets"
  // - for an effecient alternative to DirectedGraph for representing transitive antisymmetric relations
  transitiveClosure() {
    for (const key of this.keys())
      for (const reachableKey of this.traverseBreadthFirst(key))
        if (key !== reachableKey) this.add(key, reachableKey);
  }

  hasPathBetween(key: T, value: T) {
    for (const reachableKey of this.traverseBreadthFirst(key))
      if (reachableKey === value) return true
    return false
  }

  hasPathOrReversePathBetween(key: T, value: T) {
    return this.hasPathBetween(key, value) || this.reverse.hasPathBetween(key, value)
  }

  merge(resultKey: T, ...mergeKeys: T[]) {
    for (const key of mergeKeys) {
      this.replaceKey(key, resultKey)
      this.replaceValue(key, resultKey)
    }
  }

  static FromBinaryRelation<T>(
    objects: T[],
    rel: PartialBinaryRelation<T>
  ): EndoSetMapWithReverse<T> {
    const graph = new EndoSetMapWithReverse<T>();

    for (const object of objects)
      for (const otherObject of objects)
        if (rel(object, otherObject)) graph.add(object, otherObject);

    return graph;
  }
}

type MapWithReverseArgs<K, V> = ConstructorParameters<typeof Map<K, V>> | [{ [REVERSE_KEY]: ReverseMap<V, K> }]
export class MapWithReverse<K, V> extends Map<K, V> {
    // `super.set` may be used in the Map constructor, so this may be initialized already
    _reverse: ReverseMap<V, K>;
    get reverse() {
      return this._reverse;
    }
  
    constructor(...args: MapWithReverseArgs<K, V>) {
      if (args?.[0]?.[REVERSE_KEY]) { // constructing the reverse
        super();
        this._reverse = args[0][REVERSE_KEY];
      } else { // constructing the non-reverse
        super(...(args as ConstructorParameters<typeof Map<K, V>>));
        this._reverse = new ReverseMap<V, K>({ [REVERSE_KEY]: this })
      }
    }

  set(key: K, value: V): this {
    if (!this._reverse) this._reverse = new ReverseMap<V, K>();

    if (this.has(key)) this.reverse.remove(this.get(key) as V, key);
    this.reverse._addFromReverse(value, key);
    super.set(key, value);
    return this;
  }
  _setFromReverse(key: K, value: V) {
    super.set(key, value);
  }
  delete(key: K): boolean {
    if (this.has(key)) this.reverse._removeFromReverse(this.get(key) as V, key);
    return super.delete(key);
  }
  _deleteFromReverse(key: K) {
    return super.delete(key);
  }
  clear() {
    this.reverse._clearFromReverse();
    super.clear();
  }
  _clearFromReverse() {
    super.clear();
  }
}

export type EndoMap<T> = Map<T, T>;

type ReverseMapArgs<K, V> = ConstructorParameters<typeof SetMap<K, V>> | [{ [REVERSE_KEY]: MapWithReverse<V, K> }]
// this is the same as a SetMap except that it has a reverse and cannot have the same value in more than one set.
export class ReverseMap<K, V> extends SetMap<K, V> {
  // `super.set` may be used in the Map constructor, so this may be initialized already
  _reverse: MapWithReverse<V, K>;
  get reverse() {
    return this._reverse;
  }

  constructor(...args: ReverseMapArgs<K, V>) {
    if (args?.[0] && args?.[0][REVERSE_KEY]) { // constructing the reverse
      super();
      this._reverse = args[0][REVERSE_KEY];
    } else { // constructing the non-reverse
      super(...(args as ConstructorParameters<typeof SetMap<K, V>>));
      this._reverse = new MapWithReverse<V, K>({ [REVERSE_KEY]: this })
    }
  }

  // should have set and delete too

  add(key: K, value: V) {
    super.add(key, value);
    this.reverse._setFromReverse(value, key);
    return this;
  }
  _addFromReverse(key: K, value: V) {
    super.add(key, value);
  }

  remove(key: K, value: V) {
    this.get(key)?.delete(value);
    this.reverse._deleteFromReverse(value);
  }
  _removeFromReverse(key: K, value: V) {
    super.remove(key, value);
  }

  clear() {
    this.reverse._clearFromReverse();
    super.clear();
  }
  _clearFromReverse() {
    super.clear();
  }
}

const INVERSE_KEY = Symbol('inverse')
type MapWithInverseArgs<K, V> = ConstructorParameters<typeof Map<K, V>> | [{ [INVERSE_KEY]: MapWithInverse<V, K> }]
export class MapWithInverse<K, V> extends Map<K, V> {
  // `super.set` may be used in the Map constructor, so this may be initialized already
  _inverse: MapWithInverse<V, K>;
  get inverse() {
    return this._inverse;
  }

  constructor(...args: MapWithInverseArgs<K, V>) {
    if (args?.[0] && args?.[0][INVERSE_KEY]) { // constructing the INVERSE
      super();
      this._inverse = args[0][INVERSE_KEY];
    } else { // constructing the non-reverse
      super(...(args as ConstructorParameters<typeof Map<K, V>>));
      this._inverse = new MapWithInverse<V, K>({ [INVERSE_KEY]: this })
    }
  }

  set(key: K, value: V): this {
    if (!this._inverse) this._inverse = new MapWithInverse<V, K>();

    if (this.has(key)) this.inverse._deleteFromInverse(this.get(key) as V)
    if (this.inverse.has(value)) super.delete(this.inverse.get(value) as K)

    this.inverse._setFromInverse(value, key);
    super.set(key, value);

    return this;
  }
  protected _setFromInverse(key: K, value: V) {
    super.set(key, value);
  }
  delete(key: K): boolean {
    if (this.has(key)) this.inverse._deleteFromInverse(this.get(key) as V);
    return super.delete(key);
  }
  protected _deleteFromInverse(key: K) {
    return super.delete(key);
  }
  clear() {
    this.inverse._clearFromInverse();
    super.clear();
  }
  protected _clearFromInverse() {
    super.clear();
  }
}


// Could equivalently be called "AutomorphicMap" (https://en.wikipedia.org/wiki/Automorphism)
// A Set of `EndoMapWithInverse`s and an identity EndoMap generate a group.
export class EndoMapWithInverse<T> extends MapWithInverse<T, T> {
  _inverse: EndoMapWithInverse<T>;
  get inverse() {
    return this._inverse;
  }

  constructor(...args: MapWithInverseArgs<T, T>) {
    if (args?.[0]?.[INVERSE_KEY]) { // constructing the INVERSE
      super();
      this._inverse = args[0][INVERSE_KEY];
    } else { // constructing the non-reverse
      super(...(args as ConstructorParameters<typeof Map<T, T>>));
      this._inverse = new EndoMapWithInverse<T>({ [INVERSE_KEY]: this })
    }
  }
  set(key: T, value: T): this {
    if (!this._inverse) this._inverse = new EndoMapWithInverse<T>();

    return super.set(key, value);
  }

  *traverse(start: T): Generator<T> {
    const visited = new Set();
    let cur: T | undefined = start;
    while (cur) {
      yield cur;
      visited.add(cur);
      cur = this.get(cur);
    }
  }

  /** 
   * yields arrays, each array corresponding to a path in the graph.
   */
  *lines(): Generator<T[]> {
    const visited = new Set<T>();
    for (const [curC] of this) {
      if (visited.has(curC)) continue;

      visited.add(curC);
      const newLine: T[] = [curC];

      for (const c of skip(1, this.traverse(curC))) {
        if (visited.has(c)) break;
        newLine.push(c);
        visited.add(c);
      }
      for (const c of skip(1, this.inverse.traverse(curC))) {
        if (visited.has(c)) break;
        newLine.unshift(c);
        visited.add(c);
      }
      yield newLine;
    }
  }
}

// WANT TO HAVE:
// - MultiSet (Unordered set with duplicate elements, could be an array?)
// - CustomIdentitySet (Set with duplicateness determined by a function you pass in, could be a map to an "identity space" e.g. strings or number.)