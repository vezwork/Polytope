export function isPointInside([x, y], [bx, by, bw, bh]) {
    return x >= bx && x <= bx + bw && y >= by && y <= by + bh;
}
export function positive([bx, by, bw, bh]) {
    return [
        bw < 0 ? bx + bw : bx,
        bh < 0 ? by + bh : by,
        Math.abs(bw),
        Math.abs(bh),
    ];
}
