import { isPointInside, positive, XYWH } from "./math/XYWH.js";
import { findIndex2D, min } from "./Arrays.js";
import { makeMergeAndSortLines } from "./math/LineMerge.js";
import { make2DLineFunctions } from "./math/LineT.js";
import { axisAlignedIntervalDist } from "./math/NumberInterval.js";
import { segProj } from "./math/Line2.js";
import { EndoSetMapWithReverse } from "./data.js";

const c = document.getElementById("c") as HTMLCanvasElement;
const ctx = c.getContext("2d") as CanvasRenderingContext2D;

const mouse: [number, number] = [0, 0];
let isMouseDown = false;

let boxes: XYWH[] = [];
let curCreateBox: XYWH | null = null;

document.getElementById("reset")?.addEventListener("click", () => (boxes = []));

c.addEventListener("mousemove", (e) => {
  mouse[0] = e.offsetX;
  mouse[1] = e.offsetY;
});
c.addEventListener("mousedown", (e) => {
  if (e.button === 0) isMouseDown = true;
});
c.addEventListener("mouseup", (e) => {
  if (e.button === 0) isMouseDown = false;
});

function draw() {
  ctx.clearRect(0, 0, c.width, c.height);

  if (isMouseDown) {
    if (!curCreateBox) {
      curCreateBox = [...mouse, 0, 0] as XYWH;
    } else {
      curCreateBox[2] = mouse[0] - curCreateBox[0];
      curCreateBox[3] = mouse[1] - curCreateBox[1];
      curCreateBox = positive(curCreateBox);
    }
  } else {
    if (curCreateBox) {
      boxes.push(curCreateBox);
      curCreateBox = null;
    }
  }
  ctx.fillStyle = "red";
  for (const box of boxes) ctx.fillRect(...box);

  for (const box of boxes) {
    ctx.strokeStyle = "black";
    const nextBox = next(box, boxes);
    if (nextBox) {
      ctx.beginPath();
      ctx.moveTo(box[0], box[1]);
      ctx.lineTo(top(nextBox)[0], top(nextBox)[1]);
      ctx.stroke();
    }
    ctx.strokeStyle = "YellowGreen";
    const belowBox = below(box, boxes);
    if (belowBox) {
      ctx.beginPath();
      ctx.moveTo(box[0], box[1]);
      ctx.lineTo(top(belowBox)[0], top(belowBox)[1]);
      ctx.stroke();
    }
  }

  if (curCreateBox) ctx.fillRect(...curCreateBox);

  ctx.fillRect(...mouse, 5, 5);

  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);

type YInterval = {
  n: number;
  interval: [number, number];
  data?: XYWH;
};

function next(box: XYWH, boxes: XYWH[]): YInterval | null {
  const { lines, index } = linesAndIndex(box, boxes);

  return lines[index[0]]?.[index[1] + 2] ?? null;
}

function below(box: XYWH, boxes: XYWH[]): YInterval | null {
  const { lines, index } = linesAndIndex(box, boxes);

  const nextLine = lines[index[0] + 1] ?? [];
  return min(nextLine, (caretSink) => Math.abs(box[0] - caretSink.n)) ?? null;
}

const top = ({ n, interval: [top, _] }: YInterval): [number, number] => [
  n,
  top,
]; // assuming interval[0] is top, which is not enforced
const yIntervalFromTop = ([n, top]: [number, number]): YInterval => ({
  n,
  interval: [top, top],
});

// const vec2FromYInterval = top
// const yIntervalFromVec2 = yIntervalFromTop
// const line2FromYIntervals = (yIntervals: YInterval[]) => yIntervals.map(vec2FromYInterval)
// const yIntervalsFromLine2 = (line2: [number, number][]) => line2.map(yIntervalFromVec2)

// what if a function could take an object of a type or any type equivalent to it?
// equivalences between objects are equivalent to typed constructions of functions are equivalent to objects fulfilling the same contracts.
// what if functions could be curried with arguments in any order?

const { mergeAndSort, sortTransitivelyBeside, isAbove } =
  make2DLineFunctions<YInterval>({
    dist: axisAlignedIntervalDist,
    xProj:
      ([p1, p2]) =>
      (p) =>
        yIntervalFromTop(segProj([top(p1), top(p2)])(top(p))),
    isPointLeft: (p1) => (p2) => p1.n < p2.n,
    isPointBelow: (p1) => (p2) => top(p1)[1] > top(p2)[1],
  }); // TODO make x-biased axisAlignedIntervalDist

function leftYIntervalFromBox(box: XYWH): YInterval {
  return {
    interval: [box[1], box[1] + box[3]],
    n: box[0],
    data: box,
  };
}
function rightYIntervalFromBox(box: XYWH): YInterval {
  return {
    interval: [box[1], box[1] + box[3]],
    n: box[0] + box[2],
    data: box,
  };
}

function linesAndIndex(
  box: XYWH,
  boxes: XYWH[]
): { lines: YInterval[][]; index: [number, number] } {
  const caretSinks = boxes.map((box) => [
    leftYIntervalFromBox(box),
    rightYIntervalFromBox(box),
  ]);

  const lines = mergeAndSort(caretSinks);

  const index = findIndex2D(lines, (p) => p.data === box);

  return { lines, index };
}
