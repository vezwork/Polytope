import { clamp } from "./math.js";
export function elementBelow(el, otherEls, carryX) {
    return reduceElsToClosestEl(el, otherEls, (rect, otherRect) => {
        if (rect.bottom < otherRect.top || rect === otherRect)
            return Infinity;
        return yBiasedManhattanDist([carryX ?? rect.right, rect.bottom], closestPointOnBounds([carryX ?? rect.right, rect.bottom], otherRect));
    });
}
export function elementAbove(el, otherEls, carryX) {
    return reduceElsToClosestEl(el, otherEls, (rect, otherRect) => {
        if (rect.top > otherRect.bottom || rect === otherRect)
            return Infinity;
        return yBiasedManhattanDist([carryX ?? rect.right, rect.top], closestPointOnBounds([carryX ?? rect.right, rect.top], otherRect));
    });
}
function reduceElsToClosestEl(el, otherEls, dist) {
    // mild spatial nav
    const elBounds = el.getBoundingClientRect();
    const otherElsWithBounds = otherEls.map((otherEl) => ({
        otherEl,
        otherElBounds: otherEl.getBoundingClientRect(),
    }));
    let closestDist = Infinity;
    let closestOtherEl = null;
    for (const { otherEl, otherElBounds } of otherElsWithBounds) {
        const d = dist(elBounds, otherElBounds);
        if (d < closestDist) {
            closestDist = d;
            closestOtherEl = otherEl;
        }
    }
    return closestOtherEl;
}
function yBiasedManhattanDist([x1, y1], [x2, y2]) {
    return Math.abs(x1 - x2) * 2 + Math.abs(y1 - y2);
}
function closestPointOnBounds([x, y], { top, right, bottom, left, }) {
    return [clamp(left, x, right), clamp(top, y, bottom)];
}
