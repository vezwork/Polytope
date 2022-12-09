import { pairs } from "../Iterable.js";
import { clamp } from "./Number.js";
import { add, mul, sub, dot, basisProj } from "./Vec2.js";
// can be thought of as a lens `lens(vecInSeg)(seg)(rMul(t))`
export const lerp = ([start, end]) => (t) => add(start, mul(t, sub(end, start)));
export const boundedLerp = (seg) => (t) => lerp(seg)(clamp(0, t, 1));
/**
 * e.g.
 * ```
 * const pFromN = lerp(lineSegment)
 * const nFromP = coLerp(lineSegment)
 * nFromP(pFromN(0.5)) === 0.5
 * ```
 *
 * For `p` not on the segment, gives `t` such that `distance(p, lerp(seg)(t))` is minimized.
 */
export const coLerp = ([start, end]) => (p) => basisProj(sub(end, start))(sub(p, start));
// can be thought of as some sort of composed lens? `lens([v, p], [xInVec, xInVec], ([x1, x2]) => x1 === 0 ? 0 : x2/x1)`
const thing = (v) => (p) => v[0] === 0 ? 0 : p[0] / v[0];
export const segXProj = (seg) => (p) => boundedLerp(seg)(thing(sub(seg[1], seg[0]))(sub(p, seg[0])));
export const segLeft = ([p1, p2]) => (p1[0] > p2[0] ? p1 : p2);
export const segRight = ([p1, p2]) => (p1[0] < p2[0] ? p1 : p2);
// reference: https://stackoverflow.com/a/6853926/5425899
// StackOverflow answer license: CC BY-SA 4.0
// Gives the shortest Vec2 from the point v to the line segment.
export const subLineSegment = (v, [start, end]) => {
    const startToV = sub(v, start);
    const startToEnd = sub(end, start);
    const lengthSquared = dot(startToEnd, startToEnd);
    const parametrizedLinePos = lengthSquared === 0
        ? -1
        : Math.max(0, Math.min(1, dot(startToV, startToEnd) / lengthSquared));
    const closestPointOnLine = lerp([start, end])(parametrizedLinePos);
    return sub(v, closestPointOnLine);
};
// warn: may fail for 1 and 0 point lines?
export function isAbove(l1, l2) {
    if (l1.length === 1 && l2.length === 1)
        return l1[0][1] < l2[0][1];
    // find point p in line 1 that is x-between two points in line 2
    for (const p of l1) {
        for (const l2Seg of pairs(l2)) {
            if (!isAside([p], l2Seg)) {
                // then check if p is above the line between the two points
                const f = lineFnFromTwoPoints(...l2Seg);
                if (p[1] < f(p[0]))
                    return true;
                return false;
            }
        }
    }
    // find point p in line 2 that is x-between two points in line 1
    for (const p of l2) {
        for (const l1Seg of pairs(l1)) {
            if (!isAside([p], l1Seg)) {
                // then check if p is below the line between the two points
                const f = lineFnFromTwoPoints(...l1Seg);
                if (p[1] > f(p[0]))
                    return true;
                return false;
            }
        }
    }
    return false;
}
export function isAside(l1, l2) {
    return isRight(l1, l2) || isLeft(l1, l2);
}
// is l2 right of l1 ?
export function isRight(l1, l2) {
    if (l1.length === 0 || l2.length === 0)
        return true;
    return l1.at(-1)[0] < l2[0][0];
}
export function isLeft(l1, l2) {
    return isRight(l2, l1);
}
export function segmentBetween(l1, l2) {
    if (l1.length === 0 || l2.length === 0)
        return null;
    return (isRight(l1, l2) ? [l1.at(-1), l2.at(0)] : [l2.at(-1), l1.at(0)]);
}
export function merge(l1, l2) {
    return isRight(l1, l2) ? [...l1, ...l2] : [...l2, ...l1];
}
export function lineFnFromTwoPoints([x1, y1], [x2, y2]) {
    const m = (y2 - y1) / (x2 - x1);
    const b = y2 - m * x2;
    return (x) => m * x + b;
}
// reference: https://stackoverflow.com/a/16725715/5425899
// StackOverflow answer license: CC BY-SA 3.0
export function turn(p1, p2, p3) {
    const a = p1[0];
    const b = p1[1];
    const c = p2[0];
    const d = p2[1];
    const e = p3[0];
    const f = p3[1];
    const A = (f - b) * (c - a);
    const B = (d - b) * (e - a);
    return A > B + Number.EPSILON ? 1 : A + Number.EPSILON < B ? -1 : 0;
}
export function areSegmentsIntersecting([p1, p2], [p3, p4]) {
    return (turn(p1, p3, p4) != turn(p2, p3, p4) && turn(p1, p2, p3) != turn(p1, p2, p4));
}
export function areIntersecting(l1, l2) {
    for (const l1Segment of pairs(l1))
        for (const l2Segment of pairs(l2))
            if (areSegmentsIntersecting(l1Segment, l2Segment))
                return true;
    return false;
}
