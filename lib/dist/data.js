export class SetMap extends Map {
    add(key, value) {
        if (this.has(key)) {
            this.get(key).add(value);
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
const REVERSE_KEY = Symbol('reverse');
// A directed graph that keeps track of both the to and from connections between nodes.
export class SetMapWithReverse extends SetMap {
    // `super.set` may be used in the Map constructor, so this may be initialized already
    #reverse;
    get reverse() {
        return this.#reverse;
    }
    constructor(...args) {
        if (args?.[0] && args?.[0][REVERSE_KEY]) { // constructing the reverse
            super();
            this.#reverse = args[0][REVERSE_KEY];
        }
        else { // constructing the non-reverse
            super(...args);
            this.#reverse = new SetMapWithReverse({ [REVERSE_KEY]: this });
        }
    }
    add(key, value) {
        if (!this.#reverse)
            this.#reverse = new SetMapWithReverse({ [REVERSE_KEY]: this });
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
const g = new EndoSetMapWithReverse();
g.add('a', 'b');
g.add('a', 'c');
g.add('b', 'b2');
g.add('c', 'c2');
g.merge('x', 'b', 'c');
console.log('rea', g);
export class MapWithReverse extends Map {
    // `set` may be used in the Map constructor, so this may be initialized already
    valueToKeysMap = this.valueToKeysMap ?? new SetMap();
    teg(value) {
        return this.valueToKeysMap.get(value);
    }
    set(key, value) {
        if (!this.valueToKeysMap)
            this.valueToKeysMap = new SetMap();
        this.valueToKeysMap.remove(this.get(key), key);
        this.valueToKeysMap.add(value, key);
        super.set(key, value);
        return this;
    }
    delete(key) {
        this.valueToKeysMap.remove(this.get(key), key);
        return super.delete(key);
    }
    clear() {
        this.valueToKeysMap.clear();
        super.clear();
    }
}
