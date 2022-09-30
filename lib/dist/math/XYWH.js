import { clamp } from "./Number.js";
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
export function closestPointOnBox([x, y], box) {
    const [bx, by, bw, bh] = positive(box);
    return [clamp(bx + bw, x, bx), clamp(by, y, by + bh)];
}
