import { compareIndex2D, findIndex2D, min } from "./Arrays.js";
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

const parent = (e: EditorElement) =>
  (e?.closest("[isEditor=true]") as EditorElement) ?? null;
const descendents = (e: EditorElement) =>
  e.querySelectorAll(`[isEditor=true]`) as NodeListOf<EditorElement>;
const children = (e: EditorElement) =>
  Iter.filter(descendents(e), (d) => parent(d) === e);

const Tree = makeTreeFunctions<EditorElement>({
  parent,
  children,
});

export class EditorElement extends HTMLElement {
  static meta?: EditorMetaObject;

  parentEditor(): EditorElement | null {
    // could be optimizing it by caching it against the parent element?
    return this.parentElement?.closest("[isEditor=true]") ?? null;
  }
  rootEditor() {
    let curAncestor: EditorElement | null = this;
    while (true) {
      if (curAncestor?.parentEditor) curAncestor = curAncestor.parentEditor();
      else return curAncestor;
    }
  }

  descendentEditors(): EditorElement[] {
    return Array.from(this.querySelectorAll(`[isEditor=true]`));
  }
  childEditors(): EditorElement[] {
    const descendents = this.descendentEditors();
    return descendents.filter(
      (editor) => !descendents.includes(editor.parentEditor() as EditorElement)
    );
  }

  // spatial vertical nav
  childAbove(childEditor: EditorElement): EditorElement | null {
    return above(childEditor, this.childEditors(), this.carryX);
  }
  childBelow(childEditor: EditorElement): EditorElement | null {
    return below(childEditor, this.childEditors(), this.carryX);
  }
  // html tree ordered horizontal nav
  childAfter(childEditor: EditorElement): EditorElement | null {
    return after(childEditor, this.childEditors());
  }
  childBefore(childEditor: EditorElement): EditorElement | null {
    return before(childEditor, this.childEditors());
  }
  // distance to entire child bounding boxes or to just `this`'s right side
  closestSinkToPosition(position: [number, number]): EditorElement | null {
    return closestElementToPosition(this, this.childEditors(), position);
  }

  isRootEditor(): boolean {
    return this.parentEditor() === null;
  }
  isChildEditor(): boolean {
    return !this.isRootEditor();
  }
  isParentEditor(): boolean {
    return this.childEditors().length > 0;
  }
  isLeafEditor(): boolean {
    return !this.isParentEditor();
  }
  isFocused(): boolean {
    return this.getAttribute("isFocused") === "true";
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
        this.next(e.key)?.makeFocused();
        e.stopPropagation();
      }
    });
  }

  next(key: "ArrowUp" | "ArrowRight" | "ArrowDown" | "ArrowLeft") {
    return this.isParentEditor() ? this.parentNext(key) : this.leafNext(key);
  }

  private parentNext(
    key: "ArrowUp" | "ArrowRight" | "ArrowDown" | "ArrowLeft"
  ): EditorElement | null {
    if (key === "ArrowLeft") {
      return (
        this.childEditors().at(-1)!.childFromParentNext({
          direction: EnterEditorDirection.right,
        }) ?? null
      );
    } else {
      return (
        this.parentEditor()?.parentFromChildNext({
          childEditor: this,
          direction: exitEditorDirectionFromKey(key),
          x: this.carryX ?? this.getBoundingClientRect().right,
        }) ?? null
      );
    }
  }

  carryX: number | null = null;

  leafNext(
    key: "ArrowUp" | "ArrowRight" | "ArrowDown" | "ArrowLeft"
  ): EditorElement | null {
    return (
      this.parentEditor()?.parentFromChildNext({
        childEditor: this,
        direction: exitEditorDirectionFromKey(key),
        x: this.carryX ?? this.getBoundingClientRect().right,
      }) ?? null
    );
  }

  // Should make a "next" function (not method), that just looks at data in the
  // editor to figure out where to go (left, right, up, down topology data)
  parentFromChildNext(args: FocusFromChildEditorArgs): EditorElement | null {
    const { childEditor, direction } = args;

    const childEditors = this.childEditors();
    const focusFromIndex = childEditors.indexOf(childEditor);

    if (focusFromIndex === -1)
      throw "focusFromChildEditor: childEditor was not found in the parent";

    if (
      direction === ExitEditorDirection.up ||
      direction === ExitEditorDirection.down
    ) {
      this.carryX = args.x;
    }

    let toChild: EditorElement | null = null;
    if (ExitEditorDirection.up === direction)
      toChild = this.childAbove(childEditor);
    if (ExitEditorDirection.right === direction)
      toChild = this.childAfter(childEditor);
    if (ExitEditorDirection.down === direction)
      toChild = this.childBelow(childEditor);
    if (ExitEditorDirection.left === direction)
      toChild = this.childBefore(childEditor);

    if (toChild) {
      return (
        toChild.childFromParentNext({
          direction: enterDirectionFromExitDirection(direction),
          x: this.carryX ?? childEditor.getBoundingClientRect().right,
        }) ?? null
      );
    } else {
      if (direction === ExitEditorDirection.right) {
        return this;
      } else {
        return (
          this.parentEditor()?.parentFromChildNext({
            childEditor: this,
            direction,
            x: this.carryX ?? this.getBoundingClientRect().right,
          }) ?? null
        );
      }
    }
  }

  childFromParentNext(args: FocusFromParentEditorArgs): EditorElement | null {
    if (
      args.direction === EnterEditorDirection.up ||
      args.direction === EnterEditorDirection.down
    ) {
      this.carryX = args.x;
    }

    return this.isParentEditor() ? this.parentFromParentNext(args) : this;
  }

  private parentFromParentNext(
    args: FocusFromParentEditorArgs
  ): EditorElement | null {
    const { direction } = args;
    if (direction === EnterEditorDirection.up) {
      const { x } = args;
      const myBound = this.getBoundingClientRect();
      const a = this.closestSinkToPosition([x, myBound.top]);
      return a === this
        ? this
        : a?.childFromParentNext({ direction, x }) ?? null;
    } else if (direction === EnterEditorDirection.down) {
      const { x } = args;
      const myBound = this.getBoundingClientRect();
      const a = this.closestSinkToPosition([x, myBound.bottom]);
      return a === this
        ? this
        : a?.childFromParentNext({ direction, x }) ?? null;
    } else if (direction === EnterEditorDirection.left)
      return this.childEditors()[0].childFromParentNext(args);
    else if (direction === EnterEditorDirection.right) return this;
    return null;
  }

  getOutput = () =>
    this.childEditors()
      .map((editor) => editor.getOutput())
      .join();

  makeFocused() {
    this.focus({ preventScroll: true });
    this.setAttribute("isFocused", "true");
    this.parentEditor()?.makeUnfocused();
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
  boxes: EditorElement[]
): EditorElement | null {
  const {
    lines,
    index: [x, y],
  } = linesAndIndex(box, boxes);
  return lines[x]?.[y + 2]?.data ?? lines[x + 1]?.[0]?.data ?? null;
}

