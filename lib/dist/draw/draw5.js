import { apply, zeroTranslate, } from "../math/CtxTransform.js";
import { height, width } from "../math/Line2.js";
import { length } from "../math/Vec2.js";
export const l = (line) => (ctx) => {
    ctx.beginPath();
    if (line[0])
        ctx.moveTo(...line[0]);
    for (const p of line)
        ctx.lineTo(...p);
    ctx.stroke();
    ctx.closePath();
    return [width(line), height(line)];
};
export const t = (t) => (d) => (ctx) => {
    const scaleFactor = length(apply(zeroTranslate(t))([1, 1]));
    if (scaleFactor < 0.02)
        return [0, 0]; // dont render small stuff
    ctx.transform(...t);
    const dim = d(ctx);
    ctx.resetTransform();
    return apply(t)(dim);
};
