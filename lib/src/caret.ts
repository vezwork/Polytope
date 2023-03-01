import { findIndex2D, min, wrapLinesAddXIndex2D } from "./Arrays.js";
import { closestElementToPosition } from "./closestElement.js";
import * as Fn from "./Functions.js";
import * as Iter from "./Iterable.js";
import { segXProj } from "./math/Line2.js";
import { make2DLineFunctions } from "./math/LineT.js";
import { seperatingInterval } from "./math/NumberInterval.js";
import { makeTreeFunctions } from "./structure/tree.js";

type Bounds = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
  x: number;
  y: number;
};

//mousedown
//closestSinkToPosition(this)([e.clientX, e.clientY])?.makeFocused();
//keydown
//next(this, e.key)?.makeFocused();
//unfocus
//this.carryX = null;

// const closestSinkToPosition =
//     (editor: CaretHost) =>
//     (position: [number, number]): CaretHost | null =>
//       null;
//   //closestElementToPosition(editor, children(editor), position);

// const parent = (e: CaretHost): CaretHost | null => null;
// //(e.parentElement?.closest("[isEditor=true]") as EditorElement) ?? null;

// const descendents = (e: CaretHost): CaretHost[] => [];
// //e.querySelectorAll(`[isEditor=true]`) as NodeListOf<EditorElement>;

// const children = (e: CaretHost) =>
//   Iter.filter(descendents(e), (d) => parent(d) === e);

