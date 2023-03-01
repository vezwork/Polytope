import { findIndex2D, min, wrapLinesAddXIndex2D } from "./Arrays.js";
import { closestElementToPosition } from "./closestElement.js";
import * as Fn from "./Functions.js";
import * as Iter from "./Iterable.js";
import { segXProj } from "./math/Line2.js";
import { make2DLineFunctions } from "./math/LineT.js";
import { seperatingInterval } from "./math/NumberInterval.js";
import { makeTreeFunctions } from "./structure/tree.js";

/**
 * ideas:
 * - BYOTopology object i.e. directionalAndPositionCaretNav = { childAbove, closestSinkToPos,... }
 *   - e.g. would enable `topologyFromDistanceFunction(dist)`, `torusNav`, `gridNav`,... higher order topology functions
 * - converting between local coordinate space positions instead of one absolute coordinate space (viewport pixels)
 *   - e.g. would enable popping out editors into modals while maintaining spatial nav
 * - editors with carets on the left or the right (styling and position/directional navigation)
 *   - e.g. line starts for text editor lines
 * - abstract EditorElement to the point that it would support canvas based editors and more
 *   - related: make it so the implementation of EditorElement does not assume the usage of EditorElement children
 *     for internal caret nav (caret nav functions that don't assume nested children)
 *   - this would enable implementing an editor using a central controller instead of a bunch of children
 *   - would start to enable recursively self nested editors
 * - flag `shouldFocusChildOnClick`. If false, focus the parent on click.
 */

/**
 * misc refs:
 * - https://math.stackexchange.com/questions/1790823/why-is-the-topology-of-a-graph-called-a-topology
 */

export type EditorArgumentObject = {
  parentEditor?: EditorElement;
  builder?: (input: string) => { output: EditorElement };
};

export type EditorMetaObject = {
  name?: string;
  description?: string;
  customElementTag?: string;
  iconPath?: string;
  isStyled?: boolean;
};

export enum ExitEditorDirection {
  up,
  right,
  down,
  left,
}

export type FocusFromChildEditorArgs =
  | {
      childEditor: EditorElement;
      direction: ExitEditorDirection.left | ExitEditorDirection.right;
    }
  | {
      childEditor: EditorElement;
      direction: ExitEditorDirection.up | ExitEditorDirection.down;
      x: number;
    };

export enum EnterEditorDirection {
  up,
  right,
  down,
  left,
}

export type FocusFromParentEditorArgs =
  | {
      direction: EnterEditorDirection.left | EnterEditorDirection.right;
    }
  | {
      direction: EnterEditorDirection.up | EnterEditorDirection.down;
      x: number;
    };

const parent = (e: EditorElement): EditorElement | null =>
  (e.parentElement?.closest("[isEditor=true]") as EditorElement) ?? null;

const descendents = (e: EditorElement) =>
  e.querySelectorAll(`[isEditor=true]`) as NodeListOf<EditorElement>;

const children = (e: EditorElement) =>
  Iter.filter(descendents(e), (d) => parent(d) === e);

const EdElTree = makeTreeFunctions<EditorElement>({
  parent,
  children,
});

const isFocused = (e: EditorElement): boolean =>
  e.getAttribute("isFocused") === "true";

const next = (
  e: EditorElement,
  key: "ArrowUp" | "ArrowRight" | "ArrowDown" | "ArrowLeft"
): EditorElement | null =>
  EdElTree.hasChildren(e) ? parentNext(e, key) : leafNext(e, key);

const parentNext = (
  childEditor: EditorElement,
  key: "ArrowUp" | "ArrowRight" | "ArrowDown" | "ArrowLeft"
): EditorElement | null => {
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
      x: childEditor.carryX ?? childEditor.getBoundingClientRect().right,
    });
  }
};
const leafNext = (
  childEditor: EditorElement,
  key: "ArrowUp" | "ArrowRight" | "ArrowDown" | "ArrowLeft"
): EditorElement | null =>
  parentFromChildNext(parent(childEditor), {
    childEditor,
    direction: exitEditorDirectionFromKey(key),
    x: childEditor.carryX ?? childEditor.getBoundingClientRect().right,
  }) ?? null;

