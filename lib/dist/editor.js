import { findIndex2D, min } from "./Arrays.js";
import { closestElementToPosition } from "./closestElement.js";
import { mergeAndSortLines } from "./math/Line2MergeAndSort.js";
import { horizontalNavMaps } from "./space.js";
export var ExitEditorDirection;
(function (ExitEditorDirection) {
    ExitEditorDirection[ExitEditorDirection["up"] = 0] = "up";
    ExitEditorDirection[ExitEditorDirection["right"] = 1] = "right";
    ExitEditorDirection[ExitEditorDirection["down"] = 2] = "down";
    ExitEditorDirection[ExitEditorDirection["left"] = 3] = "left";
})(ExitEditorDirection || (ExitEditorDirection = {}));
export var EnterEditorDirection;
(function (EnterEditorDirection) {
    EnterEditorDirection[EnterEditorDirection["up"] = 0] = "up";
    EnterEditorDirection[EnterEditorDirection["right"] = 1] = "right";
    EnterEditorDirection[EnterEditorDirection["down"] = 2] = "down";
    EnterEditorDirection[EnterEditorDirection["left"] = 3] = "left";
})(EnterEditorDirection || (EnterEditorDirection = {}));
export class EditorElement extends HTMLElement {
    static meta;
    parentEditor() {
        // could be optimizing it by caching it against the parent element?
        return this.parentElement?.closest("[isEditor=true]") ?? null;
    }
    rootEditor() {
        let curAncestor = this;
        while (true) {
            if (curAncestor?.parentEditor)
                curAncestor = curAncestor.parentEditor();
            else
                return curAncestor;
        }
    }
    descendentEditors() {
        return Array.from(this.querySelectorAll(`[isEditor=true]`));
    }
    childEditors() {
        const descendents = this.descendentEditors();
        return descendents.filter((editor) => !descendents.includes(editor.parentEditor()));
    }
    // spatial vertical nav
    childAbove(childEditor) {
        return above(childEditor, this.childEditors(), this.carryX);
    }
    childBelow(childEditor) {
        return below(childEditor, this.childEditors(), this.carryX);
    }
    // html tree ordered horizontal nav
    childAfter(childEditor) {
        return after(childEditor, this.childEditors());
    }
    childBefore(childEditor) {
        return before(childEditor, this.childEditors());
    }
    // distance to entire child bounding boxes or to just `this`'s right side
    closestSinkToPosition(position) {
        return closestElementToPosition(this, this.childEditors(), position);
    }
    isRootEditor() {
        return this.parentEditor() === null;
    }
    isChildEditor() {
        return !this.isRootEditor();
    }
    isParentEditor() {
        return this.childEditors().length > 0;
    }
    isLeafEditor() {
        return !this.isParentEditor();
    }
    isFocused() {
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
        this.shadowRoot.append(baseStyleEl, document.createElement("slot"));
        if (!this.hasAttribute("tabindex"))
            this.setAttribute("tabindex", "0"); // make tabbable by default
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
    parentOnInputArrow(key) {
        if (key === "ArrowLeft") {
            const childEditors = this.childEditors();
            const lastChildEditor = childEditors[childEditors.length - 1];
            lastChildEditor.focusFromParentEditor({
                direction: EnterEditorDirection.right,
            });
        }
        else {
            this.parentEditor()?.focusFromChildEditor({
                childEditor: this,
                direction: exitEditorDirectionFromKey(key),
                x: this.carryX ?? this.getBoundingClientRect().right,
            });
        }
    }
    leafOnInputArrow(key) {
        this.parentEditor()?.focusFromChildEditor({
            childEditor: this,
            direction: exitEditorDirectionFromKey(key),
            x: this.carryX ?? this.getBoundingClientRect().right,
        });
    }
    carryX = null;
    focusFromChildEditor(args) {
        const { childEditor, direction } = args;
        const childEditors = this.childEditors();
        const focusFromIndex = childEditors.indexOf(childEditor);
        if (focusFromIndex === -1)
            throw "focusFromChildEditor: childEditor was not found in the parent";
        if (direction === ExitEditorDirection.up ||
            direction === ExitEditorDirection.down) {
            this.carryX = args.x;
        }
        let toChild = null;
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
        }
        else {
            if (direction === ExitEditorDirection.right) {
                this.makeFocused();
            }
            else {
                this.parentEditor()?.focusFromChildEditor({
                    childEditor: this,
                    direction,
                    x: this.carryX ?? this.getBoundingClientRect().right,
                });
            }
        }
    }
    focusFromParentEditor(args) {
        if (args.direction === EnterEditorDirection.up ||
            args.direction === EnterEditorDirection.down) {
            this.carryX = args.x;
        }
        if (this.isParentEditor()) {
            this.parentFocusFromParentEditor(args);
        }
        else {
            this.childFocusFromParentEditor(args);
        }
    }
    parentFocusFromParentEditor(args) {
        const { direction } = args;
        if (direction === EnterEditorDirection.up) {
            const { x } = args;
            const myBound = this.getBoundingClientRect();
            const a = this.closestSinkToPosition([x, myBound.top]);
            if (a === this)
                this.makeFocused();
            else
                a?.focusFromParentEditor({ direction, x });
        }
        else if (direction === EnterEditorDirection.down) {
            const { x } = args;
            const myBound = this.getBoundingClientRect();
            const a = this.closestSinkToPosition([x, myBound.bottom]);
            if (a === this)
                this.makeFocused();
            else
                a?.focusFromParentEditor({ direction, x });
        }
        else if (direction === EnterEditorDirection.left)
            this.childEditors()[0].focusFromParentEditor(args);
        else if (direction === EnterEditorDirection.right)
            this.makeFocused();
    }
    childFocusFromParentEditor(args) {
        this.makeFocused();
    }
    getOutput = () => this.childEditors()
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
function exitEditorDirectionFromKey(key) {
    return {
        ArrowUp: ExitEditorDirection.up,
        ArrowRight: ExitEditorDirection.right,
        ArrowDown: ExitEditorDirection.down,
        ArrowLeft: ExitEditorDirection.left,
    }[key];
}
function enterDirectionFromExitDirection(exitDirection) {
    return {
        [ExitEditorDirection.up]: EnterEditorDirection.down,
        [ExitEditorDirection.right]: EnterEditorDirection.left,
        [ExitEditorDirection.down]: EnterEditorDirection.up,
        [ExitEditorDirection.left]: EnterEditorDirection.right,
    }[exitDirection];
}
function isArrowKey(key) {
    return (key === "ArrowUp" ||
        key === "ArrowRight" ||
        key === "ArrowDown" ||
        key === "ArrowLeft");
}
function after(box, boxes) {
    const { lines, index: [x, y], } = linesAndIndex(box, boxes);
    return lines[x]?.[y + 1]?.data ?? lines[x + 1]?.[0]?.data ?? null;
}
function below(box, boxes, carryX) {
    const { lines, index } = linesAndIndex(box, boxes);
    const nextLine = lines[index[0] + 1] ?? [];
    return (min(nextLine, ({ data }) => carryX ? numXDist(carryX, data) : xDist(box, data))?.data ?? null);
}
function before(box, boxes) {
    const { lines, index: [x, y], } = linesAndIndex(box, boxes);
    return (lines[x]?.[y - 1]?.data ??
        lines[x - 1]?.[lines[x - 1]?.length - 1]?.data ??
        null);
}
function above(box, boxes, carryX) {
    const { lines, index } = linesAndIndex(box, boxes);
    const prevLine = lines[index[0] - 1] ?? [];
    return (min(prevLine, ({ data }) => carryX ? numXDist(carryX, data) : xDist(box, data))?.data ?? null);
}
function numXDist(n, el) {
    const a = getBoundingClientRect(el);
    if (n > a.left && n < a.right)
        return 0;
    if (n >= a.right)
        return n - a.right;
    if (n <= a.left)
        return a.left - n;
    return 0;
}
function xDist(el1, el2) {
    const a = getBoundingClientRect(el1);
    const b = getBoundingClientRect(el2);
    if (a.left > b.left && a.right < b.right)
        return 0;
    if (b.left > a.left && b.right < a.right)
        return 0;
    if (a.left > b.right)
        return a.left - b.right;
    if (b.left < a.right)
        return b.left - a.right;
    return 0;
}
function linesAndIndex(box, boxes) {
    const caretSinks = boxes
        .map((box) => ({ rect: getBoundingClientRect(box), data: box }))
        .map(({ rect, data }) => 
    // note that the tuple must be the first arg so that the resulting object has array proto
    Object.assign([rect.x, rect.y], rect, { data }));
    const nav = horizontalNavMaps(caretSinks);
    const lines = mergeAndSortLines([...nav.lines()]);
    console.log("DEEBUUG", nav, lines);
    const index = findIndex2D(lines, (p) => p.data === box);
    return { lines, index };
}
// necessary because `Object.assign` does not see DOMRect properties.
const getBoundingClientRect = (element) => {
    const { top, right, bottom, left, width, height, x, y } = element.getBoundingClientRect();
    return { top, right, bottom, left, width, height, x, y };
};
