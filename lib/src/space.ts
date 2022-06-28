// https://codepen.io/vezwork/pen/XWZLBVr?editors=1010

/**
 * https://developer.mozilla.org/en-US/docs/Web/CSS/CSSOM_View/Coordinate_systems#page
 *
 * number of pixels offset from the top left of the page.
 **/
type PagePixels = number;
/**
 * A caret sink represents a position that a caret could be in.
 */
type CaretSink = {
  top: PagePixels;
  bottom: PagePixels;
  x: PagePixels;
};

/** Given a map that represents an undirected graph
 * (specifically a linear forest en.wikipedia.org/wiki/Path_graph)
 * returns an ordered array of arrays,
 * each sub-array corresponding to a path in the graph.
 */
function verticallyOrderedlinesFromHorizontalNavMaps(
  linearForest: Map<CaretSink, CaretSink>
): CaretSink[][] {
  const lines: CaretSink[][] = [];
  const starts = new Map<CaretSink, CaretSink[]>();

  for (const [to, from] of linearForest) {
    const line = starts.get(from);
    if (line) {
      line.unshift(to);
      starts.delete(from);
      starts.set(to, line);
    } else {
      const newLine = [to, from];
      lines.push(newLine);
      starts.set(to, newLine);
    }
  }
  return lines.sort(
    (lineA, lineB) =>
      Math.max(...lineA.map(({ top }) => top)) -
      Math.max(...lineB.map(({ top }) => top))
  );
}

/**
 * Given caret sinks, returns maps represented an undirected graph
 * (specifically a linear forest en.wikipedia.org/wiki/Path_graph)
 * where each caret sink's neighbors vertically (but not horizontally!) overlap with it.
 *
 * returns `toNav` and `fromNav` which are the same maps but with keys and value reversed.
 * Ideally these would be one two-way Map object but we don't have one.
 *
 * adapted from: codepen.io/vezwork/pen/KKQjQVW
 */
function horizontalNavMaps(caretSinks: CaretSink[]) {
  let toNav = new Map<CaretSink, CaretSink>();
  let fromNav = new Map<CaretSink, CaretSink>();

  for (const caretSink of caretSinks.sort((c1, c2) => c1.top - c2.top)) {
    const verticalOverlappedAndRightwardsSinks = caretSinks
      .filter(
        ({ top, bottom, x }) =>
          x > caretSink.x &&
          overlap([top, bottom], [caretSink.top, caretSink.bottom]) > 0
      )
      .sort((c1, c2) => c1.x - c2.x);

    const navCaretSink = !toNav.has(verticalOverlappedAndRightwardsSinks[0])
      ? verticalOverlappedAndRightwardsSinks[0]
      : null;

    if (navCaretSink) {
      fromNav.set(caretSink, navCaretSink);
      toNav.set(navCaretSink, caretSink);
    }
  }
  return { fromNav, toNav };
}

function overlap(
  [min1, max1]: [number, number],
  [min2, max2]: [number, number]
): number {
  return Math.max(0, Math.min(max1, max2) - Math.max(min1, min2));
}
