/**
 * motivation: Dec 20 2022: editor.ts currently implements a lot of
 * tree functionality that could be abstracted away for more expressiveness when adding new things
 * and to make editor.ts easier to read. Also, it would be nice to decouple the data
 * (editors) from how it is processed (tree functions). The method for decoupling
 * these is to input a `parent` and `children` function to output the tree functions
 * so that no matter what data structure is used, you can use these tree functions.
 * The challenge with this is that data structure and processing are implicitly coupled
 * by performance. I won't worry about that for now, expressiveness is #1 for now!
 *
 */
import * as Fn from "../Functions.js";
import * as Iter from "../Iterable.js";
export function makeTreeFunctions({ parent, children, }) {
    const descendentsDepthFirst = function* (t) {
        yield* Iter.flatMap(children(t), descendentsDepthFirst);
        yield t;
    };
    const descendentsBreadthFirst = function* (t) {
        yield t;
        yield* Iter.flatMap(children(t), descendentsBreadthFirst);
    };
    const siblings = (t) => {
        const par = parent(t);
        if (par === null)
            return null;
        return Iter.filter(children(par), Fn.neq(t));
    };
    const ancestors = (t) => Iter.recurse(parent, t, Fn.eq(null));
    const nodeAndAncestors = (t) => Iter.concat([t], ancestors(t));
    const root = (t) => Iter.last(Iter.concat([t], ancestors(t)));
    const hasParent = (t) => parent(t) !== null;
    const hasChildren = (t) => !Iter.isEmpty(children(t));
    const isRoot = (t) => !hasParent(t);
    const isLeaf = (t) => !hasChildren(t);
    const compareAncestry = (t1, t2) => {
        if (t1 === t2)
            return "=";
        if (Iter.some(ancestors(t2), Fn.eq(t1)))
            return ">";
        if (Iter.some(ancestors(t1), Fn.eq(t2)))
            return "<";
        return "!";
    };
    const lowestCommonAncestor = (t1, t2) => {
        for (const [a1, path1] of Iter.withHistory(nodeAndAncestors(t1)))
            for (const [a2, path2] of Iter.withHistory(nodeAndAncestors(t2)))
                if (a1 === a2)
                    return { common: a1, path1, path2 };
        return null;
    };
    const compareOrder = (t1, t2) => {
        if (t1 === t2)
            return "=";
        const { common, path1, path2 } = lowestCommonAncestor(t1, t2) ?? {};
        if (!common)
            return "!";
        for (const child of children(common)) {
            if (child === path1?.at(-1))
                return ">"; // t1 rep comes first
            if (child === path2?.at(-1))
                return "<"; // t2 rep comes first
        }
        console.error("tree.ts: compareOrder: bad code path");
        return "!"; // should be impossible code path
    };
    const superParent = (filter) => (t) => Iter.find(ancestors(t), filter);
    const superChildrenHelper = (filter) => function* (t) {
        if (filter(t)) {
            yield t;
        }
        else {
            yield* Iter.flatMap(children(t), superChildrenHelper(filter));
        }
    };
    const superChildren = (filter) => function* (t) {
        yield* Iter.flatMap(children(t), superChildrenHelper(filter));
    };
    return {
        descendentsDepthFirst,
        descendentsBreadthFirst,
        siblings,
        ancestors,
        root,
        hasParent,
        hasChildren,
        isRoot,
        isLeaf,
        compareAncestry,
        lowestCommonAncestor,
        compareOrder,
        superParent,
        superChildren,
    };
    // future work: helpers... NO, JUST USE ITERABLE HELPERS
    //const every = 0;
    //const some = 0;
    //const find = 0;
    // future work?: mutations
    //const map = 0;
    //const filter = 0;
    //const insert = 0;
    //const remove = 0;
}
