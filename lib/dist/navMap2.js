import { isPointInside, positive } from "./math/XYWH.js";
import { horizontalNavMaps } from "./space.js";
import { mergeAndSortLines } from "./math/Line2MergeAndSort.js";
import { pairs } from "./Iterable.js";
const c = document.getElementById("c");
const ctx = c.getContext("2d");
const mouse = [0, 0];
let isMouseDown = false;
let isMouseRightDown = false;
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
    else
        isMouseRightDown = true;
});
c.addEventListener("mouseup", (e) => {
    if (e.button === 0)
        isMouseDown = false;
    else
        isMouseRightDown = false;
});
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
    if (isMouseRightDown)
        boxes = boxes.filter((box) => !isPointInside(mouse, box));
    const nav = horizontalNavMaps(boxes.map(([x, y, w, h]) => ({
        top: y,
        bottom: y + h,
        x: x + w,
    })));
    ctx.fillStyle = "red";
    for (const box of boxes)
        ctx.fillRect(...box);
    const ls = [...nav.lines()];
    const lines = ls.map((l) => l.map(({ top, x }) => [x, top]));
    const mergedAndOrderedLines = mergeAndSortLines(lines);
    for (const [la, lb] of pairs(mergedAndOrderedLines)) {
        ctx.beginPath();
        if (la.length === 0 || lb.length === 0)
            continue;
        for (const p1 of la) {
            const closest = lb.reduce((acc, p) => acc.point === null || Math.abs(p1[0] - p[0]) < acc.dist
                ? { dist: Math.abs(p1[0] - p[0]), point: p }
                : acc, { dist: Infinity, point: null });
            if (closest.point) {
                ctx.strokeStyle = "YellowGreen";
                ctx.moveTo(...p1);
                ctx.lineTo(...closest.point);
                ctx.stroke();
            }
        }
    }
    ctx.strokeStyle = "SkyBlue";
    for (let i = 0; i < mergedAndOrderedLines.length; i++) {
        const line = mergedAndOrderedLines[i];
        ctx.beginPath();
        for (const point of line) {
            ctx.lineTo(...point);
            ctx.fillRect(...point, 3, 3);
        }
        if (line.length > 0) {
            ctx.fillText(String(i), ...line.at(0));
        }
        ctx.stroke();
    }
    ctx.strokeStyle = "black";
    for (const line of lines) {
        ctx.beginPath();
        for (const point of line) {
            ctx.lineTo(...point);
            ctx.fillRect(...point, 3, 3);
        }
        if (line.length > 0)
            ctx.fillRect(...line.at(-1), 5, 5);
        ctx.stroke();
    }
    if (curCreateBox)
        ctx.fillRect(...curCreateBox);
    ctx.fillRect(...mouse, 5, 5);
    requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