function below(
  box: EditorElement,
  boxes: EditorElement[],
  carryX: number | null
): EditorElement | null {
  const { lines, index } = linesAndIndex(box, boxes);
  const nextLine = lines[index[0] + 1] ?? [];
  return (
    min(nextLine, ({ data }) =>
      carryX ? numXDist(carryX, data!) : xDist(box, data!)
    )?.data ?? null
  );
}

function before(
  box: EditorElement,
  boxes: EditorElement[]
): EditorElement | null {
  const {
    lines,
    index: [x, y],
  } = linesAndIndex(box, boxes);
  return (
    lines[x]?.[y - 2]?.data ??
    lines[x - 1]?.[lines[x - 1]?.length - 1]?.data ??
    null
  );
}

function above(
  box: EditorElement,
  boxes: EditorElement[],
  carryX: number | null
): EditorElement | null {
  const { lines, index } = linesAndIndex(box, boxes);
  const prevLine = lines[index[0] - 1] ?? [];
  return (
    min(prevLine, ({ data }) =>
      carryX ? numXDist(carryX, data!) : xDist(box, data!)
    )?.data ?? null
  );
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
  els: EditorElement[]
): { lines: YInterval[][]; index: [number, number] } {
  const caretSinks = els.map(leftAndRightYIntervalsFromEditorElement);

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
  const comp = compareEditorsByOrder(start, end);
  if (comp === null) return;
  if (comp === -1) {
    let cur: EditorElement | null | undefined = start;
    while (cur) {
      yield cur; // don't include start when going to the right
      if (cur === end) return;
      cur = cur.next("ArrowRight");
    }
  }
  if (comp === 1) {
    let cur: EditorElement | null | undefined = start;
    while (cur) {
      if (cur === end) return;
      yield cur; // include start when going to the left
      cur = cur.next("ArrowLeft");
    }
  }
}

// a lot of stuff should just be tree helpers with custom traversal functions
function compareEditorsByOrder(
  e1: EditorElement,
  e2: EditorElement
): -1 | 0 | 1 | null {
  const comp = compareEditorsByAncestry(e1, e2);
  if (comp !== null) return comp;
  const { common, ancestors1, ancestors2 } = commonAncestor(e1, e2) ?? {};
  if (!common) return null;
  return compareInEditors(
    common.childEditors(),
    ancestors1!.at(-1) as EditorElement,
    ancestors2!.at(-1) as EditorElement
  ); // NO, should be e1 and e2's ancestors in com
}

function commonAncestor(
  e1: EditorElement,
  e2: EditorElement
): {
  common: EditorElement;
  ancestors1: EditorElement[];
  ancestors2: EditorElement[];
} | null {
  const a1 = Array.from(ancestors(e1));
  const a2 = Array.from(ancestors(e2));
  for (let i1 = 0; i1 < a1.length; i1++) {
    for (let i2 = 0; i2 < a2.length; i2++) {
      if (a1[i1] === a2[i2])
        return {
          common: a1[i1],
          ancestors1: a1.slice(0, i1),
          ancestors2: a2.slice(0, i2),
        };
    }
  }
  return null;
}

function* ancestors(e: EditorElement) {
  let cur: EditorElement | null = e;
  yield cur;
  while ((cur = cur.parentEditor())) yield cur;
}

function compareEditorsByAncestry(
  e1: EditorElement,
  e2: EditorElement
): -1 | 0 | 1 | null {
  if (e1 === e2) return 0;
  let cur: EditorElement | null = e1;
  while ((cur = cur.parentEditor())) if (cur === e2) return 1;
  cur = e2;
  while ((cur = cur.parentEditor())) if (cur === e1) return -1;
  return null;
}

function compareInEditors(
  editors: EditorElement[],
  e1: EditorElement,
  e2: EditorElement
): -1 | 0 | 1 | null {
  const caretSinks = editors.map(leftAndRightYIntervalsFromEditorElement);

  const lines = mergeAndSort(caretSinks);

  const i1 = findIndex2D(lines, (p: YInterval) => p.data === e1);
  const i2 = findIndex2D(lines, (p: YInterval) => p.data === e2);
  if (i1[0] === -1 || i2[0] === -1) return null;

  return compareIndex2D(i1, i2);
}
