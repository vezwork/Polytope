import { isPointInside, positive } from "./math/XYWH.js";
import { verticallyOrderedlinesFromHorizontalNavMaps, horizontalNavMaps, startOfLines, } from "./space.js";
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
    const { fromNav, toNav } = horizontalNavMaps(boxes.map(([x, y, w, h]) => ({
        top: y,
        bottom: y + h,
        x: x + w,
        xL: x, // not necessary for horizontalNavMaps, just passing data along
    })));
    const ls = verticallyOrderedlinesFromHorizontalNavMaps(fromNav);
    const starts = startOfLines(fromNav);
    // for (const start of starts) {
    //   ctx.fillStyle = "green";
    //   ctx.fillRect(start.x - 10, start.top - 10, 10, 10);
    //   ctx.fillStyle = "black";
    // }
    for (const box of boxes)
        ctx.fillRect(...box);
    ls.map((l) => l.map(({ top, x }) => [x, top]));
    for (const l of ls) {
        ctx.strokeStyle = "#79DEED";
        ctx.beginPath();
        for (const b of l) {
            ctx.lineTo(b.x, b.bottom);
        }
        if (l[l.length - 1].x > c.width - 80)
            ctx.lineTo(c.width, l[l.length - 1].bottom);
        ctx.stroke();
    }
    // for (const [fromBox, toBox] of fromNav) {
    //   //const myL = ls.findIndex((l) => l.includes(fromBox));
    //   ctx.strokeStyle = "#79DEED";
    //   ctx.beginPath();
    //   ctx.moveTo(fromBox.x, fromBox.top);
    //   //ctx.fillText(myL, fromBox.x, fromBox.top);
    //   ctx.lineTo(toBox.x, toBox.top);
    //   ctx.stroke();
    // }
    if (curCreateBox)
        ctx.fillRect(...curCreateBox);
    ctx.fillRect(...mouse, 5, 5);
    requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
