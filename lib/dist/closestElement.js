import { clamp } from "./math/Number.js";
export function closestElementBelow(el, otherEls, carryX) {
    return reduceElsToClosestEl(el, otherEls, (rect, otherRect) => {
        if (otherRect.top < rect.bottom)
            return Infinity;
        return yBiasedManhattanDist([carryX ?? rect.right, rect.bottom], closestPointOnBounds([carryX ?? rect.right, rect.bottom], otherRect));
    }).closestEl;
}
export function closestElementAbove(el, otherEls, carryX) {
    return reduceElsToClosestEl(el, otherEls, (rect, otherRect) => {
        if (rect.top < otherRect.bottom)
            return Infinity;
        return yBiasedManhattanDist([carryX ?? rect.right, rect.top], closestPointOnBounds([carryX ?? rect.right, rect.top], otherRect));
    }).closestEl;
}
export function closestElementToPosition(el, otherEls, position) {
    const { closestEl, closestDistance } = reduceElsToClosestEl(el, otherEls, (_, otherRect) => yBiasedManhattanDist(position, closestPointOnBounds(position, otherRect)));
    const elBounds = el.getBoundingClientRect();
    const distToRightSideOfEl = yBiasedManhattanDist(position, closestPointOnBounds(position, {
        top: elBounds.top,
        right: elBounds.right,
        bottom: elBounds.bottom,
        left: elBounds.right - 1,
    }));
    return distToRightSideOfEl < closestDistance ? el : closestEl;
}
function reduceElsToClosestEl(el, otherEls, distanceBetween) {
    // mild spatial nav
    const elBounds = el.getBoundingClientRect();
    const otherElsWithBounds = otherEls.map((otherEl) => ({
        otherEl,
        otherElBounds: otherEl.getBoundingClientRect(),
    }));
    let closestDistance = Infinity;
    let closestEl = null;
    for (const { otherEl, otherElBounds } of otherElsWithBounds) {
        const d = distanceBetween(elBounds, otherElBounds);
        if (d < closestDistance) {
            closestDistance = d;
            closestEl = otherEl;
        }
    }
    return { closestEl, closestDistance };
}
function yBiasedManhattanDist([x1, y1], [x2, y2]) {
    return Math.abs(x1 - x2) * 2 + Math.abs(y1 - y2);
}
function closestPointOnBounds([x, y], { top, right, bottom, left, }) {
    return [clamp(left, x, right), clamp(top, y, bottom)];
}
