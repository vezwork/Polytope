import {
  besideD,
  centerBesideD,
  centerOverD,
  Drawable,
  justBesideD,
  justOverD,
  lineD,
  overD,
  padD,
  pathD,
  render,
  scaleD,
  textD,
  transformD,
  translateD,
  tTree,
} from "./draw/draw3.js";
import { CtxTransform, inv, lerp } from "./math/CtxTransform.js";

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
const bigRect = scaleD(rect, [120, 80]);

const Σ = pathD(
  "M0 0H14.6992L15.0894 5.0295H14.5402C14.4727 4.0364 14.3089 3.27681 14.0488 2.75074C13.7886 2.2247 13.4321 1.84368 12.9792 1.60767C12.5263 1.3717 11.8085 1.25371 10.8257 1.25369H4.1337L10.103 9.0708L3.30985 17.2566H10.7534C12.1024 17.2566 13.1334 17.0354 13.8464 16.5929C14.5595 16.1504 15.0942 15.2262 15.4508 13.8201L16 13.9528L15.1617 20H0V19.469L7.54472 10.3835L0 0.530973V0Z",
  16,
  20
);

const tD = (text: string, size: number = 40) =>
  textD(...measureWidth(text, size));

const measureWidth = (text, size): [string, number, number, number] => {
  ctx.textBaseline = "alphabetic";
  ctx.font = `${size}px serif`;
  const measure = ctx.measureText(text);
  return [text, size, measure.width, size - measure.fontBoundingBoxDescent];
};

const goldenRatio = tD("φ = ");

const radical = (slot: Drawable) =>
  besideD(lrad, overD(lx, padD(slot, [5, 5])));
const sradical = (slot: Drawable) => radical(scaleD(slot, [3 / 4, 3 / 4]));

const lad = (slot: Drawable) => overD(lx, padD(slot, [5, 5]));
const slad = (slot: Drawable) => lad(scaleD(slot, [3 / 4, 3 / 4]));
const frac = (slot1: Drawable, slot2: Drawable) =>
  centerOverD(padD(slot1, [5, 5]), lad(slot2));
const exp = (slot1: Drawable, slot2: Drawable) =>
  centerBesideD(slot1, scaleD(translateD(slot2, [0, -15]), [3 / 4, 3 / 4]));

// TODO: this isnt quite right. Everything should be relative to the Σ, not eachother, but I can't
//   express this with just centerBesideD and centerOverD
const ΣNote = centerBesideD(
  centerOverD(
    tD("∞"),
    tD("Σ", 100),
    padD(justBesideD(tD("n"), tD("="), tD("1")), [10, 10])
  ),
  frac(tD("1"), exp(tD("n"), tD("s")))
);

const placeholder = translateD(
  lineD([
    [0, 0],
    [200, 10],
  ]),
  [0, 0]
);
const rrad = slad(placeholder);
const φ = centerBesideD(tD("1 + "), centerOverD(tD("1"), rrad));
placeholder.transformedDrawables[0].drawable = φ;

// need pick and debug highlighting next!!

// class Drawable { w; h; draw(ctx, affineTransform) }
// need non-distorted and good bounding box char / text rendering
// - should play around with measureText separately
// need annotations on render tree so you know what is what.
// - need way to navigate render tree (lens thing)
// need "pick"
// transforms don't actually have to be linear/matrices. They just need an inverse probably (for pick and tTree)
// - actually not true. If the transforms are not affine they wont respect lines so the drawing wouldn't match the transform.

let t = 0;
let start: CtxTransform = inv(tTree(φ)[0].t); //idT;
const target: CtxTransform = inv(tTree(φ)[1][1][1][0][0][0][0].t);
function draw() {
  ctx.clearRect(0, 0, c.width, c.height);
  const tr = lerp(start, target, t);
  //render(ctx, justOverD(ΣNote, justBesideD(goldenRatio, transformD(φ, tr))));

  render(ctx, ΣNote);
  t += 0.01;

  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
