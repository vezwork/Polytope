export function findIndex2D(array2D, predicate) {
    return array2D.reduce((acc, line, i) => {
        const foundIndex = line.findIndex(predicate);
        if (foundIndex !== -1)
            return [i, foundIndex];
        else
            return acc;
    }, [-1, -1]);
}
export function max(els, valueOf) {
    return sortFirst(els, (el1, el2) => valueOf(el1) - valueOf(el2));
}
// the same as sort, but just takes the first element. Linear time.
export function sortFirst(els, compare) {
    return els.reduce((acc, el) => (acc === null || compare(el, acc) ? el : acc), null);
}
