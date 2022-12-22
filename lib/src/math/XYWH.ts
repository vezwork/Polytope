import { clamp } from "./Number.js";
import { Vec2 } from "./Vec2.js";

export type XYWH = [number, number, number, number];

// adapted from https://gamedev.stackexchange.com/a/154040/159980
export function xBiasedDist([ax, ay, aw, ah]: XYWH, [bx, by, bw, bh]: XYWH) {
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
