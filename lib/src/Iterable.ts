export const historyArray = function* (number, iterable) {
    let history = Array(number);
    for (const result of iterable) {
        history = [result, ...history];
        history.length = number;
        yield history;
    }
};
export const range = function* (start, end, step = 1) {
    for (let n = start; n < end; n += step) {
        yield n;
    }
};
export const take = function* (number, iterable) {
    let i = 0;
    for (const item of iterable) {
        i++;
        if (i > number) break;
        yield item;
    }
};
export const first = (iterable) => Array.from(take(1, iterable))[0];
export const skip = function* (number, iterable) {
    let i = 0;
    for (const item of iterable) {
        i++;
        if (i <= number) continue;
        yield item;
    }
};
export const map = function* (iterable, func) {
    for (const item of iterable) yield func(item);
};
export const some = function (iterable, func) {
    for (const item of iterable) {
        if (func(item)) return true;
    }
    return false;
};
export const withIndex = function* (iterable) {
    let i = 0;
    for (const item of iterable) {
        yield [item, i];
        i++;
    }
}
