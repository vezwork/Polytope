import { makeCaretFunctions } from "./caret.js";
import { centerBesideD, centerOverD, justBesideD, lineD, overD, padD, scaleD, textD, translateD, justOverD, transformD, draw, editor, drawables, image, pathD, } from "./draw/draw4.js";
import { withIndex } from "./Iterable.js";
import { apply, id, inv, lerp, scale, translation, _, } from "./math/CtxTransform.js";
import { add, rotate, setLength, sub } from "./math/Vec2.js";
import { makeTreeFunctions } from "./structure/tree.js";
const c = document.getElementById("c");
const ctx = c.getContext("2d");
//-----------
//https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
// Get the DPR and size of the canvas
c.width = window.innerWidth;
c.height = window.innerHeight;
const dpr = window.devicePixelRatio;
const brect = c.getBoundingClientRect();
// Set the "actual" size of the canvas
c.width = brect.width * dpr;
c.height = brect.height * dpr;
// Set the "drawn" size of the canvas
c.style.width = `${brect.width}px`;
c.style.height = `${brect.height}px`;
//----------
const lx = lineD([
    [0, 0],
    [1, 0],
]);
const ly = lineD([
    [0, 0],
    [0, 1],
]);
const qnote = padD([10, 0])(editor(pathD("M5.79325 12.3905C6.12789 13.3398 5.23798 14.5187 3.80559 15.0236C2.37319 15.5286 0.940723 15.1683 0.60608 14.2189C0.271437 13.2696 1.16134 12.0907 2.59374 11.5858C4.02614 11.0808 5.4586 11.4411 5.79325 12.3905ZM5.79325 12.3905V0.5", 7, 16, true, 2)));
const treble = pathD("M11.108 3.28993C11.3892 6.20396 9.24665 8.56219 7.3492 10.4684C6.48731 11.3045 7.2063 10.6064 6.75577 11.0221C6.66155 10.5756 6.48049 9.40863 6.49745 9.05536C6.61767 6.54437 8.63608 2.91513 10.4046 1.57654C10.6894 2.11408 10.9236 2.15733 11.108 3.28993ZM11.7081 18.3359C10.5723 17.4915 9.08071 17.2696 7.71298 17.511C7.53662 16.3412 7.36017 15.1715 7.18381 14.0026C9.35083 11.8317 11.7072 9.31206 11.8307 6.04299C11.8851 3.96253 11.5763 1.68876 10.2838 -0.000396729C8.71619 0.119127 7.61074 2.00922 6.77881 3.18413C5.4062 5.67332 5.72656 8.6993 6.25333 11.3834C5.50714 12.2707 4.47443 13.008 3.73894 13.9318C1.56684 16.083 -0.325268 18.9931 0.0470883 22.207C0.216091 25.3146 2.43426 28.2041 5.45884 28.9433C6.60725 29.2369 7.8225 29.2658 8.98428 29.0356C9.18701 31.1328 9.93071 33.3503 9.06956 35.386C8.42358 36.8755 6.49976 38.186 5.07542 37.4292C4.52283 37.1346 4.9706 37.3816 4.63475 37.1943C5.621 36.9547 6.47818 36.2286 6.71825 35.7355C7.49061 34.3709 6.34967 32.3436 4.73118 32.6055C2.64584 32.6484 1.78994 35.5323 3.13113 36.9724C4.37274 38.3892 6.66478 38.1953 8.13715 37.2688C9.80809 36.1689 10.0174 33.9655 9.82653 32.0845C9.762 31.4525 9.455 29.5958 9.41721 28.9274C10.0598 28.6953 9.60988 28.8724 10.517 28.5089C12.9693 27.5274 14.5338 24.5391 13.8303 21.8705C13.5372 20.5012 12.8679 19.1543 11.7081 18.3359ZM12.2253 23.7021C12.4226 25.5579 11.2546 27.7297 9.38678 28.3253C9.2614 27.5843 9.22822 27.3829 9.14469 26.9504C8.70015 24.6575 8.4588 22.302 8.11585 19.9774C9.61357 19.8208 11.3034 20.4835 11.8243 22.0131C12.0492 22.5509 12.1405 23.1288 12.2253 23.7021ZM7.47881 28.5453C5.1334 28.6767 2.86977 27.0586 2.28454 24.7414C1.59404 22.7345 1.7975 20.4257 3.04115 18.679C4.06916 17.0925 5.44409 15.7848 6.75512 14.4444C6.92383 15.4949 7.09254 16.5454 7.26125 17.5968C4.50421 18.3257 2.6475 22.001 4.29733 24.5419C4.78815 25.254 6.11947 26.614 6.84685 26.0649C5.83092 25.4283 5.00001 24.3322 5.17867 23.057C5.10298 21.8621 6.44158 20.3437 7.62291 20.0762C8.02707 22.7504 8.49069 25.7368 8.89486 28.412C8.42893 28.5052 7.9535 28.5453 7.47881 28.5453Z", 14, 38);
const caret = pathD("M3 3H10.913L17 9.33745M17 9.33745V47.9959M17 9.33745L23.087 3H31M17 47.9959L10.913 54.3333H3M17 47.9959L23.087 54.3333H31", 35, 51, false, 5);
const github = pathD("M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z", 24, 24);
const arrow = (start, end) => lineD([
    start,
    end,
    add(end, setLength(20, rotate(sub(start, end), Math.PI / 8))),
    end,
    add(end, setLength(20, rotate(sub(start, end), -Math.PI / 8))),
]);
const ntD = (text, size = 40) => textD(...measureWidth(text, size));
const tD = (text, size = 40) => editor(centerBesideD(editor(textD("", size, 1, size)), ...text
    .split("")
    .map((char) => editor(textD(...measureWidth(char, size))))));
