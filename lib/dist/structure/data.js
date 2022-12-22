import { skip } from "../Iterable.js";
export class SetMap extends Map {
    add(key, value) {
        if (this.has(key)) {
            this.get(key)?.add(value);
        }
        else {
            this.set(key, new Set([value]));
        }
        return this;
    }
    remove(key, value) {
        this.get(key)?.delete(value);
    }
}
const REVERSE_KEY = Symbol("reverse");
// A directed graph that keeps track of both the to and from connections between nodes.
export class SetMapWithReverse extends SetMap {
    // `super.set` may be used in the Map constructor, so this may be initialized already
    _reverse;
    get reverse() {
        return this._reverse;
    }
    constructor(...args) {
        if (args?.[0]?.[REVERSE_KEY]) {
            // constructing the reverse
            super();
            this._reverse = args[0][REVERSE_KEY];
        }
        else {
            // constructing the non-reverse
            super(...args);
            this._reverse = new SetMapWithReverse({ [REVERSE_KEY]: this });
        }
    }
    add(key, value) {
        // if (!this._reverse)
        //   this._reverse = new SetMapWithReverse<V, K>({ [REVERSE_KEY]: this });
        super.add(key, value);
        this.reverse._addFromReverse(value, key);
        return this;
    }
    _addFromReverse(key, value) {
        super.add(key, value);
    }
    remove(key, value) {
        super.remove(key, value);
        this.reverse._removeFromReverse(value, key);
    }
    _removeFromReverse(key, value) {
        super.remove(key, value);
    }
    delete(key) {
        for (const value of this.get(key) ?? [])
            this.reverse._removeFromReverse(value, key);
        return super.delete(key);
    }
    _deleteFromReverse(key) {
        return super.delete(key);
    }
    clear() {
        super.clear();
        this.reverse._clearFromReverse();
    }
    _clearFromReverse() {
        super.clear();
    }
    replaceKey(key, replacementKey) {
        for (const value of this.get(key) ?? [])
            this.add(replacementKey, value);
        this.delete(key);
    }
    replaceValue(value, replacementValue) {
        this.reverse.replaceKey(value, replacementValue);
    }
}
// Endo is shorted for "endomorphic" which means the underlying SetMap maps from a type T to itself
export class EndoSetMapWithReverse extends SetMapWithReverse {
    _reverse;
    get reverse() {
        return this._reverse;
    }
    constructor(...args) {
        if (args?.[0]?.[REVERSE_KEY]) {
            // constructing the reverse
            super();
            this._reverse = args[0][REVERSE_KEY];
        }
        else {
            // constructing the non-reverse
            super(...args);
            this._reverse = new EndoSetMapWithReverse({ [REVERSE_KEY]: this });
        }
    }
    *traverseBreadthFirst(start) {
        const toVisit = [start];
        const visited = new Set();
        while (toVisit.length > 0) {
            const cur = toVisit.pop();
            visited.add(cur);
            for (const next of this.get(cur) ?? []) {
                if (!visited.has(next))
                    toVisit.push(next);
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
                if (key !== reachableKey)
                    this.add(key, reachableKey);
    }
    hasPathBetween(key, value) {
        for (const reachableKey of this.traverseBreadthFirst(key))
            if (reachableKey === value)
                return true;
        return false;
    }
    hasPathOrReversePathBetween(key, value) {
        return (this.hasPathBetween(key, value) || this.reverse.hasPathBetween(key, value));
    }
    merge(resultKey, ...mergeKeys) {
        for (const key of mergeKeys) {
            this.replaceKey(key, resultKey);
            this.replaceValue(key, resultKey);
        }
    }
    static FromBinaryRelation(objects, rel) {
        const graph = new EndoSetMapWithReverse();
        for (const object of objects)
            for (const otherObject of objects)
                if (rel(object, otherObject))
                    graph.add(object, otherObject);
        return graph;
    }
}
export class MapWithReverse extends Map {
    // `super.set` may be used in the Map constructor, so this may be initialized already
    _reverse;
    get reverse() {
        return this._reverse;
    }
    constructor(...args) {
        if (args?.[0]?.[REVERSE_KEY]) {
            // constructing the reverse
            super();
            this._reverse = args[0][REVERSE_KEY];
        }
        else {
            // constructing the non-reverse
            super(...args);
            this._reverse = new ReverseMap({ [REVERSE_KEY]: this });
        }
    }
    set(key, value) {
        if (!this._reverse)
            this._reverse = new ReverseMap();
        if (this.has(key))
            this.reverse.remove(this.get(key), key);
        this.reverse._addFromReverse(value, key);
        super.set(key, value);
        return this;
    }
    _setFromReverse(key, value) {
        super.set(key, value);
    }
    delete(key) {
        if (this.has(key))
            this.reverse._removeFromReverse(this.get(key), key);
        return super.delete(key);
    }
    _deleteFromReverse(key) {
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
// this is the same as a SetMap except that it has a reverse and cannot have the same value in more than one set.
export class ReverseMap extends SetMap {
    // `super.set` may be used in the Map constructor, so this may be initialized already
    _reverse;
    get reverse() {
        return this._reverse;
    }
    constructor(...args) {
        if (args?.[0] && args?.[0][REVERSE_KEY]) {
            // constructing the reverse
            super();
            this._reverse = args[0][REVERSE_KEY];
        }
        else {
            // constructing the non-reverse
            super(...args);
            this._reverse = new MapWithReverse({ [REVERSE_KEY]: this });
        }
    }
    // should have set and delete too
    add(key, value) {
        super.add(key, value);
        this.reverse._setFromReverse(value, key);
        return this;
    }
    _addFromReverse(key, value) {
        super.add(key, value);
    }
    remove(key, value) {
        this.get(key)?.delete(value);
        this.reverse._deleteFromReverse(value);
    }
    _removeFromReverse(key, value) {
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
const INVERSE_KEY = Symbol("inverse");
export class MapWithInverse extends Map {
    // `super.set` may be used in the Map constructor, so this may be initialized already
    _inverse;
    get inverse() {
        return this._inverse;
    }
    constructor(...args) {
        if (args?.[0] && args?.[0][INVERSE_KEY]) {
            // constructing the INVERSE
            super();
            this._inverse = args[0][INVERSE_KEY];
        }
        else {
            // constructing the non-reverse
            super(...args);
            this._inverse = new MapWithInverse({ [INVERSE_KEY]: this });
        }
    }
    set(key, value) {
        if (!this._inverse)
            this._inverse = new MapWithInverse();
        if (this.has(key))
            this.inverse._deleteFromInverse(this.get(key));
        if (this.inverse.has(value))
            super.delete(this.inverse.get(value));
        this.inverse._setFromInverse(value, key);
        super.set(key, value);
        return this;
    }
    _setFromInverse(key, value) {
        super.set(key, value);
    }
    delete(key) {
        if (this.has(key))
            this.inverse._deleteFromInverse(this.get(key));
        return super.delete(key);
    }
    _deleteFromInverse(key) {
        return super.delete(key);
    }
    clear() {
        this.inverse._clearFromInverse();
        super.clear();
    }
    _clearFromInverse() {
        super.clear();
    }
}
// Could equivalently be called "AutomorphicMap" (https://en.wikipedia.org/wiki/Automorphism)
// A Set of `EndoMapWithInverse`s and an identity EndoMap generate a group.
export class EndoMapWithInverse extends MapWithInverse {
    _inverse;
    get inverse() {
        return this._inverse;
    }
    constructor(...args) {
        if (args?.[0]?.[INVERSE_KEY]) {
            // constructing the INVERSE
            super();
            this._inverse = args[0][INVERSE_KEY];
        }
        else {
            // constructing the non-reverse
            super(...args);
            this._inverse = new EndoMapWithInverse({ [INVERSE_KEY]: this });
        }
    }
    set(key, value) {
        if (!this._inverse)
            this._inverse = new EndoMapWithInverse();
        return super.set(key, value);
    }
    *traverse(start) {
        const visited = new Set();
        let cur = start;
        while (cur) {
            yield cur;
            visited.add(cur);
            cur = this.get(cur);
        }
    }
    /**
     * yields arrays, each array corresponding to a path in the graph.
     */
    *lines() {
        const visited = new Set();
        for (const [curC] of this) {
            if (visited.has(curC))
                continue;
            visited.add(curC);
            const newLine = [curC];
            for (const c of skip(1, this.traverse(curC))) {
                if (visited.has(c))
                    break;
                newLine.push(c);
                visited.add(c);
            }
            for (const c of skip(1, this.inverse.traverse(curC))) {
                if (visited.has(c))
                    break;
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
