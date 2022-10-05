import { isPointInside, positive, XYWH } from "./math/XYWH.js";
import { CaretSink, horizontalNavMaps } from "./space.js";
import { mergeAndSortLines } from "./math/Line2MergeAndSort.js";
import { findIndex2D, max } from "./Arrays.js";

const c = document.getElementById("c") as HTMLCanvasElement;
const ctx = c.getContext("2d") as CanvasRenderingContext2D;

const mouse: [number, number] = [0, 0];
let isMouseDown = false;
let isMouseRightDown = false;

let boxes: XYWH[] = [];
let curCreateBox: XYWH | null = null;

document.getElementById("reset")?.addEventListener("click", () => (boxes = []));

c.addEventListener("mousemove", (e) => {
  mouse[0] = e.offsetX;
  mouse[1] = e.offsetY;
});
c.addEventListener("mousedown", (e) => {
  if (e.button === 0) isMouseDown = true;
  else isMouseRightDown = true;
});
c.addEventListener("mouseup", (e) => {
  if (e.button === 0) isMouseDown = false;
  else isMouseRightDown = false;
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

  if (isMouseRightDown)
    boxes = boxes.filter((box) => !isPointInside(mouse, box));

  ctx.fillStyle = "red";
  for (const box of boxes) ctx.fillRect(...box);

  for (const box of boxes) {
    ctx.strokeStyle = "black";
    const nextBox = next(box, boxes);
    if (nextBox) {
      ctx.beginPath();
      ctx.moveTo(box[0], box[1]);
      ctx.lineTo(nextBox[0], nextBox[1]);
      ctx.stroke();
    }
    ctx.strokeStyle = "YellowGreen";
    const belowBox = below(box, boxes);
    if (belowBox) {
      ctx.beginPath();
      ctx.moveTo(box[0], box[1]);
      ctx.lineTo(belowBox[0], belowBox[1]);
      ctx.stroke();
    }
  }

  if (curCreateBox) ctx.fillRect(...curCreateBox);

  ctx.fillRect(...mouse, 5, 5);

  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);

type AnnotatedCaretSink = [number, number] & CaretSink & { data: XYWH };

// I need monads?
function next(box: XYWH, boxes: XYWH[]): XYWH | null {
  const { lines, index } = linesAndIndex(box, boxes);

  return lines[index[0]]?.[index[1] + 1]?.data ?? null;
}

function below(box: XYWH, boxes: XYWH[]): XYWH | null {
  const { lines, index } = linesAndIndex(box, boxes);

  const nextLine = lines[index[0] + 1];
  return (
    max(nextLine, (caretSink) => Math.abs(box[0] - caretSink[0]))?.data ?? null
  );
}

function linesAndIndex(
  box: XYWH,
  boxes: XYWH[]
): { lines: AnnotatedCaretSink[][]; index: [number, number] } {
  const caretSinks: AnnotatedCaretSink[] = boxes.map((box) =>
    // note that the tuple must be the first arg so that the resulting object has array proto
    Object.assign([box[0] + box[2], box[1]] as [number, number], {
      top: box[1],
      bottom: box[1] + box[3],
      x: box[0] + box[2],
      data: box,
    })
  );

  const nav = horizontalNavMaps(caretSinks);
  const lines = mergeAndSortLines([...nav.lines()]);

  const index = findIndex2D(lines, (p) => p.data === box);

  return { lines, index };
}