export function makeCaretFunctions<CaretHost>({
  getBounds,
  parent,
  children,
  getCarryX,
  setCarryX,
  closestSinkToPosition,
}: {
  parent: (c: CaretHost) => CaretHost;
  children: (c: CaretHost) => Iterable<CaretHost>;
  getBounds: (c: CaretHost) => Bounds;
  getCarryX: (c: CaretHost) => number;
  setCarryX: (c: CaretHost) => (carryX: number) => void;
  closestSinkToPosition: (
    c: CaretHost
  ) => (position: [number, number]) => CaretHost | null;
}) {
  enum ExitEditorDirection {
    up,
    right,
    down,
    left,
  }

  type FocusFromChildEditorArgs =
    | {
        childEditor: CaretHost;
        direction: ExitEditorDirection.left | ExitEditorDirection.right;
      }
    | {
        childEditor: CaretHost;
        direction: ExitEditorDirection.up | ExitEditorDirection.down;
        x: number;
      };

  enum EnterEditorDirection {
    up,
    right,
    down,
    left,
  }

  type FocusFromParentEditorArgs =
    | {
        direction: EnterEditorDirection.left | EnterEditorDirection.right;
      }
    | {
        direction: EnterEditorDirection.up | EnterEditorDirection.down;
        x: number;
      };

  const EdElTree = makeTreeFunctions<CaretHost>({
    parent,
    children,
  });

  const next = (
    e: CaretHost,
    key: "ArrowUp" | "ArrowRight" | "ArrowDown" | "ArrowLeft"
  ): CaretHost | null =>
    EdElTree.hasChildren(e) ? parentNext(e, key) : leafNext(e, key);

  const parentNext = (
    childEditor: CaretHost,
    key: "ArrowUp" | "ArrowRight" | "ArrowDown" | "ArrowLeft"
  ): CaretHost | null => {
    if (key === "ArrowLeft") {
      return (
        childFromParentNext(Iter.last(children(childEditor)) ?? null, {
          direction: EnterEditorDirection.right,
        }) ?? null
      );
    } else {
      return parentFromChildNext(parent(childEditor), {
        childEditor,
        direction: exitEditorDirectionFromKey(key),
        x: getCarryX(childEditor) ?? getBounds(childEditor).right,
      });
    }
  };
  const leafNext = (
    childEditor: CaretHost,
    key: "ArrowUp" | "ArrowRight" | "ArrowDown" | "ArrowLeft"
  ): CaretHost | null =>
    parentFromChildNext(parent(childEditor), {
      childEditor,
      direction: exitEditorDirectionFromKey(key),
      x: getCarryX(childEditor) ?? getBounds(childEditor).right,
    }) ?? null;

  const parentFromChildNext = (
    editor: CaretHost | null,
    args: FocusFromChildEditorArgs
  ): CaretHost | null => {
    if (editor === null) return null;
    const { childEditor, direction } = args;

    if (!Iter.some(children(editor), Fn.eq(childEditor)))
      throw "focusFromChildEditor: childEditor was not found in the parent";

    if (
      direction === ExitEditorDirection.up ||
      direction === ExitEditorDirection.down
    ) {
      setCarryX(editor)(args.x);
    }

    let toChild: CaretHost | null = null;
    if (ExitEditorDirection.up === direction)
      toChild = childAbove(editor)(childEditor);
    if (ExitEditorDirection.right === direction)
      toChild = childAfter(editor)(childEditor);
    if (ExitEditorDirection.down === direction)
      toChild = childBelow(editor)(childEditor);
    if (ExitEditorDirection.left === direction)
      toChild = childBefore(editor)(childEditor);

    if (toChild) {
      return (
        childFromParentNext(toChild, {
          direction: enterDirectionFromExitDirection(direction),
          x: getCarryX(editor) ?? getBounds(childEditor).right,
        }) ?? null
      );
    } else {
      if (direction === ExitEditorDirection.right) {
        return editor;
      } else {
        return (
          parentFromChildNext(parent(editor), {
            childEditor: editor,
            direction,
            x: getCarryX(editor) ?? getBounds(editor).right,
          }) ?? null
        );
      }
    }
  };

  const childFromParentNext = (
    editor: CaretHost | null,
    args: FocusFromParentEditorArgs
  ): CaretHost | null => {
    if (editor === null) return null;
    if (
      args.direction === EnterEditorDirection.up ||
      args.direction === EnterEditorDirection.down
    ) {
      setCarryX(editor)(args.x);
    }

    return EdElTree.hasChildren(editor)
      ? parentFromParentNext(editor, args)
      : editor;
  };

  const parentFromParentNext = (
    editor: CaretHost,
    args: FocusFromParentEditorArgs
  ): CaretHost | null => {
    const { direction } = args;
    if (direction === EnterEditorDirection.up) {
      const { x } = args;
      const myBound = getBounds(editor);
      const a = closestSinkToPosition(editor)([x, myBound.top]);
      return a === editor
        ? editor
        : childFromParentNext(a, { direction, x }) ?? null;
    } else if (direction === EnterEditorDirection.down) {
      const { x } = args;
      const myBound = getBounds(editor);
      const a = closestSinkToPosition(editor)([x, myBound.bottom]);
      return a === editor
        ? editor
        : childFromParentNext(a, { direction, x }) ?? null;
    } else if (direction === EnterEditorDirection.left)
      return (
        childFromParentNext(Iter.first(children(editor)) ?? null, args) ?? null
      );
    else if (direction === EnterEditorDirection.right) return editor;
    return null;
  };

  const childAbove =
    (editor: CaretHost) =>
    (childEditor: CaretHost): CaretHost | null =>
      above(childEditor, children(editor), getCarryX(editor));
  const childBelow =
    (editor: CaretHost) =>
    (childEditor: CaretHost): CaretHost | null =>
      below(childEditor, children(editor), getCarryX(editor));
  const childAfter =
    (editor: CaretHost) =>
    (childEditor: CaretHost): CaretHost | null =>
      after(childEditor, children(editor));
  const childBefore =
    (editor: CaretHost) =>
    (childEditor: CaretHost): CaretHost | null =>
      before(childEditor, children(editor));

  function exitEditorDirectionFromKey(
    key: "ArrowUp" | "ArrowRight" | "ArrowDown" | "ArrowLeft"
  ): ExitEditorDirection {
    return {
      ArrowUp: ExitEditorDirection.up,
      ArrowRight: ExitEditorDirection.right,
      ArrowDown: ExitEditorDirection.down,
      ArrowLeft: ExitEditorDirection.left,
    }[key];
  }

  function enterDirectionFromExitDirection(
    exitDirection: ExitEditorDirection
  ): EnterEditorDirection {
    return {
      [ExitEditorDirection.up]: EnterEditorDirection.down,
      [ExitEditorDirection.right]: EnterEditorDirection.left,
      [ExitEditorDirection.down]: EnterEditorDirection.up,
      [ExitEditorDirection.left]: EnterEditorDirection.right,
    }[exitDirection];
  }

  function after(box: CaretHost, boxes: Iterable<CaretHost>): CaretHost | null {
    const { lines, index } = linesAndIndex(box, boxes);
    const [y1, x1] = wrapLinesAddXIndex2D(lines, index, +2); // 2 YIntervals per box
    return lines[y1]?.[x1]?.data ?? null;
  }

  function below(
    box: CaretHost,
    boxes: Iterable<CaretHost>,
    carryX: number | null
  ): CaretHost | null {
    const {
      lines,
      index: [y, x],
    } = linesAndIndex(box, boxes);
    const nextLine = lines[y + 1] ?? [];
    const closestInNextLine = min(nextLine, ({ data }) =>
      carryX ? numXDist(carryX, data!) : xDist(box, data!)
    );
    return closestInNextLine?.data ?? null;
  }

  function before(
    box: CaretHost,
    boxes: Iterable<CaretHost>
  ): CaretHost | null {
    const { lines, index } = linesAndIndex(box, boxes);
    const [y1, x1] = wrapLinesAddXIndex2D(lines, index, -2); // 2 YIntervals per box
    return lines[y1]?.[x1]?.data ?? null;
  }

  function above(
    box: CaretHost,
    boxes: Iterable<CaretHost>,
    carryX: number | null
  ): CaretHost | null {
    const {
      lines,
      index: [y, x],
    } = linesAndIndex(box, boxes);
    const prevLine = lines[y - 1] ?? [];
    const closestInPrevLine = min(prevLine, ({ data }) =>
      carryX ? numXDist(carryX, data!) : xDist(box, data!)
    );
    return closestInPrevLine?.data ?? null;
  }

  function numXDist(n: number, el: CaretHost): number {
    const a = getBounds(el);
    if (n > a.left && n < a.right) return 0;
    if (n >= a.right) return n - a.right;
    if (n <= a.left) return a.left - n;
    return 0;
  }

  function xDist(el1: CaretHost, el2: CaretHost): number {
    const a = getBounds(el1);
    const b = getBounds(el2);
    if (a.left > b.left && a.right < b.right) return 0;
    if (b.left > a.left && b.right < a.right) return 0;
    if (a.left > b.right) return a.left - b.right;
    if (b.left < a.right) return b.left - a.right;
    return 0;
  }

  type YInterval = {
    n: number;
    interval: [number, number];
    data?: CaretHost;
  };

  const top = ({ n, interval: [top, _] }: YInterval): [number, number] => [
    n,
    top,
  ]; // assuming interval[0] is top, which is not enforced
  const yIntervalFromTop = ([n, top]: [number, number]): YInterval => ({
    n,
    interval: [top, top],
  });

  const xBiasedDist = ([x1, y1], [x2, y2]) =>
    Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 4);

  const { mergeAndSort } = make2DLineFunctions<YInterval>({
    dist: (a, b) => {
      const i = seperatingInterval(a.interval, b.interval);
      if (i === null) return Math.sqrt((a.n - b.n) ** 2); // intervals overlap so just get 1D distance
      return xBiasedDist([a.n, i[0]], [b.n, i[1]]);
    },
    // wish these could be editors/polygons that get deconstructed, projected, then reconstructed somehow
    xProj:
      ([p1, p2]) =>
      (p) =>
        yIntervalFromTop(segXProj([top(p1), top(p2)])(top(p))),
    isPointLeft: (p1) => (p2) => p1.n < p2.n,
    isPointBelow: (p1) => (p2) => top(p1)[1] > top(p2)[1],
  });

  function leftAndRightYIntervalsFromEditorElement(
    el: CaretHost
  ): [YInterval, YInterval] {
    const r = getBounds(el);
    const yInterval = {
      interval: [r.top, r.bottom] as [number, number],
      data: el,
    };
    return [
      { ...yInterval, n: r.left },
      { ...yInterval, n: r.right },
    ];
  }

  function linesAndIndex(
    el: CaretHost,
    els: Iterable<CaretHost>
  ): { lines: YInterval[][]; index: [number, number] } {
    const caretSinks = Iter.map(els, leftAndRightYIntervalsFromEditorElement);

    const lines = mergeAndSort(caretSinks);

    const index = findIndex2D(lines, (p: YInterval) => p.data === el);

    return { lines, index };
  }

  return {
    next,
    linesAndIndex,
  };
}
