import { EndoSetMapWithReverse } from "../data.js";

// assumes lines' points are monotonically increasing in the x coord
export function makeMergeAndSortLines<T>(
  isAbove: (l1: T[], l2: T[]) => boolean,
  isRight: (l1: T[], l2: T[]) => boolean,
  dist: (t1: T, t2: T) => number
) {
  return (lines: T[][]): T[][] => {
    let newLines = [...lines];
    const aboveMap = EndoSetMapWithReverse.FromBinaryRelation(
      newLines,
      isAbove
    );

    const candidator = orderedTransitivelyBesideLines(isRight, dist, (l1, l2) =>
      aboveMap.hasPathOrReversePathBetween(l1, l2)
    );

    const cands = candidator(lines);

    // doneLeft and doneRight keep track of what ends of lines have already been merged (and should be ignored).
    const doneLeft: T[][] = [];
    const doneRight: T[][] = [];
    // mergeMap keeps track of the lines that lines have been merged into.
    const mergeMap = new Map<T[], T[]>();
    for (const { left, right } of cands) {
      if (!doneLeft.includes(left) && !doneRight.includes(right)) {
        const mLeft = mergeMap.get(left) ?? left;
        const mRight = mergeMap.get(right) ?? right;

        if (aboveMap.hasPathOrReversePathBetween(mLeft, mRight)) continue;

        // MERGE
        // so that the merged line is above (in `aboveMap`) the lines that either of the merged lines were above.
        const mergeResult = [...mLeft, ...mRight];
        aboveMap.merge(mergeResult, mLeft, mRight);
        // After merging, we also need to add the `isAbove(mergeSegment, ol)` and vice-versa
        // while respecting anti-symmetry i.e. `if (isAbove(mergeSegment, ol) && !above.get(ol)?.has(mergeSegment))`
        const mergeSegment = [mLeft.at(-1), mRight.at(0)] as [T, T];
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
      grade: newLines.reduce(
        (acc, ol) => acc + Number(aboveMap.hasPathBetween(l, ol)),
        0
      ),
    }));
    return gradedNewLines
      .sort((gl1, gl2) => gl2.grade - gl1.grade)
      .map(({ l }) => l);
  };
}

function orderedTransitivelyBesideLines<T>(
  isRight: (l1: T[], l2: T[]) => boolean,
  dist: (t1: T, t2: T) => number,
  isOver: (l1: T[], l2: T[]) => boolean
) {
  return (lines: T[][]): { left: T[]; right: T[]; distance: number }[] => {
    const cands: { left: T[]; right: T[]; distance: number }[] = [];
    for (const l of lines) {
      for (const ol of lines) {
        if (l.length === 0 || ol.length === 0) continue;
        if (isOver(l, ol)) continue;

        const [left, right] = isRight(l, ol) ? [l, ol] : [ol, l];
        const distance = dist(left.at(-1) as T, right.at(0) as T);
        cands.push({ left, right, distance });
      }
    }
    return cands.sort((a, b) => a.distance - b.distance);
  };
}