const parentFromChildNext = (
  editor: EditorElement | null,
  args: FocusFromChildEditorArgs
): EditorElement | null => {
  if (editor === null) return null;
  const { childEditor, direction } = args;

  if (!Iter.some(children(editor), Fn.eq(childEditor)))
    throw "focusFromChildEditor: childEditor was not found in the parent";

  if (
    direction === ExitEditorDirection.up ||
    direction === ExitEditorDirection.down
  ) {
    editor.carryX = args.x;
  }

  let toChild: EditorElement | null = null;
  if (ExitEditorDirection.up === direction)
    toChild = editor.childAbove(childEditor);
  if (ExitEditorDirection.right === direction)
    toChild = editor.childAfter(childEditor);
  if (ExitEditorDirection.down === direction)
    toChild = editor.childBelow(childEditor);
  if (ExitEditorDirection.left === direction)
    toChild = editor.childBefore(childEditor);

  if (toChild) {
    return (
      childFromParentNext(toChild, {
        direction: enterDirectionFromExitDirection(direction),
        x: editor.carryX ?? childEditor.getBoundingClientRect().right,
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
          x: editor.carryX ?? editor.getBoundingClientRect().right,
        }) ?? null
      );
    }
  }
};

const childFromParentNext = (
  editor: EditorElement | null,
  args: FocusFromParentEditorArgs
): EditorElement | null => {
  if (editor === null) return null;
  if (
    args.direction === EnterEditorDirection.up ||
    args.direction === EnterEditorDirection.down
  ) {
    editor.carryX = args.x;
  }

  return EdElTree.hasChildren(editor)
    ? parentFromParentNext(editor, args)
    : editor;
};

const parentFromParentNext = (
  editor: EditorElement,
  args: FocusFromParentEditorArgs
): EditorElement | null => {
  const { direction } = args;
  if (direction === EnterEditorDirection.up) {
    const { x } = args;
    const myBound = editor.getBoundingClientRect();
    const a = editor.closestSinkToPosition([x, myBound.top]);
    return a === editor
      ? editor
      : childFromParentNext(a, { direction, x }) ?? null;
  } else if (direction === EnterEditorDirection.down) {
    const { x } = args;
    const myBound = editor.getBoundingClientRect();
    const a = editor.closestSinkToPosition([x, myBound.bottom]);
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

/** EditorElement just contains data (some data is functions) */
export class EditorElement extends HTMLElement {
  static meta?: EditorMetaObject;

  // spatial vertical nav
  childAbove(childEditor: EditorElement): EditorElement | null {
    return above(childEditor, children(this), this.carryX);
  }
  childBelow(childEditor: EditorElement): EditorElement | null {
    return below(childEditor, children(this), this.carryX);
  }
  // html tree ordered horizontal nav
  childAfter(childEditor: EditorElement): EditorElement | null {
    return after(childEditor, children(this));
  }
  childBefore(childEditor: EditorElement): EditorElement | null {
    return before(childEditor, children(this));
  }
  // distance to entire child bounding boxes or to just `this`'s right side
  closestSinkToPosition(position: [number, number]): EditorElement | null {
    return closestElementToPosition(this, children(this), position);
  }

  constructor() {
    super();

    // const meta = (this.constructor as typeof EditorElement).meta;

    this.setAttribute("isEditor", "true");
    this.attachShadow({ mode: "open" });

    const baseStyleEl = document.createElement("style");
    baseStyleEl.textContent = `
        :host {
          contain: paint; 

          display: inline-block;
  
          user-select: none;
  
          min-height: 1.5rem;
          min-width: 0.4rem;

          padding: 5px;
          margin: 5px;
          border: 2px solid YellowGreen;
          /* border-right: 2px solid transparent; */
        }
        :host(:focus) {
          outline: none;
        }
        :host([isFocused=true]) { /* browser :focus happens if children are focused too :( */
          border-right: 2px solid black;
        }
        :host([isSelected=true]) { /* browser :focus happens if children are focused too :( */
          outline: 2px solid yellow;
        }
      `;
    (this.shadowRoot as ShadowRoot).append(
      baseStyleEl,
      document.createElement("slot")
    );

    if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0"); // make tabbable by default

    // focus
    this.addEventListener("focusout", (e) => this.makeUnfocused());
    this.addEventListener("focus", (e) => {
      e.stopPropagation();
      this.makeFocused();
    });
    this.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.closestSinkToPosition([e.clientX, e.clientY])?.makeFocused();
      clearSelection();
    });
    this.addEventListener("mousemove", (e) => {
      if (e.buttons === 1) {
        e.preventDefault();
        e.stopPropagation();
        const closest = this.closestSinkToPosition([e.clientX, e.clientY]);
        if (closest) {
          select(closest);
          closest.makeFocused();
        }
      }
    });
    this.addEventListener("keydown", (e) => {
      if (isArrowKey(e.key)) {
        next(this, e.key)?.makeFocused();
        e.stopPropagation();
      }
    });
  }

  carryX: number | null = null;

  getOutput = () =>
    Array.from(Iter.map(children(this), (editor) => editor.getOutput())).join();

  makeFocused() {
    this.focus({ preventScroll: true });
    this.setAttribute("isFocused", "true");
    parent(this)?.makeUnfocused();
  }
  makeUnfocused() {
    this.setAttribute("isFocused", "false");
    this.carryX = null;
  }
}
customElements.define("poly-editor", EditorElement);

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

