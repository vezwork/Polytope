import { EndoSetMapWithReverse } from "../structure/data.js";
import { isAbove, isRight } from "./Line2.js";
// assumes lines' points are monotonically increasing in the x coord
export function mergeAndSortLines(lines) {
    let newLines = [...lines];
    const aboveMap = EndoSetMapWithReverse.FromBinaryRelation(newLines, isAbove);
    const cands = orderedTransitivelyBesideLines(lines, (l1, l2) => aboveMap.hasPathOrReversePathBetween(l1, l2));
    // doneLeft and doneRight keep track of what ends of lines have already been merged (and should be ignored).
    const doneLeft = [];
    const doneRight = [];
    // mergeMap keeps track of the lines that lines have been merged into.
    const mergeMap = new Map();
    for (const { left, right } of cands) {
        if (!doneLeft.includes(left) && !doneRight.includes(right)) {
            const mLeft = mergeMap.get(left) ?? left;
            const mRight = mergeMap.get(right) ?? right;
            if (aboveMap.hasPathOrReversePathBetween(mLeft, mRight))
                continue;
            // MERGE
            // so that the merged line is above (in `aboveMap`) the lines that either of the merged lines were above.
            const mergeResult = [...mLeft, ...mRight];
            aboveMap.merge(mergeResult, mLeft, mRight);
            // After merging, we also need to add the `isAbove(mergeSegment, ol)` and vice-versa
            // while respecting anti-symmetry i.e. `if (isAbove(mergeSegment, ol) && !above.get(ol)?.has(mergeSegment))`
            const mergeSegment = [mLeft.at(-1), mRight.at(0)];
            for (const ol of newLines) {
                if (isAbove(mergeSegment, ol) && !aboveMap.get(ol)?.has(mergeResult))
                    aboveMap.add(mergeResult, ol);
                if (isAbove(ol, mergeSegment) && !aboveMap.get(mergeResult)?.has(ol))
                    aboveMap.add(ol, mergeResult);
            }
            newLines = newLines.filter((ol) => ol !== mLeft && ol !== mRight);
            newLines.push(mergeResult);
            doneLeft.push(left);
            doneRight.push(right);
            mergeMap.set(mLeft, mergeResult);
            mergeMap.set(mRight, mergeResult);
        }
    }
    const gradedNewLines = newLines.map((l) => ({
        l,
        grade: newLines.reduce((acc, ol) => acc + Number(aboveMap.hasPathBetween(l, ol)), 0),
    }));
    return gradedNewLines
        .sort((gl1, gl2) => gl2.grade - gl1.grade)
        .map(({ l }) => l);
}
const xBiasedDist = ([x1, y1], [x2, y2]) => Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 4);
function orderedTransitivelyBesideLines(lines, areTransitivelyAbove) {
    const cands = [];
    for (const l of lines) {
        for (const ol of lines) {
            if (l.length === 0 || ol.length === 0)
                continue;
            if (areTransitivelyAbove(l, ol))
                continue;
            const [left, right] = isRight(l, ol) ? [l, ol] : [ol, l];
            const distance = xBiasedDist(left.at(-1), right.at(0));
            cands.push({ left, right, distance });
        }
    }
    return cands.sort((a, b) => a.distance - b.distance);
}
