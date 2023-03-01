import { besideD, centerBesideD, centerOverD, justBesideD, lineD, overD, padD, pathD, scaleD, textD, translateD, justOverD, transformD, draw, debug, } from "./draw/draw4.js";
import { isConvexShapesIntersecting } from "./math/collision.js";
import { inv, lerp, } from "./math/CtxTransform.js";
import { add } from "./math/Vec2.js";
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
const rect = lineD([
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
    [0, 0],
]);
const lrad = lineD([
    [0, 0.9],
    [4, 1],
    [10, 0],
]);
const bigRect = scaleD([10, 10])(rect);
const Σ = pathD("M0 0H14.6992L15.0894 5.0295H14.5402C14.4727 4.0364 14.3089 3.27681 14.0488 2.75074C13.7886 2.2247 13.4321 1.84368 12.9792 1.60767C12.5263 1.3717 11.8085 1.25371 10.8257 1.25369H4.1337L10.103 9.0708L3.30985 17.2566H10.7534C12.1024 17.2566 13.1334 17.0354 13.8464 16.5929C14.5595 16.1504 15.0942 15.2262 15.4508 13.8201L16 13.9528L15.1617 20H0V19.469L7.54472 10.3835L0 0.530973V0Z", 16, 20);
const tD = (text, size = 40) => textD(...measureWidth(text, size));
const measureWidth = (text, size) => {
    ctx.textBaseline = "alphabetic";
    ctx.font = `${size}px serif`;
    const measure = ctx.measureText(text);
    return [text, size, measure.width, size - measure.fontBoundingBoxDescent];
};
const goldenRatio = tD("φ = ");
const sQuarter = scaleD([3 / 4, 3 / 4]);
const smallPad = padD([5, 5]);
const radical = (slot) => besideD(lrad, overD(lx, smallPad(slot)));
const sradical = (slot) => radical(sQuarter(slot));
const lad = (slot) => overD(lx, smallPad(slot));
const slad = (slot) => lad(sQuarter(slot));
const frac = (slot1, slot2) => centerOverD(smallPad(slot1), lad(slot2));
const exp = (slot1, slot2) => centerBesideD(slot1, sQuarter(translateD([0, -15])(slot2)));
// TODO: this isnt quite right. Everything should be relative to the Σ, not eachother, but I can't
//   express this with just centerBesideD and centerOverD
const ΣNote = centerBesideD(centerOverD(tD("∞"), tD("Σ", 100), smallPad(justBesideD(tD("n"), tD("="), tD("1")))), frac(tD("1"), exp(tD("n"), tD("s"))));
const placeholder = translateD([0, 0])(lineD([
    [0, 0],
    [200, 10],
]));
const φ = centerBesideD(tD("1 + "), centerOverD(tD("1"), slad(placeholder)));
placeholder.drawable = φ;
// need pick which relies on getBounds!!!
// class Drawable { w; h; draw(ctx, affineTransform) }
// need annotations on render tree so you know what is what.
// - need way to navigate render tree (lens thing)
// need "pick"
// transforms don't actually have to be linear/matrices. They just need an inverse probably (for pick and tTree)
// - actually not true. If the transforms are not affine they wont respect lines so the drawing wouldn't match the transform.
const d = draw(ctx);
let t = 0;
let start = inv(d(φ).ds[0].d);
const target = inv(d(φ).ds[1].d.ds[1].d.ds[1].d.d.d.d.ds[0].d);
let mouse = [-1, -1];
c.addEventListener("mousemove", (e) => {
    mouse = [e.offsetX * dpr, e.offsetY * dpr];
});
function anim() {
    ctx.clearRect(0, 0, c.width, c.height);
    const tr = lerp(start, target, t);
    d(justOverD(debug(ΣNote), justBesideD(goldenRatio, transformD(tr)(φ))));
    d(translateD(mouse)(bigRect));
    if (isConvexShapesIntersecting([mouse, add(mouse, [1, 0]), add(mouse, [0, 1])], [
        [0, 0],
        [0, 100],
        [100, 0],
    ])) {
        console.log("yoooo");
        d(tD("yooooooo"));
    }
    //ΣNote.draw(ctx, id);
    t += 0.01;
    requestAnimationFrame(anim);
}
requestAnimationFrame(anim);
