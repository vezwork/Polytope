import { pairs } from "../Iterable.js";
import { EndoSetMapWithReverse } from "../structure/data.js";
// assumes lines are monotonic in x coord i.e. isPointLeft(l[n], l[n+1]) === true for all l and n.
export function make2DLineFunctions({ dist, // for mergeAndSort
xProj, isPointLeft, isPointBelow, }) {
    function isRight(l1, l2) {
        if (l1.length === 0 || l2.length === 0)
            return true;
        return isPointLeft(l1.at(-1))(l2[0]);
    }
    function isLeft(l1, l2) {
        return isRight(l2, l1);
    }
    function isAside(l1, l2) {
        return isRight(l1, l2) || isLeft(l1, l2);
    }
    // -1: point below
    // 0: point and line incomparable
    // 1: point above
    function pointCompareLine(p, line) {
        for (const seg of pairs(line)) {
            if (!isAside([p], seg)) {
                const pxOnSeg = xProj(seg)(p);
                return isPointBelow(pxOnSeg)(p) ? 1 : -1;
            }
        }
        return 0;
    }
    /** is l1 above l2 ? */
    function isAbove(l1, l2) {
        for (const p of l1) {
            const comp = pointCompareLine(p, l2);
            if (comp !== 0)
                return comp === 1;
        }
        for (const p of l2) {
            const comp = pointCompareLine(p, l1);
            if (comp !== 0)
                return comp === -1;
        }
        return false;
    }
    // assumes lines' points are monotonically increasing in the x coord
    function mergeAndSort(lines) {
        let newLines = [...lines];
        const aboveMap = EndoSetMapWithReverse.FromBinaryRelation(newLines, isAbove);
        const cands = sortTransitivelyBeside({
            isBeside: (l1, l2) => !aboveMap.hasPathOrReversePathBetween(l1, l2),
        })(newLines);
        // doneLeft and doneRight keep track of what ends of lines have already been merged (and should be ignored).
        const doneLeft = [];
        const doneRight = [];
        // mergeMap keeps track of the lines that lines have been merged into.
        const mergeMap = new Map();
        for (const { left, right } of cands) {
            if (!doneLeft.includes(left) && !doneRight.includes(right)) {
                let mLeft = left; // left may have already merged
                while (mergeMap.has(mLeft))
                    mLeft = mergeMap.get(mLeft);
                let mRight = right; // left may have already merged
                while (mergeMap.has(mRight))
                    mRight = mergeMap.get(mRight);
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
    const sortTransitivelyBeside = ({ isBeside }) => (lines) => {
        const cands = [];
        for (const l of lines) {
            for (const ol of lines) {
                if (l === ol)
                    continue;
                if (l.length === 0 || ol.length === 0)
                    continue;
                if (!isBeside(l, ol))
                    continue;
                const [left, right] = isRight(l, ol) ? [l, ol] : [ol, l];
                const distance = dist(left.at(-1), right.at(0));
                cands.push({ left, right, distance });
            }
        }
        return cands.sort((a, b) => a.distance - b.distance);
    };
    return {
        isAside,
        isRight,
        isLeft,
        isAbove,
        mergeAndSort,
        sortTransitivelyBeside,
    };
}