const lntD = (text, size = 40) => centerBesideD(editor(textD("", size, 1, size)), ...text.split("").map((char) => editor(textD(...measureWidth(char, size)))));
// https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/textBaseline
// https://developer.mozilla.org/en-US/docs/Web/API/TextMetrics
const measureWidth = (text, size) => {
    ctx.textBaseline = "alphabetic";
    ctx.font = `${size}px monospace`;
    const measure = ctx.measureText(text);
    return [text, size, measure.width + 4, measure.fontBoundingBoxAscent];
};
const sQuarter = scaleD([3 / 4, 3 / 4]);
const smallPad = padD([5, 5]);
const lad = (slot) => overD(lx, smallPad(slot));
const slad = (slot) => lad(sQuarter(slot));
const nfrac = (slot1, slot2) => centerOverD(smallPad(slot1), overD(lx, smallPad(slot2)));
const frac = (slot1, slot2) => editor(centerOverD(smallPad(slot1), overD(lx, smallPad(slot2))));
const exp = (slot1, slot2) => centerBesideD(slot1, sQuarter(translateD([0, -15])(slot2)));
// TODO: this isnt quite right. Everything should be relative to the Σ, not eachother, but I can't
//   express this with just centerBesideD and centerOverD
// - DAG instead of tree of drawables?
// https://en.wikipedia.org/wiki/Mathematical_operators_and_symbols_in_Unicode
const neditCapTernary = (cap) => (slot1, slot2, slot3) => centerBesideD(centerOverD(slot1, lntD(cap, 100), slot2), slot3);
const capTernary = (cap) => (slot1, slot2, slot3) => editor(neditCapTernary(cap)(slot1, slot2, slot3));
const Σ = capTernary("∑");
const Π = capTernary("∏");
const integral = capTernary("∫");
const nΣ = neditCapTernary("∑");
const nΠ = neditCapTernary("Π");
const ΣNote = Σ(lntD("∞"), lntD("n﹦1"), frac(lntD("1"), exp(lntD("n"), lntD("s"))));
const nΣNote = nΣ(lntD("∞"), lntD("n﹦1"), nfrac(lntD("1"), exp(lntD("n"), lntD("s"))));
const placeholder = translateD([0, 0])(lineD([
    [0, 0],
    [300, 50],
]));
const φ = centerBesideD(lntD("1 + "), editor(centerOverD(lntD("1"), slad(placeholder))));
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
// let mouse: Vec2 = [-1, -1];
// c.addEventListener("mousemove", (e) => {
//   mouse = [e.offsetX * dpr, e.offsetY * dpr];
// });
const getBounds = (e) => {
    const [x1, y1] = apply(e.t)([0, 0]);
    const [width1, height1] = sub(apply(e.t)([e.d.w, e.d.h]), [x1, y1]);
    const [x, y] = [x1 + 1, y1 + 1];
    const [width, height] = [width1 - 2, height1 - 2];
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
const { descendentsBreadthFirst: des, hasChildren } = makeTreeFunctions({
    parent,
    children,
});
let carryX = null;
const { next, lines: uncachedLines } = makeCaretFunctions({
    getBounds,
    getCarryX: () => carryX,
    setCarryX: () => (newCarryX) => (carryX = newCarryX),
    parent,
    children,
    //e, // this just always selects the parent instead of drilling into the children
    //best([...children(e)], (c) => distance(v, apply(c.t)([0, 0]))),
});
const cacheForAbove = new Map();
const cacheForBelow = new Map();
const cacheForLines = new Map();
const lines = (t) => {
    if (cacheForLines.has(t))
        return cacheForLines.get(t);
    else {
        const l = uncachedLines(children(t));
        cacheForLines.set(t, l);
        return l;
    }
};
const newImage = (url, w = 0, h = 80) => {
    const img = new Image();
    fetch(url)
        .then((r) => r.blob())
        .then((r) => (img.src = URL.createObjectURL(r)));
    return image(img, w, h);
};
const citeImage = (url, cite, shoveX, additionalText = "") => translateD([shoveX, 0])(justOverD(textD(...measureWidth(cite, 3)), textD(...measureWidth(additionalText, 3)), editor(scaleD([1 / 10, 1 / 10])(newImage(url)))));
const main = editor(drawables(justOverD(tD("A Caret for your thoughts", 100), justBesideD(tD("Adapting Caret (", 50), caret, tD(") Navigation to Visual Editors", 50)), padD([0, 170])(scaleD([300, 2])(lx)), tD("Visual Editors                             "), padD([10, 20])(justOverD(citeImage("./pres2/cellpond.png", "Cellpond", 900, "Lu Wilson"), citeImage("./pres2/scratch.png", "Scratch Blocks", 700), citeImage("./pres2/livelits.png", "Filling Typed Holes with Live GUIs [LiveLits]", 500, "Cyrus Omar, David Moon, Andrew Blinn, Ian Voysey, Nick Collins, Ravi Chugh"), citeImage("./pres2/visr.jpg", "Adding Interactive Visual Syntax to Textual Code [VISr]", 300, "Leif Anderson, Michael Ballantyne, Matthias Felleisen"), citeImage("./pres2/mps.png", "jetbrains.com/mps/", 150), citeImage("./pres2/code.png", "Traditional Code Editor", 0))), padD([0, 170])(scaleD([300, 2])(lx)), centerBesideD(translateD([0, 220])(editor(justOverD(tD("Text"), tD("Programming")))), newImage("./pres2/bridge.svg", 682, 420), translateD([0, -70])(editor(justOverD(tD("Visual"), tD("Programming"))))), padD([0, 170])(scaleD([300, 2])(lx)), tD(`In Polytope we`, 50), tD(`can't navigate visuals`, 50), tD(`without using mouse`, 50), padD([0, 170])(scaleD([300, 2])(lx)), padD([30, 30])(tD("What should visual caret nav be?", 50)), padD([30, 30])(ntD("😌 feel text-editor-y", 40)), 
//padD([50, 10])(ntD("users can easily adapt", 30)),
padD([30, 30])(ntD("⚙️ automatic", 40)), 
//padD([50, 10])(ntD("accessible editors", 30)),
padD([30, 30])(ntD("🧩 composable", 40)), 
//padD([50, 10])(ntD("diverse editor ecosystem", 30)),
padD([0, 500])(editor(centerOverD(tD("Visuals", 50), editor(textD(...measureWidth("🤝", 50))), tD("Common controls", 50), editor(textD(...measureWidth("🤝", 50))), tD("Text", 50)))), translateD([0, 300])(tD("Prior art", 50)), padD([30, 10])(ntD("🌐 W3C Spatial Nav", 30)), padD([30, 10])(ntD("💭 “Four-way navigation algorithm” stackoverflow.com/a/16577312", 30)), padD([30, 10])(centerBesideD(github, ntD(" “Spatial Keyboard Navigation” by danilowoz", 30))), padD([30, 10])(ntD("📺 Netflix Tech Blog “[..]User Input on TV Devices”", 30)), padD([30, 10])(ntD("𝐓 rich text editors (e.g. Google Docs, Notion, Word,...)", 30)), padD([0, 230])(scaleD([300, 2])(lx)), tD("What makes text editors so... text editor-y?"), padD([0, 80])(editor(justOverD(lntD("function rgbFromNum(num: number) {", 30), lntD("  num >>>= 0;", 30), lntD("  const b = num & 0xff;", 30), lntD("  const g = (num & 0xff00) >>> 8;", 30), lntD("  const r = (num & 0xff0000) >>> 16;", 30), lntD("  return [r, g, b];", 30), lntD("}", 30)))), padD([0, 170])(scaleD([300, 2])(lx)), editor(justOverD(centerBesideD(lntD("const mySum = "), nΣNote), centerBesideD(lntD("const gameJingle = "), scaleD([2, 2])(justBesideD(editor(treble), translateD([0, 10])(qnote), translateD([0, -10])(qnote), translateD([0, 14])(qnote)))), centerBesideD(lntD("const myDiagram = "), translateD([50, 0])(drawables(arrow([90, 50], [90, 150]), translateD([80, 10])(lntD("n")), arrow([100, 50], [170, 250]), arrow([80, 50], [10, 250]), translateD([50, 155])(lntD("a×b")), arrow([100, 200], [150, 250]), arrow([80, 200], [30, 250]), translateD([170, 250])(lntD("b")), translateD([0, 250])(lntD("a"))))))), padD([0, 230])(scaleD([300, 2])(lx)), editor(justOverD(centerBesideD(lntD("ζ(s)﹦"), ΣNote, lntD("﹦"), Π(lntD("∞"), lntD("p∊ℙ"), frac(lntD("1"), centerBesideD(lntD("1−"), exp(lntD("p"), lntD("−s")))))), padD([0, 120])(justBesideD(lntD("φ = "), transformD(id)(φ))), centerBesideD(integral(lx, lntD("∂Ω"), lntD("ω")), lntD("﹦"), integral(lx, lntD("Ω"), lntD("dω")), translateD([50, 0])(editor(drawables(arrow([90, 50], [90, 150]), translateD([80, 10])(lntD("n")), arrow([100, 50], [170, 250]), arrow([80, 50], [10, 250]), translateD([50, 155])(lntD("a×b")), arrow([100, 200], [150, 250]), arrow([80, 200], [30, 250]), translateD([170, 250])(lntD("b")), translateD([0, 250])(lntD("a")))))))), padD([0, 170])(scaleD([300, 2])(lx)), tD("Thank you", 60), tD("elliot.website/editor", 30)), translateD([700, 1000])(tD(""))));
const rend = canvasRender(main);
let drawSinks = false;
let drawLineOutlines = false;
let drawAboveAndBelow = false;
let drawBlueLines = false;
let curFocus = [...children(rend)][0];
document.body.addEventListener("keydown", (e) => {
    if (e.key.startsWith("Arrow")) {
        const nextFocus = next(curFocus, e.key);
        if (nextFocus)
            curFocus = nextFocus;
    }
    if (e.key === "a")
        drawSinks = !drawSinks;
    if (e.key === "s")
        drawLineOutlines = !drawLineOutlines;
    if (e.key === "d")
        drawBlueLines = !drawBlueLines;
    if (e.key === "f")
        drawAboveAndBelow = !drawAboveAndBelow;
});
const zoom = [1 / 2, 1 / 2];
const offset = [200, 400];
function drawStuff(focus, depth = 3) {
    if (depth === 0)
        return;
    ctx.save();
    ctx.strokeStyle = "blue";
    for (const line of lines(focus)) {
        for (const [{ n, interval: [top, bottom], data, }, i,] of withIndex(line)) {
            ctx.beginPath();
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
                //if (i % 2 === 1) {
                //ctx.moveTo(n, bottom);
                //ctx.lineTo(n, top);
                // } else {
                ctx.moveTo(n, top);
                //}
                ctx.lineTo(next.n, next.interval[0]);
                ctx.moveTo(n, bottom);
                ctx.lineTo(next.n, next.interval[1]);
            }
            ctx.stroke();
            if (data && hasChildren(data)) {
                const { width, height, x, y } = getBounds(data);
                ctx.globalAlpha = 0.01;
                ctx.fillStyle = "blue";
                ctx.fillRect(x, y, width, height);
                ctx.globalAlpha = 1;
                drawStuff(data, depth - 1);
            }
        }
    }
    ctx.restore();
}
let trr = id;
function anim() {
    const { x, y, width, height: rawHeight } = getBounds(curFocus);
    const height = Math.min(rawHeight, 40);
    const a = _(scale([height, height]))(translation([x - 4 + width, y - 4]));
    const a2 = _(scale([height / 80, height / 80]))(translation([height < 10 ? x - 4 + width : 0, y - 4]));
    trr = lerp(trr, a2, 0.05);
    const na = inv(trr);
    const caretTransform = _(_(a)(na))(translation(offset));
    const gradient = ctx.createRadialGradient(...apply(_(caretTransform)(translation([20, 20])))([0, 0]), 10, ...apply(_(caretTransform)(translation([20, 20])))([0, 0]), 420);
    // Add three color stops
    gradient.addColorStop(0, "#FFE1AA");
    gradient.addColorStop(1, "white");
    // Set the fill style and draw a rectangle
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, c.width, c.height);
    if (drawBlueLines) {
        ctx.fillStyle = "blue";
        canvasRender(translateD([c.width - 1050, c.height - 150])(ntD("Nesting", 150)));
    }
    if (drawLineOutlines) {
        ctx.fillStyle = "blue";
        canvasRender(translateD([c.width - 1050, c.height - 350])(ntD("Lines", 150)));
    }
    if (drawSinks) {
        ctx.fillStyle = "green";
        canvasRender(translateD([c.width - 1050, c.height - 550])(ntD("Caret Sinks", 150)));
    }
    if (drawAboveAndBelow) {
        ctx.fillStyle = "red";
        canvasRender(translateD([c.width - 1050, c.height - 750])(ntD("Above/", 150)));
        ctx.fillStyle = "purple";
        canvasRender(translateD([c.width - 520, c.height - 750])(ntD("Below", 150)));
    }
    ctx.fillStyle = "black";
    ctx.translate(...offset);
    ctx.transform(...na);
    if (drawSinks) {
        for (const a of des(rend)) {
            const { top, bottom, left, right } = getBounds(a);
            ctx.save();
            // ctx.lineWidth = 1;
            // ctx.strokeStyle = "#FEE";
            // ctx.beginPath();
            // ctx.moveTo(left, top);
            // ctx.lineTo(right, top);
            // ctx.moveTo(left, bottom);
            // ctx.lineTo(right, bottom);
            // ctx.stroke();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "green";
            ctx.beginPath();
            ctx.moveTo(right, top);
            ctx.lineTo(right, bottom);
            ctx.stroke();
            ctx.restore();
        }
    }
    if (drawAboveAndBelow) {
        const nexter = cacheForAbove.get(curFocus) ?? next(curFocus, "ArrowUp");
        if (nexter) {
            cacheForAbove.set(curFocus, nexter);
            ctx.beginPath();
            ctx.strokeStyle = "red";
            const curB = getBounds(curFocus);
            const aboveB = getBounds(nexter);
            ctx.moveTo(curB.right, curB.top);
            ctx.lineTo(aboveB.right, aboveB.bottom);
            ctx.stroke();
        }
        const belower = cacheForBelow.get(curFocus) ?? next(curFocus, "ArrowDown");
        if (belower) {
            cacheForBelow.set(curFocus, belower);
            ctx.beginPath();
            ctx.strokeStyle = "purple";
            const curB = getBounds(curFocus);
            const aboveB = getBounds(belower);
            ctx.moveTo(curB.right, curB.bottom);
            ctx.lineTo(aboveB.right, aboveB.top);
            ctx.stroke();
        }
    }
    if (drawBlueLines) {
        drawStuff(rend);
    }
    if (drawLineOutlines) {
        drawStuff(parent(curFocus) ?? rend, 1);
    }
    ctx.strokeStyle = "black";
    ctx.resetTransform();
    // const tr = lerp(start, target, t);
    //for (const a of des(rend)) drawBounds(a);
    canvasRender(translateD(offset)(transformD(na)(main)));
    canvasRender(transformD(caretTransform)(textD(...measureWidth("🥕", 1))));
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
