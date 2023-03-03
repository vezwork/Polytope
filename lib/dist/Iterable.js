export const withHistory = function* (iterable) {
    let history = [];
    for (const item of iterable) {
        yield [item, history];
        history.push(item);
    }
};
export const historyArray = function* (iterable, number = Infinity) {
    let history = Array(number);
    for (const result of iterable) {
        history = [result, ...history];
        history.length = number;
        yield history;
    }
};
export const take = function* (number, iterable) {
    let i = 0;
    for (const item of iterable) {
        i++;
        if (i > number)
            break;
        yield item;
    }
};
export function* concat(i1, i2) {
    for (const item of i1)
        yield item;
    for (const item of i2)
        yield item;
}
export const isEmpty = (iterable) => {
    for (const _ of iterable)
        return false;
    return true;
};
export const first = (iterable) => {
    for (const i of iterable)
        return i;
};
export const last = (iterable) => {
    let l = undefined;
    for (const i of iterable)
        l = i;
    return l;
};
export const skip = function* (number, iterable) {
    let i = 0;
    for (const item of iterable) {
        i++;
        if (i <= number)
            continue;
        yield item;
    }
};
export const map = function* (iterable, func) {
    for (const item of iterable)
        yield func(item);
};
export const flatMap = function* (iterable, gen) {
    for (const item of iterable)
        yield* gen(item);
};
export const some = function (iterable, predicate) {
    for (const item of iterable) {
        if (predicate(item))
            return true;
    }
    return false;
};
export const filter = function* (iterable, func) {
    for (const item of iterable)
        if (func(item))
            yield item;
};
export const withIndex = function* (iterable) {
    let i = 0;
    for (const item of iterable) {
        yield [item, i];
        i++;
    }
};
export const find = (iterable, predicate) => {
    for (const item of iterable)
        if (predicate(item))
            return item;
    return null;
};
export const indexOf = (iterable, predicate) => {
    for (const [item, i] of withIndex(iterable))
        if (predicate(item, i))
            return i;
    return null;
};
// non iteratable inputs:
export function* pairs(l) {
    for (let i = 0; i < l.length - 1; i++)
        yield [l[i], l[i + 1]];
}
export const range = function* (start, end, step = 1) {
    for (let n = start; n < end; n += step) {
        yield n;
    }
};
// iterable outputs:
export function* recurse(func, initialInput, shouldStopRecursing) {
    let curInput = initialInput;
    while (true) {
        const nextInput = func(curInput);
        if (shouldStopRecursing(nextInput))
            return;
        curInput = nextInput;
        yield curInput;
    }
}
