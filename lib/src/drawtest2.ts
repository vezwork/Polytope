import {
  besideD,
  centerBesideD,
  centerOverD,
  BoundedDrawable,
  justBesideD,
  lineD,
  overD,
  padD,
  pathD,
  scaleD,
  textD,
  translateD,
  justOverD,
  transformD,
  draw,
  debug,
  drawables,
} from "./draw/draw4.js";
import { isConvexShapesIntersecting } from "./math/collision.js";
import {
  apply,
  CtxTransform,
  id,
  inv,
  lerp,
  translation,
} from "./math/CtxTransform.js";
import { add, Vec2 } from "./math/Vec2.js";

const c = document.getElementById("c") as HTMLCanvasElement;
const ctx = c.getContext("2d") as CanvasRenderingContext2D;
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
const tD = (text: string, size: number = 40) =>
  textD(...measureWidth(text, size));

// https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/textBaseline
// https://developer.mozilla.org/en-US/docs/Web/API/TextMetrics
const measureWidth = (
  text: string,
  size: number
): [string, number, number, number] => {
  ctx.textBaseline = "alphabetic";
  ctx.font = `${size}px serif`;
  const measure = ctx.measureText(text);
  return [text, size, measure.width, measure.fontBoundingBoxAscent];
};

const goldenRatio = tD("φ = ");

const sQuarter = scaleD([3 / 4, 3 / 4]);
const smallPad = padD([5, 5]);

const radical = (slot: BoundedDrawable) =>
  besideD(lrad, overD(lx, smallPad(slot)));
const sradical = (slot: BoundedDrawable) => radical(sQuarter(slot));

const lad = (slot: BoundedDrawable) => overD(lx, smallPad(slot));
const slad = (slot: BoundedDrawable) => lad(sQuarter(slot));
const frac = (slot1: BoundedDrawable, slot2: BoundedDrawable) =>
  centerOverD(smallPad(slot1), overD(lx, smallPad(slot2)));
const exp = (slot1: BoundedDrawable, slot2: BoundedDrawable) =>
  centerBesideD(slot1, sQuarter(translateD([0, -15])(slot2)));

// TODO: this isnt quite right. Everything should be relative to the Σ, not eachother, but I can't
//   express this with just centerBesideD and centerOverD
// - DAG instead of tree of drawables?

// https://en.wikipedia.org/wiki/Mathematical_operators_and_symbols_in_Unicode
const capTernary =
  (cap: string) =>
  (slot1: BoundedDrawable, slot2: BoundedDrawable, slot3: BoundedDrawable) =>
    centerBesideD(centerOverD(slot1, tD(cap, 100), slot2), slot3);
const Σ = capTernary("∑");
const Π = capTernary("∏");

const ΣNote = Σ(tD("∞"), tD("n﹦1"), frac(tD("1"), exp(tD("n"), tD("s"))));

const box = (slot: BoundedDrawable) =>
  drawables(scaleD([slot.w + 10, slot.h + 10])(rect), padD([5, 5])(slot));

const placeholder = translateD([0, 0])(
  lineD([
    [0, 0],
    [200, 10],
  ])
);
const φ = centerBesideD(tD("1 + "), centerOverD(tD("1"), slad(placeholder)));
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

let mouse: Vec2 = [-1, -1];
c.addEventListener("mousemove", (e) => {
  mouse = [e.offsetX * dpr, e.offsetY * dpr];
});

function anim() {
  ctx.clearRect(0, 0, c.width, c.height);

  // const tr = lerp(start, target, t);
  canvasRender(
    justOverD(
      padD([0, 120])(justBesideD(goldenRatio, transformD(id)(φ))),
      centerBesideD(
        tD("ζ(s)﹦"),
        ΣNote,
        tD("﹦"),
        box(
          Π(
            tD("∞"),
            tD("p∊ℙ"),
            frac(tD("1"), centerBesideD(tD("1−"), exp(tD("p"), tD("−s"))))
          )
        )
      )
    )
  );

  if (
    isConvexShapesIntersecting(
      [mouse, add(mouse, [1, 0]), add(mouse, [0, 1])],
      [
        [0, 0],
        [0, 100],
        [100, 0],
      ]
    )
  ) {
    console.log("yoooo");
    //d(tD("yooooooo"));
  }

  //ΣNote.draw(ctx, id);
  t += 0.1;

  requestAnimationFrame(anim);
}
requestAnimationFrame(anim);
