export function findIndex2D(array2D, predicate) {
    return array2D.reduce((acc, line, i) => {
        const foundIndex = line.findIndex(predicate);
        if (foundIndex !== -1)
            return [i, foundIndex];
        else
            return acc;
    }, [-1, -1]);
}
export function compareIndex2D(i1, i2) {
    if (i1[0] < i2[0])
        return -1;
    if (i1[0] === i2[0]) {
        if (i1[1] < i2[1])
            return -1;
        if (i1[1] === i2[1])
            return 0;
        return 1;
    }
    return 1;
}
// finds the maximum valued element
export function max(els, valueOf) {
    return sortFirst(els, (el1, el2) => valueOf(el1) - valueOf(el2));
}
export function min(els, valueOf) {
    return sortFirst(els, (el1, el2) => valueOf(el2) - valueOf(el1));
}
// the same as sort, but just takes the first element. Linear time.
// 0 represents "equal", >0 means el1 > el2, <0 means el2 > el2
export function sortFirst(els, compare) {
    return els.reduce((acc, el) => (acc === null || compare(el, acc) > 0 ? el : acc), null);
}
