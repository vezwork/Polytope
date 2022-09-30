import { clamp } from "./Number.js";
import { angleOf, Vec2, distance as dist } from "./Vec2.js";

export type XYWH = [number, number, number, number];

export function isPointInside([x, y]: Vec2, [bx, by, bw, bh]: XYWH): boolean {
  return x >= bx && x <= bx + bw && y >= by && y <= by + bh;
}

export function positive([bx, by, bw, bh]: XYWH): XYWH {
  return [
    bw < 0 ? bx + bw : bx,
    bh < 0 ? by + bh : by,
    Math.abs(bw),
    Math.abs(bh),
  ];
}

export function closestPointOnBox([x, y]: Vec2, box: XYWH): Vec2 {
  const [bx, by, bw, bh] = positive(box);
  return [clamp(bx + bw, x, bx), clamp(by, y, by + bh)];
}
