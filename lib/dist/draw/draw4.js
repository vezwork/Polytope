import { id, _, apply, translation, scale, zeroTranslate, } from "../math/CtxTransform.js";
import { height, width } from "../math/Line2.js";
import { length } from "../math/Vec2.js";
export const draw = (ctx, t = id) => (d) => d.draw(ctx, t);
class PathDrawable {
    w;
    h;
    path;
    constructor(w, h, path) {
        this.w = w;
        this.h = h;
        this.path = path;
    }
    draw(ctx, t) {
        ctx.setTransform(...t);
        ctx.fill(new Path2D(this.path));
        ctx.resetTransform();
        return {
            d: this,
            children: [],
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
        this.w = width(line);
        this.h = height(line);
    }
    draw(ctx, t) {
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
            t,
        };
    }
}
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
    draw(ctx, t) {
        ctx.setTransform(...t);
        ctx.translate(0, this.h);
        ctx.font = `${this.fontSize}px serif`;
        ctx.textBaseline = "bottom";
        ctx.fillText(this.text, 0, 0);
        ctx.resetTransform();
        return {
            d: this,
            children: [],
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
    draw(ctx, t) {
        const scaleFactor = length(apply(zeroTranslate(t))([1, 1]));
        return {
            d: this,
            children: scaleFactor < 0.02
                ? []
                : [this.drawable.draw(ctx, _(this.transform)(t))],
            t,
        };
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
    draw(ctx, t) {
        return {
            caretable: true,
            d: this,
            children: [this.drawable.draw(ctx, t)],
            t,
        };
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
    draw(ctx, t) {
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = "red";
        ctx.transform(...t);
        ctx.stroke(new Path2D(`M0 0 h ${this.w} v ${this.h} h ${-this.w} Z`));
        ctx.restore();
        return {
            d: this,
            children: [this.drawable.draw(ctx, t)],
            t,
        };
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
    draw(ctx, t) {
        return {
            d: this,
            children: this.drawables.map((d) => d.draw(ctx, t)),
            t,
        };
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
export const pathD = (path, w, h) => new PathDrawable(w, h, path);
export const textD = (text, fontSize, w, h) => new TextDrawable(w, h, text, fontSize);