function isArrowKey(
  key: KeyboardEvent["key"]
): key is "ArrowUp" | "ArrowRight" | "ArrowDown" | "ArrowLeft" {
  return (
    key === "ArrowUp" ||
    key === "ArrowRight" ||
    key === "ArrowDown" ||
    key === "ArrowLeft"
  );
}

function after(
  box: EditorElement,
  boxes: Iterable<EditorElement>
): EditorElement | null {
  const { lines, index } = linesAndIndex(box, boxes);
  const [y1, x1] = wrapLinesAddXIndex2D(lines, index, +2); // 2 YIntervals per box
  return lines[y1]?.[x1]?.data ?? null;
}

function below(
  box: EditorElement,
  boxes: Iterable<EditorElement>,
  carryX: number | null
): EditorElement | null {
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
  box: EditorElement,
  boxes: Iterable<EditorElement>
): EditorElement | null {
  const { lines, index } = linesAndIndex(box, boxes);
  const [y1, x1] = wrapLinesAddXIndex2D(lines, index, -2); // 2 YIntervals per box
  return lines[y1]?.[x1]?.data ?? null;
}

function above(
  box: EditorElement,
  boxes: Iterable<EditorElement>,
  carryX: number | null
): EditorElement | null {
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

function numXDist(n: number, el: HTMLElement): number {
  const a = getBoundingClientRect(el);
  if (n > a.left && n < a.right) return 0;
  if (n >= a.right) return n - a.right;
  if (n <= a.left) return a.left - n;
  return 0;
}

function xDist(el1: HTMLElement, el2: HTMLElement): number {
  const a = getBoundingClientRect(el1);
  const b = getBoundingClientRect(el2);
  if (a.left > b.left && a.right < b.right) return 0;
  if (b.left > a.left && b.right < a.right) return 0;
  if (a.left > b.right) return a.left - b.right;
  if (b.left < a.right) return b.left - a.right;
  return 0;
}

type YInterval = {
  n: number;
  interval: [number, number];
  data?: EditorElement;
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
  el: EditorElement
): [YInterval, YInterval] {
  const r = getBoundingClientRect(el);
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
  el: EditorElement,
  els: Iterable<EditorElement>
): { lines: YInterval[][]; index: [number, number] } {
  const caretSinks = Iter.map(els, leftAndRightYIntervalsFromEditorElement);

  const lines = mergeAndSort(caretSinks);

  const index = findIndex2D(lines, (p: YInterval) => p.data === el);

  return { lines, index };
}

// necessary because `Object.assign` does not see DOMRect properties.
const getBoundingClientRect = (element: HTMLElement) => {
  const { top, right, bottom, left, width, height, x, y } =
    element.getBoundingClientRect();
  return { top, right, bottom, left, width, height, x, y };
};

let SELECTION_ANCHOR: EditorElement | null = null; //⚓
let SELECTION_END: EditorElement | null = null;
// when selection changes the old SELECTION span is cleared and the new one is highlighted
// function clearSelection()
function select(editor: EditorElement) {
  if (SELECTION_ANCHOR === null) {
    SELECTION_ANCHOR = editor;
    return;
  }
  clearExistingSelection();

  SELECTION_END = editor;
  for (const e of traverseEditors(SELECTION_ANCHOR, SELECTION_END))
    e.setAttribute("isSelected", "true");
}

function clearSelection() {
  clearExistingSelection();
  SELECTION_ANCHOR = null;
  SELECTION_END = null;
}

function clearExistingSelection() {
  if (SELECTION_ANCHOR && SELECTION_END) {
    for (const e of traverseEditors(SELECTION_ANCHOR, SELECTION_END))
      e.setAttribute("isSelected", "false");
  }
}

function* traverseEditors(start: EditorElement, end: EditorElement) {
  const comp = EdElTree.compareOrder(start, end);

  if (comp === "!") return;
  if (comp === ">") {
    let cur: EditorElement | null | undefined = start;
    while (cur) {
      yield cur; // don't include start when going to the right
      if (cur === end) return;
      cur = next(cur, "ArrowRight");
    }
  }
  if (comp === "<") {
    let cur: EditorElement | null | undefined = start;
    while (cur) {
      if (cur === end) return;
      yield cur; // include start when going to the left
      cur = next(cur, "ArrowLeft");
    }
  }
}
