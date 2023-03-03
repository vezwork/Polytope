import { positive } from "./math/XYWH.js";
import { findIndex2D, worst } from "./Arrays.js";
import { make2DLineFunctions } from "./math/LineT.js";
import { seperatingInterval, } from "./math/NumberInterval.js";
import { segXProj } from "./math/Line2.js";
import { add } from "./math/Vec2.js";
import { withIndex } from "./Iterable.js";
const c = document.getElementById("c");
const ctx = c.getContext("2d");
const mouse = [0, 0];
let isMouseDown = false;
let boxes = [];
let curCreateBox = null;
document.getElementById("reset")?.addEventListener("click", () => (boxes = []));
c.addEventListener("mousemove", (e) => {
    mouse[0] = e.offsetX;
    mouse[1] = e.offsetY;
});
c.addEventListener("mousedown", (e) => {
    if (e.button === 0)
        isMouseDown = true;
});
c.addEventListener("mouseup", (e) => {
    if (e.button === 0)
        isMouseDown = false;
});
function drawBox(box) {
    ctx.fillStyle = "black";
    ctx.strokeStyle = "black";
    ctx.fillRect(...box);
    // const PAD = 5;
    // const topLeft = add([box[0], box[1]], [-PAD, -PAD]);
    // const topRight = add([box[0] + box[2], box[1]], [PAD, -PAD]);
    // const bottomLeft = add([box[0], box[1] + box[3]], [-PAD, PAD]);
    // const bottomRight = add([box[0] + box[2], box[1] + box[3]], [PAD, PAD]);
    // ctx.beginPath();
    // ctx.moveTo(...topLeft);
    // ctx.lineTo(...topRight);
    // if (!isOpenLeft) {
    //   ctx.moveTo(...topRight);
    //   ctx.lineTo(...bottomRight);
    // }
    // ctx.moveTo(...bottomRight);
    // ctx.lineTo(...bottomLeft);
    // if (!isOpenRight) {
    //   ctx.moveTo(...bottomLeft);
    //   ctx.lineTo(...topLeft);
    // }
    // ctx.stroke();
}
function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    if (isMouseDown) {
        if (!curCreateBox) {
            curCreateBox = [...mouse, 0, 0];
        }
        else {
            curCreateBox[2] = mouse[0] - curCreateBox[0];
            curCreateBox[3] = mouse[1] - curCreateBox[1];
            curCreateBox = positive(curCreateBox);
        }
    }
    else {
        if (curCreateBox) {
            boxes.push(curCreateBox);
            curCreateBox = null;
        }
    }
    const caretSinks = boxes.map((box) => [
        leftYIntervalFromBox(box),
        rightYIntervalFromBox(box),
    ]);
    for (const box of boxes)
        drawBox(box);
    const lines = mergeAndSort(caretSinks);
    for (const line of lines) {
        for (const [{ n, interval: [top, bottom], }, i,] of withIndex(line)) {
            ctx.beginPath();
            ctx.moveTo(...add([n, top], [-5, -5]));
            ctx.lineTo(...add([n, top], [5, -5]));
            ctx.moveTo(...add([n, bottom], [-5, 5]));
            ctx.lineTo(...add([n, bottom], [5, 5]));
            if (i === 0) {
                ctx.moveTo(...add([n, top], [-5, -5]));
                ctx.lineTo(...add([n, bottom], [-5, 5]));
            }
            if (i === line.length - 1) {
                ctx.moveTo(...add([n, top], [5, -5]));
                ctx.lineTo(...add([n, bottom], [5, 5]));
            }
            else {
                const next = line[i + 1];
                ctx.moveTo(...add([n, top], [5, -5]));
                ctx.lineTo(...add([next.n, next.interval[0]], [-5, -5]));
                ctx.moveTo(...add([n, bottom], [5, 5]));
                ctx.lineTo(...add([next.n, next.interval[1]], [-5, 5]));
            }
            ctx.stroke();
        }
    }
    // for (const box of boxes) {
    //   ctx.strokeStyle = "YellowGreen";
    //   const belowBox = below(box, boxes);
    //   if (belowBox) {
    //     ctx.beginPath();
    //     ctx.moveTo(box[0], box[1]);
    //     ctx.lineTo(top(belowBox)[0], top(belowBox)[1]);
    //     ctx.stroke();
    //   }
    // }
    if (curCreateBox)
        ctx.fillRect(...curCreateBox);
    ctx.fillRect(...mouse, 5, 5);
    requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
function next(box, boxes) {
    const { lines, index } = linesAndIndex(box, boxes);
    return lines[index[0]]?.[index[1] + 2] ?? null;
}
function below(box, boxes) {
    const { lines, index } = linesAndIndex(box, boxes);
    const nextLine = lines[index[0] + 1] ?? [];
    return worst(nextLine, (caretSink) => Math.abs(box[0] - caretSink.n)) ?? null;
}
const top = ({ n, interval: [top, _] }) => [
    n,
    top,
]; // assuming interval[0] is top, which is not enforced
const yIntervalFromTop = ([n, top]) => ({
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
const xBiasedDist = ([x1, y1], [x2, y2]) => Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 4);
const { mergeAndSort, sortTransitivelyBeside, isAbove } = make2DLineFunctions({
    dist: (a, b) => {
        const i = seperatingInterval(a.interval, b.interval);
        if (i === null)
            return Math.sqrt((a.n - b.n) ** 2); // intervals overlap so just get 1D distance
        return xBiasedDist([a.n, i[0]], [b.n, i[1]]);
    },
    xProj: ([p1, p2]) => (p) => yIntervalFromTop(segXProj([top(p1), top(p2)])(top(p))),
    isPointLeft: (p1) => (p2) => p1.n < p2.n,
    isPointBelow: (p1) => (p2) => top(p1)[1] > top(p2)[1],
});
function leftYIntervalFromBox(box) {
    return {
        interval: [box[1], box[1] + box[3]],
        n: box[0],
        data: box,
    };
}
function rightYIntervalFromBox(box) {
    return {
        interval: [box[1], box[1] + box[3]],
        n: box[0] + box[2],
        data: box,
    };
}
function linesAndIndex(box, boxes) {
    const caretSinks = boxes.map((box) => [
        leftYIntervalFromBox(box),
        rightYIntervalFromBox(box),
    ]);
    const lines = mergeAndSort(caretSinks);
    const index = findIndex2D(lines, (p) => p.data === box);
    return { lines, index };
}
