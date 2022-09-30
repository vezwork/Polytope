import { pairs } from "./Iterable.js";
import { distance as dist, Vec2 } from "./math/Vec2.js";
import { Line2, areIntersecting } from "./math/Line2.js";
import { mergeAndSortLines } from "./math/Line2MergeAndSort.js";

const c = document.getElementById("c") as HTMLCanvasElement;
const ctx = c.getContext("2d") as CanvasRenderingContext2D;

let lines: Line2[] = [];

c.addEventListener("mousedown", (e) => {
  if (!lines.at(-1)) lines.push([]);
  const newLine = lines.at(-1);
  const newestPoint = newLine?.at(-1);
  const addPoint = [e.offsetX, e.offsetY] as Vec2;
  const isLineEmpty = newestPoint?.[0] === undefined;
  if (
    isLineEmpty ||
    (addPoint[0] > newestPoint[0] &&
      lines.every(
        (l) => l === newLine || !areIntersecting([newestPoint, addPoint], l)
      ))
  )
    newLine?.push(addPoint);
});
window.addEventListener("keydown", (e) => {
  if (e.key === "n" && (lines.at(-1)?.length ?? 0) > 0) lines.push([]);
});

document.getElementById("reset")?.addEventListener("click", (e) => {
  lines = [[]];
});

let t = 0;
function draw() {
  t++;
  ctx.clearRect(0, 0, c.width, c.height);

  const mergedAndOrderedLines = mergeAndSortLines(lines);
  for (const [la, lb] of pairs(mergedAndOrderedLines)) {
    ctx.beginPath();
    if (la.length === 0 || lb.length === 0) continue;
    for (const p1 of la) {
      const closest = lb.reduce(
        (acc, p) =>
          dist(p1, p) < acc.dist ? { dist: dist(p1, p), point: p } : acc,
        { dist: Infinity, point: null } as {
          dist: number;
          point: Vec2 | null;
        }
      );
      if (closest.point) {
        ctx.strokeStyle = "YellowGreen";
        ctx.moveTo(...p1);
        ctx.lineTo(...closest.point);
        ctx.stroke();
      }
    }
  }
  for (let i = 0; i < mergedAndOrderedLines.length; i++) {
    const line = mergedAndOrderedLines[i];

    ctx.strokeStyle = "SkyBlue";
    ctx.beginPath();
    for (const point of line) {
      ctx.lineTo(...point);
      ctx.fillRect(...point, 3, 3);
    }
    if (line.length > 0) {
      ctx.fillText(String(i), ...(line.at(0) as Vec2));
    }
    ctx.stroke();
    ctx.strokeStyle = "black";
  }

  for (const line of lines) {
    ctx.beginPath();
    for (const point of line) {
      ctx.lineTo(...point);
      ctx.fillRect(...point, 3, 3);
    }
    if (line.length > 0) ctx.fillRect(...(line.at(-1) as Vec2), 5, 5);
    ctx.stroke();
  }

  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
