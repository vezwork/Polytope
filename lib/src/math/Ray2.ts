// https://codepen.io/vez/details/ZEaboYe

type Ray = {
  origin: {
    x: number;
    y: number;
  };
  dir: {
    x: number;
    y: number;
  };
};

type Box = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

// https://tavianator.com/2011/ray_box.html
export const intersection = (b: Box, r: Ray) => {
  const tx1 = (b.left - r.origin.x) / r.dir.x;
  const tx2 = (b.right - r.origin.x) / r.dir.x;

  let tmin = Math.min(tx1, tx2);
  let tmax = Math.max(tx1, tx2);

  const ty1 = (b.top - r.origin.y) / r.dir.y;
  const ty2 = (b.bottom - r.origin.y) / r.dir.y;

  tmin = Math.max(tmin, Math.min(ty1, ty2));
  tmax = Math.min(tmax, Math.max(ty1, ty2));

  if (tmax >= tmin && tmax >= 0) {
    if (tmin < 0) {
      return {
        x: r.origin.x + tmax * r.dir.x,
        y: r.origin.y + tmax * r.dir.y,
      };
    } else {
      return {
        x: r.origin.x + tmin * r.dir.x,
        y: r.origin.y + tmin * r.dir.y,
      };
    }
  }
  return null;
};
