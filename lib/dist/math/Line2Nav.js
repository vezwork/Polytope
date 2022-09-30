import { EndoSetMapWithReverse } from "../data";
import { isAbove, isRight, segmentBetween } from "./Line2";
// assumes lines' points are monotonically increasing in the x coord
export function mergeAndSortLines(lines) {
    let newLines = [...lines];
    const aboveMap = EndoSetMapWithReverse.FromBinaryRelation(newLines, isAbove);
    const areTransitivelyBeside = (l1, l2) => !aboveMap.hasPathBetween(l1, l2) && !aboveMap.hasPathBetween(l2, l2);
    const cands = orderedTransitivelyBesideLines(lines, areTransitivelyBeside);
    // doneLeft and doneRight keep track of what ends of lines have already been merged (and should be ignored).
    const doneLeft = [];
    const doneRight = [];
    // mergeMap keeps track of the lines that lines have been merged into.
    const mergeMap = new Map();
    for (const { left, right } of cands) {
        if (!doneLeft.includes(left) && !doneRight.includes(right)) {
            const mLeft = mergeMap.get(left) ?? left;
            const mRight = mergeMap.get(right) ?? right;
            if (!areTransitivelyBeside(mLeft, mRight))
                continue;
            // MERGE
            // so that the merged line is above (in `aboveMap`) the lines that either of the merged lines were above.
            const mergeResult = [...mLeft, ...mRight];
            aboveMap.merge(mergeResult, mLeft, mRight);
            // After merging, we also need to add the `isAbove(mergeSegment, ol)` and vice-versa
            // while respecting anti-symmetry i.e. `if (isAbove(mergeSegment, ol) && !above.get(ol)?.has(mergeSegment))`
            const mergeSegment = segmentBetween(mLeft, mRight);
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
function orderedTransitivelyBesideLines(lines, areTransitivelyBeside) {
    // for all set-pairs of lines if mergable(left,right) then CANDS.append [{ left: Line, right: Line, dist: Number }]
    const cands = [];
    for (let i = 0; i < lines.length; i++) {
        for (let j = i; j < lines.length; j++) {
            const l = lines[i];
            const ol = lines[j];
            if (l.length === 0 || ol.length === 0)
                continue;
            if (areTransitivelyBeside(l, ol)) {
                const [left, right] = isRight(l, ol) ? [l, ol] : [ol, l];
                const [lp, rp] = segmentBetween(left, right);
                const distance = xBiasedDist(lp, rp);
                cands.push({ left, right, distance });
            }
        }
    }
    return cands.sort((a, b) => a.distance - b.distance);
}
