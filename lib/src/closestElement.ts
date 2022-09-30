import { clamp } from "./math/Number.js";

export function closestElementBelow<Element extends HTMLElement>(
  el: Element,
  otherEls: Element[],
  carryX: number | null
): Element | null {
  return reduceElsToClosestEl(el, otherEls, (rect, otherRect) => {
    if (otherRect.top < rect.bottom) return Infinity;

    return yBiasedManhattanDist(
      [carryX ?? rect.right, rect.bottom],
      closestPointOnBounds([carryX ?? rect.right, rect.bottom], otherRect)
    );
  }).closestEl;
}
export function closestElementAbove<Element extends HTMLElement>(
  el: Element,
  otherEls: Element[],
  carryX: number | null
): Element | null {
  return reduceElsToClosestEl(el, otherEls, (rect, otherRect) => {
    if (rect.top < otherRect.bottom) return Infinity;

    return yBiasedManhattanDist(
      [carryX ?? rect.right, rect.top],
      closestPointOnBounds([carryX ?? rect.right, rect.top], otherRect)
    );
  }).closestEl;
}

export function closestElementToPosition<Element extends HTMLElement>(
  el: Element,
  otherEls: Element[],
  position: [number, number]
): Element | null {
  const { closestEl, closestDistance } = reduceElsToClosestEl(
    el,
    otherEls,
    (_, otherRect) =>
      yBiasedManhattanDist(position, closestPointOnBounds(position, otherRect))
  );
  const elBounds = el.getBoundingClientRect();
  const distToRightSideOfEl = yBiasedManhattanDist(
    position,
    closestPointOnBounds(position, {
      top: elBounds.top,
      right: elBounds.right,
      bottom: elBounds.bottom,
      left: elBounds.right - 1,
    })
  );
  return distToRightSideOfEl < closestDistance ? el : closestEl;
}

function reduceElsToClosestEl<Element extends HTMLElement>(
  el: Element,
  otherEls: Element[],
  distanceBetween: (rect: DOMRect, otherRect: DOMRect) => number
): { closestEl: Element | null; closestDistance: number } {
  // mild spatial nav
  const elBounds = el.getBoundingClientRect();
  const otherElsWithBounds = otherEls.map((otherEl) => ({
    otherEl,
    otherElBounds: otherEl.getBoundingClientRect(),
  }));

  let closestDistance = Infinity;
  let closestEl: Element | null = null;
  for (const { otherEl, otherElBounds } of otherElsWithBounds) {
    const d = distanceBetween(elBounds, otherElBounds);
    if (d < closestDistance) {
      closestDistance = d;
      closestEl = otherEl;
    }
  }

  return { closestEl, closestDistance };
}

function yBiasedManhattanDist(
  [x1, y1]: [number, number],
  [x2, y2]: [number, number]
) {
  return Math.abs(x1 - x2) * 2 + Math.abs(y1 - y2);
}

function closestPointOnBounds(
  [x, y]: [number, number],
  {
    top,
    right,
    bottom,
    left,
  }: { top: number; right: number; bottom: number; left: number }
): [number, number] {
  return [clamp(left, x, right), clamp(top, y, bottom)];
}
