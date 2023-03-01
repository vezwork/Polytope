import {
  CtxTransform,
  id,
  _,
  apply,
  translation,
  scale,
  zeroTranslate,
} from "../math/CtxTransform.js";
import { height, width } from "../math/Line2.js";
import { Vec2, length } from "../math/Vec2.js";

export type DrawTree = {
  caretable?: true;
  d: BoundedDrawable;
  children: DrawTree[];
  t: CtxTransform;
};
interface Drawable {
  draw(ctx: CanvasRenderingContext2D, transform: CtxTransform): DrawTree;
}
export const draw =
  (ctx: CanvasRenderingContext2D, t: CtxTransform = id) =>
  (d: Drawable) =>
    d.draw(ctx, t);

export interface BoundedDrawable extends Drawable {
  readonly w: number;
  readonly h: number;
}

class PathDrawable implements BoundedDrawable {
  constructor(readonly w: number, readonly h: number, readonly path: string) {}
  draw(ctx: CanvasRenderingContext2D, t: CtxTransform): DrawTree {
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
class LineDrawable implements BoundedDrawable {
  readonly w: number;
  readonly h: number;
  constructor(readonly line: Vec2[]) {
    this.w = width(line);
    this.h = height(line);
  }
  draw(ctx: CanvasRenderingContext2D, t: CtxTransform): DrawTree {
    const line = this.line;
    ctx.beginPath();
    if (line[0]) ctx.moveTo(...apply(t)(line[0]));
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
class TextDrawable implements BoundedDrawable {
  constructor(
    readonly w: number,
    readonly h: number,
    readonly text: string,
    readonly fontSize: number
  ) {}
  draw(ctx: CanvasRenderingContext2D, t: CtxTransform): DrawTree {
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
class TransformDrawable implements BoundedDrawable {
  readonly w: number;
  readonly h: number;
  constructor(
    /*readonly*/ public drawable: BoundedDrawable,
    readonly transform: CtxTransform,
    w?: number,
    h?: number
  ) {
    const [tw, th] = apply(transform)([drawable.w, drawable.h]);
    this.w = tw;
    this.h = th;
    if (w !== undefined) this.w = w;
    if (h !== undefined) this.h = h;
  }
  draw(ctx: CanvasRenderingContext2D, t: CtxTransform): DrawTree {
    const scaleFactor = length(apply(zeroTranslate(t))([1, 1]));
    return {
      d: this,
      children:
        scaleFactor < 0.02
          ? []
          : [this.drawable.draw(ctx, _(this.transform)(t))], // dont render small stuff
      t,
    };
  }
}
class EditorDrawable implements BoundedDrawable {
  readonly w: number;
  readonly h: number;
  constructor(/*readonly*/ public drawable: BoundedDrawable) {
    this.w = drawable.w;
    this.h = drawable.h;
  }
  draw(ctx: CanvasRenderingContext2D, t: CtxTransform): DrawTree {
    return {
      caretable: true,
      d: this,
      children: [this.drawable.draw(ctx, t)],
      t,
    };
  }
}
export const editor = (slot: BoundedDrawable) => new EditorDrawable(slot);
class DebugDrawable implements BoundedDrawable {
  readonly w: number;
  readonly h: number;
  constructor(/*readonly*/ public drawable: BoundedDrawable) {
    this.w = drawable.w;
    this.h = drawable.h;
  }
  draw(ctx: CanvasRenderingContext2D, t: CtxTransform): DrawTree {
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
class Drawables implements BoundedDrawable {
  readonly w: number;
  readonly h: number;
  constructor(readonly drawables: BoundedDrawable[]) {
    this.w = drawables.reduce((prev, cur) => Math.max(cur.w, prev), 0);
    this.h = drawables.reduce((prev, cur) => Math.max(cur.h, prev), 0);
  }
  draw(ctx: CanvasRenderingContext2D, t: CtxTransform): DrawTree {
    return {
      d: this,
      children: this.drawables.map((d) => d.draw(ctx, t)),
      t,
    };
  }
}
export const drawables = (...drawables: BoundedDrawable[]) =>
  new Drawables(drawables);

export const debug = (drawable: BoundedDrawable) => new DebugDrawable(drawable);

export const besideReducerThing =
  <D extends BoundedDrawable>(
    f: (x: number, h: number, d: D) => CtxTransform
  ) =>
  (...children: D[]): Drawables => {
    const h = children.reduce((prev, cur) => Math.max(cur.h, prev), 0);
    let transXAccum = 0;
    return new Drawables(
      children.map((d) => {
        const transX = transXAccum;
        transXAccum += d.w;
        return new TransformDrawable(d, f(transX, h, d));
      })
    );
  };

export const justBesideD = besideReducerThing((x) => translation([x, 0]));
export const centerBesideD = besideReducerThing((x, h, d) =>
  translation([x, (h - d.h) / 2])
);
const scaleToHT = (d: BoundedDrawable, h: number): CtxTransform =>
  scale([1, h / d.h]);
export const besideD = besideReducerThing((x, h, d) =>
  _(translation([x, 0]))(scaleToHT(d, h))
);

export const overReducerThing =
  <D extends BoundedDrawable>(
    f: (x: number, w: number, d: D) => CtxTransform
  ) =>
  (...children: D[]): Drawables => {
    const w = children.reduce((prev, cur) => Math.max(cur.w, prev), 0);
    let transYAccum = 0;
    return new Drawables(
      children.map((d) => {
        const transY = transYAccum;
        transYAccum += d.h;
        return new TransformDrawable(d, f(transY, w, d));
      })
    );
  };
export const justOverD = overReducerThing((y) => translation([0, y]));
export const centerOverD = overReducerThing((y, w, d) =>
  translation([(w - d.w) / 2, y])
);
const scaleToWT = (d: BoundedDrawable, w: number): CtxTransform =>
  scale([w / d.w, 1]);
export const overD = overReducerThing((y, w, d) =>
  _(translation([0, y]))(scaleToWT(d, w))
);

export const transformD =
  (transform: CtxTransform = id) =>
  (drawable: BoundedDrawable) =>
    new TransformDrawable(drawable, transform);
export const scaleD = (s: Vec2) => (drawable: BoundedDrawable) =>
  new TransformDrawable(drawable, scale(s));
export const translateD = (t: Vec2) => (drawable: BoundedDrawable) =>
  new TransformDrawable(drawable, translation(t));

export const padD = (p: Vec2) => (drawable: BoundedDrawable) =>
  new TransformDrawable(
    drawable,
    translation(p),
    drawable.w + p[0] * 2,
    drawable.h + p[1] * 2
  );

export const lineD = (line: Vec2[] = []) => new LineDrawable(line);

export const pathD = (path: string, w: number, h: number): PathDrawable =>
  new PathDrawable(w, h, path);

export const textD = (
  text: string,
  fontSize: number,
  w: number,
  h: number
): TextDrawable => new TextDrawable(w, h, text, fontSize);
