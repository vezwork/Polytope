import { makeCaretFunctions } from "./caret.js";
import { centerBesideD, centerOverD, justBesideD, lineD, overD, padD, scaleD, textD, translateD, justOverD, transformD, draw, editor, } from "./draw/draw4.js";
import { withIndex } from "./Iterable.js";
import { apply, id } from "./math/CtxTransform.js";
import { sub } from "./math/Vec2.js";
import { makeTreeFunctions } from "./structure/tree.js";
const c = document.getElementById("c");
const ctx = c.getContext("2d");
//-----------
//https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
// Get the DPR and size of the canvas
const dpr = window.devicePixelRatio;
const brect = c.getBoundingClientRect();
// Set the "actual" size of the canvas
c.width = brect.width * dpr;
c.height = brect.height * dpr;
// Scale the context to ensure correct drawing operations
ctx.scale(dpr, dpr);
// Set the "drawn" size of the canvas
c.style.width = `${brect.width}px`;
c.style.height = `${brect.height}px`;
//----------
const lx = lineD([
    [0, 0],
    [1, 0],
]);
const lyr = lineD([
    [1, 0],
    [1, 1],
]);
const tD = (text, size = 40) => centerBesideD(editor(textD("", 40, 1, 40)), ...text.split("").map((char) => editor(textD(...measureWidth(char, size)))));
// https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/textBaseline
// https://developer.mozilla.org/en-US/docs/Web/API/TextMetrics
const measureWidth = (text, size) => {
    ctx.textBaseline = "alphabetic";
    ctx.font = `${size}px serif`;
    const measure = ctx.measureText(text);
    return [text, size, measure.width, measure.fontBoundingBoxAscent];
};
const sQuarter = scaleD([3 / 4, 3 / 4]);
const smallPad = padD([5, 5]);
const lad = (slot) => overD(lx, smallPad(slot));
const slad = (slot) => lad(sQuarter(slot));
const frac = (slot1, slot2) => editor(centerOverD(smallPad(slot1), overD(lx, smallPad(slot2))));
const exp = (slot1, slot2) => centerBesideD(slot1, sQuarter(translateD([0, -15])(slot2)));
// TODO: this isnt quite right. Everything should be relative to the Σ, not eachother, but I can't
//   express this with just centerBesideD and centerOverD
// - DAG instead of tree of drawables?
// https://en.wikipedia.org/wiki/Mathematical_operators_and_symbols_in_Unicode
const capTernary = (cap) => (slot1, slot2, slot3) => centerBesideD(centerOverD(slot1, tD(cap, 100), slot2), slot3);
const Σ = capTernary("∑");
const Π = capTernary("∏");
const ΣNote = Σ(tD("∞"), tD("n﹦1"), frac(tD("1"), exp(tD("n"), tD("s"))));
const placeholder = translateD([0, 0])(lineD([
    [0, 0],
    [300, 50],
]));
const φ = centerBesideD(tD("1 + "), editor(centerOverD(tD("1"), slad(placeholder))));
placeholder.drawable = φ;
// need pick which relies on getBounds!!!
// class Drawable { w; h; draw(ctx, affineTransform) }
// need annotations on render tree so you know what is what.
// - need way to navigate render tree (lens thing)
// need "pick"
// transforms don't actually have to be linear/matrices. They just need an inverse probably (for pick and tTree)
// - actually not true. If the transforms are not affine they wont respect lines so the drawing wouldn't match the transform.
const canvasRender = draw(ctx);
let t = 0;
//let start: CtxTransform = inv(canvasRender(φ).ds[0].d);
// const target: CtxTransform = inv(
//   canvasRender(φ).ds[1].d.ds[1].d.ds[1].d.d.d.d.ds[0].d
// );
let mouse = [-1, -1];
c.addEventListener("mousemove", (e) => {
    mouse = [e.offsetX * dpr, e.offsetY * dpr];
});
const getBounds = (e) => {
    const [x1, y1] = apply(e.t)([0, 0]);
    const [width1, height1] = sub(apply(e.t)([e.d.w, e.d.h]), [x1, y1]);
    const [x, y] = [x1 + width1 / 10, y1 + height1 / 10];
    const [width, height] = [width1 - width1 / 10, height1 - height1 / 10];
    return {
        top: y,
        right: x + width,
        bottom: y + height,
        left: x,
        width,
        height,
        x,
        y,
    };
};
const { superParent, superChildren } = makeTreeFunctions({
    parent: (e) => e.parent,
    children: (e) => e.children,
});
const parent = superParent((e) => e.caretable === true);
const children = superChildren((e) => e.caretable === true);
const { descendentsBreadthFirst: des } = makeTreeFunctions({
    parent,
    children,
});
let carryX = null;
const { next, lines } = makeCaretFunctions({
    getBounds,
    getCarryX: () => carryX,
    setCarryX: () => (newCarryX) => (carryX = newCarryX),
    parent,
    children,
    //e, // this just always selects the parent instead of drilling into the children
    //best([...children(e)], (c) => distance(v, apply(c.t)([0, 0]))),
});
const main = editor(justOverD(padD([0, 120])(justBesideD(tD("φ = "), transformD(id)(φ))), centerBesideD(tD("ζ(s)﹦"), ΣNote, tD("﹦"), Π(tD("∞"), editor(tD("p∊ℙ")), frac(tD("1"), centerBesideD(tD("1−"), exp(tD("p"), tD("−s"))))))));
const rend = canvasRender(main);
let curFocus = [...children(rend)][0];
document.body.addEventListener("keydown", (e) => {
    if (e.key.startsWith("Arrow")) {
        const nextFocus = next(curFocus, e.key);
        if (nextFocus)
            curFocus = nextFocus;
    }
});
function anim() {
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#AAA";
    for (const line of lines(children(parent(curFocus) ?? rend))) {
        for (const [{ n, interval: [top, bottom], }, i,] of withIndex(line)) {
            ctx.beginPath();
            ctx.moveTo(n, top);
            ctx.lineTo(n, top);
            ctx.moveTo(n, bottom);
            ctx.lineTo(n, bottom);
            if (i === 0) {
                ctx.moveTo(n, top);
                ctx.lineTo(n, bottom);
            }
            if (i === line.length - 1) {
                ctx.moveTo(n, top);
                ctx.lineTo(n, bottom);
            }
            else {
                const next = line[i + 1];
                ctx.moveTo(n, top);
                ctx.lineTo(next.n, next.interval[0]);
                ctx.moveTo(n, bottom);
                ctx.lineTo(next.n, next.interval[1]);
            }
            ctx.stroke();
        }
    }
    ctx.strokeStyle = "black";
    // const tr = lerp(start, target, t);
    //for (const a of des(rend)) drawBounds(a);
    const { x, y, width, height } = getBounds(curFocus);
    ctx.lineWidth = 2;
    canvasRender(translateD([x - 4 + width, y - 4])(scaleD([height + 8, height + 8])(textD(...measureWidth("🥕", 1)))));
    ctx.lineWidth = 1;
    canvasRender(main);
    // if (
    //   isConvexShapesIntersecting(
    //     [mouse, add(mouse, [1, 0]), add(mouse, [0, 1])],
    //     [
    //       [0, 0],
    //       [0, 100],
    //       [100, 0],
    //     ]
    //   )
    // ) {
    //   console.log("yoooo");
    // }
    t += 0.1;
    requestAnimationFrame(anim);
}
requestAnimationFrame(anim);
