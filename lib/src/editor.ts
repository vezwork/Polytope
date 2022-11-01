import { findIndex2D, max, min } from "./Arrays.js";
import { closestElementToPosition } from "./closestElement.js";
import { mergeAndSortLines } from "./math/Line2MergeAndSort.js";
import { CaretSink, horizontalNavMaps } from "./space.js";

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
      e.stopPropagation();
      this.makeFocused();
    });
    this.addEventListener("keydown", (e) => {
      if (isArrowKey(e.key)) {
        this.isParentEditor()
          ? this.parentOnInputArrow(e.key)
          : this.leafOnInputArrow(e.key);
        e.stopPropagation();
      }
    });
  }

  private parentOnInputArrow(
    key: "ArrowUp" | "ArrowRight" | "ArrowDown" | "ArrowLeft"
  ) {
    if (key === "ArrowLeft") {
      const childEditors = this.childEditors();
      const lastChildEditor = childEditors[childEditors.length - 1];
      lastChildEditor.focusFromParentEditor({
        direction: EnterEditorDirection.right,
      });
    } else {
      this.parentEditor()?.focusFromChildEditor({
        childEditor: this,
        direction: exitEditorDirectionFromKey(key),
        x: this.carryX ?? this.getBoundingClientRect().right,
      });
    }
  }

  private leafOnInputArrow(
    key: "ArrowUp" | "ArrowRight" | "ArrowDown" | "ArrowLeft"
  ) {
    this.parentEditor()?.focusFromChildEditor({
      childEditor: this,
      direction: exitEditorDirectionFromKey(key),
      x: this.carryX ?? this.getBoundingClientRect().right,
    });
  }

  carryX: number | null = null;

  focusFromChildEditor(args: FocusFromChildEditorArgs) {
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
      toChild.focusFromParentEditor({
        direction: enterDirectionFromExitDirection(direction),
        x: this.carryX ?? childEditor.getBoundingClientRect().right,
      });
    } else {
      if (direction === ExitEditorDirection.right) {
        this.makeFocused();
      } else {
        this.parentEditor()?.focusFromChildEditor({
          childEditor: this,
          direction,
          x: this.carryX ?? this.getBoundingClientRect().right,
        });
      }
    }
  }

  focusFromParentEditor(args: FocusFromParentEditorArgs) {
    if (
      args.direction === EnterEditorDirection.up ||
      args.direction === EnterEditorDirection.down
    ) {
      this.carryX = args.x;
    }

    if (this.isParentEditor()) {
      this.parentFocusFromParentEditor(args);
    } else {
      this.childFocusFromParentEditor(args);
    }
  }

  private parentFocusFromParentEditor(args: FocusFromParentEditorArgs) {
    const { direction } = args;
    if (direction === EnterEditorDirection.up) {
      const { x } = args;
      const myBound = this.getBoundingClientRect();
      const a = this.closestSinkToPosition([x, myBound.top]);
      if (a === this) this.makeFocused();
      else a?.focusFromParentEditor({ direction, x });
    } else if (direction === EnterEditorDirection.down) {
      const { x } = args;
      const myBound = this.getBoundingClientRect();
      const a = this.closestSinkToPosition([x, myBound.bottom]);
      if (a === this) this.makeFocused();
      else a?.focusFromParentEditor({ direction, x });
    } else if (direction === EnterEditorDirection.left)
      this.childEditors()[0].focusFromParentEditor(args);
    else if (direction === EnterEditorDirection.right) this.makeFocused();
  }
  private childFocusFromParentEditor(args: FocusFromParentEditorArgs) {
    this.makeFocused();
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

type AnnotatedCaretSink = [number, number] &
  CaretSink & { data: EditorElement };

function after(
  box: EditorElement,
  boxes: EditorElement[]
): EditorElement | null {
  const {
    lines,
    index: [x, y],
  } = linesAndIndex(box, boxes);
  return lines[x]?.[y + 1]?.data ?? lines[x + 1]?.[0]?.data ?? null;
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
      carryX ? numXDist(carryX, data) : xDist(box, data)
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
    lines[x]?.[y - 1]?.data ??
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
      carryX ? numXDist(carryX, data) : xDist(box, data)
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

function linesAndIndex(
  box: EditorElement,
  boxes: EditorElement[]
): { lines: AnnotatedCaretSink[][]; index: [number, number] } {
  const caretSinks: AnnotatedCaretSink[] = boxes
    .map((box) => ({ rect: getBoundingClientRect(box), data: box }))
    .map(({ rect, data }) =>
      // note that the tuple must be the first arg so that the resulting object has array proto
      Object.assign([rect.x, rect.y] as [number, number], rect, { data })
    );

  const nav = horizontalNavMaps(caretSinks);
  const lines = mergeAndSortLines([...nav.lines()]);
  console.log("DEEBUUG", nav, lines);

  const index = findIndex2D(lines, (p) => p.data === box);

  return { lines, index };
}

// limitations:
// - horizontalNavMaps adds an unecessary pre-step to line calculation.
//   With the right box distance definition, mergeAndSortLines could do horizontalNavMaps' job.
// - overlapping boxes may not be handles properly
// - mergeAndSortLines uses some line functions that have not been thoroughly tested for 0 and 1 point lines.
// - only the left side of boxes are taken into account in mergeAndSortLines potentially causing bad results when boxes have non-negligible width.

// necessary because `Object.assign` does not see DOMRect properties.
const getBoundingClientRect = (element: HTMLElement) => {
  const { top, right, bottom, left, width, height, x, y } =
    element.getBoundingClientRect();
  return { top, right, bottom, left, width, height, x, y };
};
