import { id, _, apply, translation, scale, zeroTranslate, } from "../math/CtxTransform.js";
import { max } from "../math/Number.js";
import { length, x, y } from "../math/Vec2.js";
export const draw = (ctx, t = id) => (d) => d.draw(ctx, t, null);
class PathDrawable {
    w;
    h;
    path;
    isFilled;
    lineWidth;
    p2d;
    constructor(w, h, path, isFilled = true, lineWidth = 0) {
        this.w = w;
        this.h = h;
        this.path = path;
        this.isFilled = isFilled;
        this.lineWidth = lineWidth;
        this.p2d = new Path2D(this.path);
    }
    draw(ctx, t, parent) {
        ctx.save();
        ctx.setTransform(...t);
        if (this.isFilled)
            ctx.fill(this.p2d);
        if (this.lineWidth !== 0) {
            ctx.lineWidth = this.lineWidth;
            ctx.stroke(this.p2d);
        }
        ctx.restore();
        return {
            d: this,
            children: [],
            parent,
            t,
        };
    }
}
class LineDrawable {
    line;
    w;
    h;
    constructor(line) {
        this.line = line;
        this.w = max(line.map(x));
        this.h = max(line.map(y));
    }
    draw(ctx, t, parent) {
        const line = this.line;
        ctx.beginPath();
        if (line[0])
            ctx.moveTo(...apply(t)(line[0]));
        for (const p of line) {
            ctx.lineTo(...apply(t)(p));
        }
        ctx.stroke();
        ctx.closePath();
        return {
            d: this,
            children: [],
            parent,
            t,
        };
    }
}
class ImageDrawable {
    w;
    h;
    image;
    constructor(w, h, image) {
        this.w = w;
        this.h = h;
        this.image = image;
    }
    draw(ctx, t, parent) {
        ctx.setTransform(...t);
        ctx.drawImage(this.image, 0, 0);
        ctx.resetTransform();
        return {
            d: this,
            children: [],
            parent,
            t,
        };
    }
}
export const image = (image, width = typeof image?.width === "object" && "animVal" in image?.width
    ? image.width.animVal.value
    : image.width, height = typeof image?.height === "object" && "animVal" in image?.height
    ? image.height.animVal.value
    : image.height) => new ImageDrawable(width, height, image);
class TextDrawable {
    w;
    h;
    text;
    fontSize;
    constructor(w, h, text, fontSize) {
        this.w = w;
        this.h = h;
        this.text = text;
        this.fontSize = fontSize;
    }
    draw(ctx, t, parent) {
        ctx.setTransform(...t);
        ctx.translate(0, this.h);
        ctx.font = `${this.fontSize}px monospace`;
        ctx.textBaseline = "bottom";
        ctx.fillText(this.text, 0, 0);
        ctx.resetTransform();
        return {
            d: this,
            children: [],
            parent,
            t,
        };
    }
}
class TransformDrawable {
    drawable;
    transform;
    w;
    h;
    constructor(
    /*readonly*/ drawable, transform, w, h) {
        this.drawable = drawable;
        this.transform = transform;
        const [tw, th] = apply(transform)([drawable.w, drawable.h]);
        this.w = tw;
        this.h = th;
        if (w !== undefined)
            this.w = w;
        if (h !== undefined)
            this.h = h;
    }
    draw(ctx, t, parent) {
        const scaleFactor = length(apply(zeroTranslate(t))([1, 1]));
        const drawTree = {
            d: this,
            children: [],
            t,
            parent,
        };
        drawTree.children =
            scaleFactor < 0.1
                ? []
                : [this.drawable.draw(ctx, _(this.transform)(t), drawTree)]; // dont render small stuff
        return drawTree;
    }
}
class EditorDrawable {
    drawable;
    w;
    h;
    constructor(/*readonly*/ drawable) {
        this.drawable = drawable;
        this.w = drawable.w;
        this.h = drawable.h;
    }
    draw(ctx, t, parent) {
        const drawTree = {
            caretable: true,
            d: this,
            children: [],
            t,
            parent,
        };
        drawTree.children = [this.drawable.draw(ctx, t, drawTree)];
        return drawTree;
    }
}
export const editor = (slot) => new EditorDrawable(slot);
class DebugDrawable {
    drawable;
    w;
    h;
    constructor(/*readonly*/ drawable) {
        this.drawable = drawable;
        this.w = drawable.w;
        this.h = drawable.h;
    }
    draw(ctx, t, parent) {
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = "red";
        ctx.transform(...t);
        ctx.stroke(new Path2D(`M0 0 h ${this.w} v ${this.h} h ${-this.w} Z`));
        ctx.restore();
        const drawTree = {
            d: this,
            children: [],
            t,
            parent,
        };
        drawTree.children = [this.drawable.draw(ctx, t, drawTree)];
        return drawTree;
    }
}
class Drawables {
    drawables;
    w;
    h;
    constructor(drawables) {
        this.drawables = drawables;
        this.w = drawables.reduce((prev, cur) => Math.max(cur.w, prev), 0);
        this.h = drawables.reduce((prev, cur) => Math.max(cur.h, prev), 0);
    }
    draw(ctx, t, parent) {
        const drawTree = {
            d: this,
            children: [],
            t,
            parent,
        };
        drawTree.children = this.drawables.map((d) => d.draw(ctx, t, drawTree));
        return drawTree;
    }
}
export const drawables = (...drawables) => new Drawables(drawables);
export const debug = (drawable) => new DebugDrawable(drawable);
export const besideReducerThing = (f) => (...children) => {
    const h = children.reduce((prev, cur) => Math.max(cur.h, prev), 0);
    let transXAccum = 0;
    return new Drawables(children.map((d) => {
        const transX = transXAccum;
        transXAccum += d.w;
        return new TransformDrawable(d, f(transX, h, d));
    }));
};
export const justBesideD = besideReducerThing((x) => translation([x, 0]));
export const centerBesideD = besideReducerThing((x, h, d) => translation([x, (h - d.h) / 2]));
const scaleToHT = (d, h) => scale([1, h / d.h]);
export const besideD = besideReducerThing((x, h, d) => _(translation([x, 0]))(scaleToHT(d, h)));
export const overReducerThing = (f) => (...children) => {
    const w = children.reduce((prev, cur) => Math.max(cur.w, prev), 0);
    let transYAccum = 0;
    return new Drawables(children.map((d) => {
        const transY = transYAccum;
        transYAccum += d.h;
        return new TransformDrawable(d, f(transY, w, d));
    }));
};
export const justOverD = overReducerThing((y) => translation([0, y]));
export const centerOverD = overReducerThing((y, w, d) => translation([(w - d.w) / 2, y]));
const scaleToWT = (d, w) => scale([w / d.w, 1]);
export const overD = overReducerThing((y, w, d) => _(translation([0, y]))(scaleToWT(d, w)));
export const transformD = (transform = id) => (drawable) => new TransformDrawable(drawable, transform);
export const scaleD = (s) => (drawable) => new TransformDrawable(drawable, scale(s));
export const translateD = (t) => (drawable) => new TransformDrawable(drawable, translation(t));
export const padD = (p) => (drawable) => new TransformDrawable(drawable, translation(p), drawable.w + p[0] * 2, drawable.h + p[1] * 2);
export const lineD = (line = []) => new LineDrawable(line);
export const pathD = (path, w, h, isFilled, lineWidth) => new PathDrawable(w, h, path, isFilled, lineWidth);
export const textD = (text, fontSize, w, h) => new TextDrawable(w, h, text, fontSize);
