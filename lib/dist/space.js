// https://codepen.io/vezwork/pen/XWZLBVr?editors=1010
import { EndoMapWithInverse } from "./data.js";
/**
 * Given caret sinks, returns maps represented an undirected graph
 * (specifically a linear forest https://en.wikipedia.org/wiki/Linear_forest)
 * where each caret sink's neighbors vertically (but not horizontally!) overlap with it.
 *
 * adapted from: codepen.io/vezwork/pen/KKQjQVW
 */
export function horizontalNavMaps(caretSinks) {
    let nav = new EndoMapWithInverse();
    for (const curC of caretSinks.sort((c1, c2) => c1.top - c2.top)) {
        const closestSink = caretSinks.reduce((bestC, c) => {
            const isRight = c.x > curC.x;
            const isVerticalOverlapped = overlap([c.top, c.bottom], [curC.top, curC.bottom]) > 0;
            const isClosest = bestC === null || c.x < bestC.x;
            return isRight && isVerticalOverlapped && isClosest ? c : bestC;
        }, null);
        if (closestSink !== null)
            nav.set(curC, closestSink);
        else if (!nav.inverse.has(curC))
            nav.set(curC, curC);
    }
    return nav;
}
function overlap([min1, max1], [min2, max2]) {
    return Math.max(0, Math.min(max1, max2) - Math.max(min1, min2));
}
