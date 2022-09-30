// https://codepen.io/vezwork/pen/XWZLBVr?editors=1010

import { EndoMapWithInverse } from "./data.js";
import { skip } from "./Iterable.js";

/**
 * https://developer.mozilla.org/en-US/docs/Web/CSS/CSSOM_View/Coordinate_systems#page
 *
 * number of pixels offset from the top left of the page.
 **/
type PagePixels = number;
/**
 * A caret sink represents a position that a caret could be in.
 */
export type CaretSink = {
  top: PagePixels;
  bottom: PagePixels;
  x: PagePixels;
};

/**
 * Given caret sinks, returns maps represented an undirected graph
 * (specifically a linear forest https://en.wikipedia.org/wiki/Linear_forest)
 * where each caret sink's neighbors vertically (but not horizontally!) overlap with it.
 *
 * adapted from: codepen.io/vezwork/pen/KKQjQVW
 */
export function horizontalNavMaps(
  caretSinks: CaretSink[]
): EndoMapWithInverse<CaretSink> {
  let nav = new EndoMapWithInverse<CaretSink>();

  for (const curC of caretSinks.sort((c1, c2) => c1.top - c2.top)) {
    const closestSink = caretSinks.reduce(
      (bestC: null | CaretSink, c: CaretSink) => {
        const isRight = c.x > curC.x;
        const isVerticalOverlapped =
          overlap([c.top, c.bottom], [curC.top, curC.bottom]) > 0;
        const isClosest = bestC === null || c.x < bestC.x;
        return isRight && isVerticalOverlapped && isClosest ? c : bestC;
      },
      null
    );

    if (closestSink !== null) nav.set(curC, closestSink);
    else if (!nav.inverse.has(curC)) nav.set(curC, curC);
  }
  return nav;
}

function overlap(
  [min1, max1]: [number, number],
  [min2, max2]: [number, number]
): number {
  return Math.max(0, Math.min(max1, max2) - Math.max(min1, min2));
}
