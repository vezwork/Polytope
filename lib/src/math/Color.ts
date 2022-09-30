export function cssRgbFromGradientSample(c1, c2, percent) {
  return cssRgbFromRgb(rgbFromGradientSample(c1, c2, percent));
}

export function rgbFromGradientSample(c1, c2, percent) {
  const [r1, g1, b1] = rgbFromNum(c1);
  const [r2, g2, b2] = rgbFromNum(c2);
  const b = Math.round(b1 + percent * (b2 - b1));
  const g = Math.round(g1 + percent * (g2 - g1));
  const r = Math.round(r1 + percent * (r2 - r1));
  return [r, g, b];
}

export function rgbFromNum(num) {
  num >>>= 0;
  const b = num & 0xff;
  const g = (num & 0xff00) >>> 8;
  const r = (num & 0xff0000) >>> 16;
  return [r, g, b];
}

export const numFromRGB = ([r, g, b]) => {
  return (r << 16) + (g << 8) + b;
};

export function cssRgbFromRgb(rgb) {
  return "rgb(" + rgb.join(",") + ")";
}

export function cssRgbFromNum(num) {
  return cssRgbFromRgb(rgbFromNum(num));
}

export const interpolateHex = (hexColor1, hexColor2, value = 0.5) => {
  const [r1, g1, b1] = rgbFromNum(hexColor1);
  const [r2, g2, b2] = rgbFromNum(hexColor2);
  return cssRgbFromRgb([
    r1 * value + r2 * (1 - value),
    g1 * value + g2 * (1 - value),
    b1 * value + b2 * (1 - value),
  ]);
};

export function numberToCSSColorString(n) {
  n = Math.floor(n % (255 * 6));
  if (n < 255) {
    return `rgb(255,${n},0)`;
  } else if (n < 255 * 2) {
    return `rgb(${255 * 2 - n},255,0)`;
  } else if (n < 255 * 3) {
    return `rgb(0,255,${n - 255 * 2})`;
  } else if (n < 255 * 4) {
    return `rgb(0,${255 * 4 - n},255)`;
  } else if (n < 255 * 5) {
    return `rgb(${n - 255 * 4},0,255)`;
  } else if (n < 255 * 6) {
    return `rgb(255,0,${255 * 6 - n})`;
  }
}
