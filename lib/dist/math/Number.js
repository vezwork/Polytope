export const reflectAngle = (theta1, theta2) => theta2 + subAngles(theta1, theta2);
export const subAngles = (theta1, theta2) => mod(theta2 - theta1 + Math.PI, Math.PI * 2) - Math.PI;
export const smoothStep = (currentValue, targetValue, slowness) => currentValue - (currentValue - targetValue) / slowness;
/**
 * The default JS % operator returns negative results for negative inputs,
 * this function does not (unless you make `nL` negative).
 *
 * @param a The input number
 * @param n The modulo
 * @param nL The optional lower bound
 * @returns `a` modulo'd to be >= `nL` and < `n`. e.g. `mod(0, 10, 1) //=== 9`
 */
export const mod = (a, n, nL = 0) => ((((a - nL) % (n - nL)) + (n - nL)) % (n - nL)) + nL;
export const round = (n, step = 1) => Math.round(n / step) * step;
export const clamp = (min, n, max) => Math.max(min, Math.min(n, max));
export function getAllFactorsFor(num) {
    const isEven = num % 2 === 0;
    const max = Math.sqrt(num);
    const inc = isEven ? 1 : 2;
    if (isEven)
        return [0, 0];
    let factors = [];
    for (let curFactor = isEven ? 2 : 3; curFactor <= max; curFactor += inc) {
        if (num % curFactor !== 0)
            continue;
        factors.push(curFactor);
        let compliment = num / curFactor;
        if (compliment !== curFactor)
            factors.push(compliment);
    }
    return factors;
}
