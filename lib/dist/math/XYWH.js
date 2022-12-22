import { clamp } from "./Number.js";
// adapted from https://gamedev.stackexchange.com/a/154040/159980
export function xBiasedDist([ax, ay, aw, ah], [bx, by, bw, bh]) {
    const [rx1, ry1, rx2, ry2] = [
        Math.min(ax, bx),
        Math.min(ay, by),
        Math.max(ax + aw, bx + bw),
        Math.max(ay + ah, by + bh),
    ];
    const rw = rx2 - rx1;
    const rh = ry2 - ry1;
    const iw = Math.max(0, rw - aw - bw);
    const ih = Math.max(0, rh - ah - bh);
    return Math.sqrt(iw ** 2 + ih ** 4);
}
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
