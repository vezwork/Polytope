import { id, _, apply, translation, scale, zeroTranslate, } from "../math/CtxTransform.js";
import { x, y, length } from "../math/Vec2.js";
// function stuff
//const _ = (f) => (g) => (arg) => f(g(arg)); // compose functions
const forkLift = (liftFn) => (ps) => (arg) => liftFn((fn) => fn(arg))(ps);
const arrLiftFn = (fn) => (ps) => ps.map(fn);
const jsonLiftFn = (fn) => (arg) => {
    if (Array.isArray(arg))
        return arg.map(jsonLiftFn(fn));
    if (typeof arg === "object" && arg !== null) {
        return Object.fromEntries(Object.entries(arg).map(([key, value]) => [key, jsonLiftFn(fn)(value)]));
    }
    return fn(arg);
};
const arrFork = forkLift(arrLiftFn);
// math stuff
const max = (args) => Math.max(...args, 0);
const min = (args) => Math.min(...args, 0);
const minAndMax = arrFork([min, max]);
const distanceFromSpan = ([min, max]) => Math.abs(max - min);
const l = {
    w: (ps) => distanceFromSpan(minAndMax(arrLiftFn(x)(ps))),
    h: (ps) => distanceFromSpan(minAndMax(arrLiftFn(y)(ps))),
};
export const tTree = (d, t = id) => {
    const scaleFactor = length(apply(zeroTranslate(t))([1, 1]));
    if (scaleFactor < 0.02)
        return; // dont render small stuff
    if ("line" in d) {
        return { line: d, t };
    }
    else if ("path" in d) {
        return { path: d, t };
    }
    else if ("text" in d) {
        return { text: d, t };
    }
    else if ("transformedDrawables" in d)
        return d.transformedDrawables.map(({ transform, drawable }) => tTree(drawable, _(transform)(t)));
};
export const render = (ctx, d, t = id) => {
    const scaleFactor = length(apply(zeroTranslate(t))([1, 1]));
    if (scaleFactor < 0.002)
        return; // dont render small stuff
    if ("line" in d) {
        const line = d.line;
        ctx.beginPath();
        //ctx.setTransform(...t);
        if (line[0])
            ctx.moveTo(...apply(t)(line[0]));
        for (const p of line) {
            ctx.lineTo(...apply(t)(p));
        }
        ctx.stroke();
        ctx.closePath();
        //ctx.resetTransform();
    }
    else if ("path" in d) {
        var p = new Path2D(d.path);
        ctx.setTransform(...t);
        ctx.fill(p);
        ctx.resetTransform();
    }
    else if ("text" in d) {
        ctx.setTransform(...t);
        // ctx.setLineDash([5, 5]);
        // ctx.strokeStyle = "red";
        // ctx.stroke(new Path2D(`M0 0 h ${d.w} v ${d.h} h ${-d.w} Z`));
        ctx.translate(0, d.h);
        ctx.font = `${d.fontSize}px serif`;
        ctx.textBaseline = "alphabetic";
        ctx.fillText(d.text, 0, 0);
        ctx.resetTransform();
    }
    else if ("transformedDrawables" in d)
        for (const { transform, drawable } of d.transformedDrawables)
            render(ctx, drawable, _(transform)(t));
};
const scaleToWT = (d, w) => scale([w / d.w, 1]);
const scaleToHT = (d, h) => scale([1, h / d.h]);
export const justBesideD = (...children) => {
    let transXAccum = 0;
    const w = children.reduce((prev, cur) => cur.w + prev, 0);
    const h = children.reduce((prev, cur) => Math.max(cur.h, prev), 0);
    return {
        w,
        h,
        transformedDrawables: children.map((drawable) => {
            const transX = transXAccum;
            transXAccum += drawable.w;
            return {
                transform: translation([transX, 0]),
                drawable,
            };
        }),
    };
};
export const centerBesideD = (...children) => {
    let transXAccum = 0;
    const w = children.reduce((prev, cur) => cur.w + prev, 0);
    const h = children.reduce((prev, cur) => Math.max(cur.h, prev), 0);
    return {
        w,
        h,
        transformedDrawables: children.map((drawable) => {
            const transX = transXAccum;
            transXAccum += drawable.w;
            return {
                transform: translation([transX, (h - drawable.h) / 2]),
                drawable,
            };
        }),
    };
};
export const besideD = (...children) => {
    let transXAccum = 0;
    const w = children.reduce((prev, cur) => cur.w + prev, 0);
    const h = children.reduce((prev, cur) => Math.max(cur.h, prev), 0);
    return {
        w,
        h,
        transformedDrawables: children.map((drawable) => {
            const transX = transXAccum;
            transXAccum += drawable.w;
            return {
                transform: _(translation([transX, 0]))(scaleToHT(drawable, h)),
                drawable,
            };
        }),
    };
};
export const justOverD = (...children) => {
    let transYAccum = 0;
    const w = children.reduce((prev, cur) => Math.max(cur.w, prev), 0);
    const h = children.reduce((prev, cur) => cur.h + prev, 0);
    return {
        w,
        h,
        transformedDrawables: children.map((drawable) => {
            let transY = transYAccum;
            transYAccum += drawable.h;
            return {
                transform: translation([0, transY]),
                drawable,
            };
        }),
    };
};
export const centerOverD = (...children) => {
    let transYAccum = 0;
    const w = children.reduce((prev, cur) => Math.max(cur.w, prev), 0);
    const h = children.reduce((prev, cur) => cur.h + prev, 0);
    return {
        w,
        h,
        transformedDrawables: children.map((drawable) => {
            let transY = transYAccum;
            transYAccum += drawable.h;
            return {
                transform: translation([(w - drawable.w) / 2, transY]),
                drawable,
            };
        }),
    };
};
export const overD = (...children) => {
    let transYAccum = 0;
    const w = children.reduce((prev, cur) => Math.max(cur.w, prev), 0);
    const h = children.reduce((prev, cur) => cur.h + prev, 0);
    return {
        w,
        h,
        transformedDrawables: children.map((drawable) => {
            let transY = transYAccum;
            transYAccum += drawable.h;
            return {
                transform: _(translation([0, transY]))(scaleToWT(drawable, w)),
                drawable,
            };
        }),
    };
};
export const transformD = (drawable, transform = id) => {
    const [w, h] = apply(transform)([drawable.w, drawable.h]);
    return {
        w,
        h,
        transformedDrawables: [{ transform, drawable }],
    };
};
export const scaleD = (drawable, s = [0, 0]) => ({
    w: drawable.w * s[0],
    h: drawable.h * s[1],
    transformedDrawables: [{ transform: scale(s), drawable }],
});
export const translateD = (drawable, t = [0, 0]) => ({
    w: drawable.w + t[0],
    h: drawable.h + t[1],
    transformedDrawables: [{ transform: translation(t), drawable }],
});
export const padD = (drawable, pad = [0, 0]) => ({
    w: drawable.w + pad[0] * 2,
    h: drawable.h + pad[1] * 2,
    transformedDrawables: [{ transform: translation(pad), drawable }],
});
export const lineD = (line = []) => ({
    w: l.w(line),
    h: l.h(line),
    line,
});
// need to know how to to discriminate this and draw this
export const pathD = (path, w, h) => {
    return {
        w,
        h,
        path,
    };
};
export const textD = (text, fontSize, w, h) => {
    return {
        fontSize,
        w,
        h,
        text,
    };
};
