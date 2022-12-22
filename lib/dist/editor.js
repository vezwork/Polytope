import { findIndex2D, min } from "./Arrays.js";
import { closestElementToPosition } from "./closestElement.js";
import * as Fn from "./Functions.js";
import * as Iter from "./Iterable.js";
import { segXProj } from "./math/Line2.js";
import { make2DLineFunctions } from "./math/LineT.js";
import { seperatingInterval } from "./math/NumberInterval.js";
import { makeTreeFunctions } from "./structure/tree.js";
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
const parent = (e) => e.parentElement?.closest("[isEditor=true]") ?? null;
const descendents = (e) => e.querySelectorAll(`[isEditor=true]`);
const children = (e) => Iter.filter(descendents(e), (d) => parent(d) === e);
const EdElTree = makeTreeFunctions({
    parent,
    children,
});
export class EditorElement extends HTMLElement {
    static meta;
    // spatial vertical nav
    childAbove(childEditor) {
        return above(childEditor, children(this), this.carryX);
    }
    childBelow(childEditor) {
        return below(childEditor, children(this), this.carryX);
    }
    // html tree ordered horizontal nav
    childAfter(childEditor) {
        return after(childEditor, children(this));
    }
    childBefore(childEditor) {
        return before(childEditor, children(this));
    }
    // distance to entire child bounding boxes or to just `this`'s right side
    closestSinkToPosition(position) {
        return closestElementToPosition(this, children(this), position);
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
        :host([isSelected=true]) { /* browser :focus happens if children are focused too :( */
          outline: 2px solid yellow;
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
    next(key) {
        return EdElTree.hasChildren(this)
            ? this.parentNext(key)
            : this.leafNext(key);
    }
    parentNext(key) {
        if (key === "ArrowLeft") {
            return (Iter.last(children(this))?.childFromParentNext({
                direction: EnterEditorDirection.right,
            }) ?? null);
        }
        else {
            return (parent(this)?.parentFromChildNext({
                childEditor: this,
                direction: exitEditorDirectionFromKey(key),
                x: this.carryX ?? this.getBoundingClientRect().right,
            }) ?? null);
        }
    }
    carryX = null;
    leafNext(key) {
        return (parent(this)?.parentFromChildNext({
            childEditor: this,
            direction: exitEditorDirectionFromKey(key),
            x: this.carryX ?? this.getBoundingClientRect().right,
        }) ?? null);
    }
    // Should make a "next" function (not method), that just looks at data in the
    // editor to figure out where to go (left, right, up, down topology data)
    parentFromChildNext(args) {
        const { childEditor, direction } = args;
        if (!Iter.some(children(this), Fn.eq(childEditor)))
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
            return (toChild.childFromParentNext({
                direction: enterDirectionFromExitDirection(direction),
                x: this.carryX ?? childEditor.getBoundingClientRect().right,
            }) ?? null);
        }
        else {
            if (direction === ExitEditorDirection.right) {
                return this;
            }
            else {
                return (parent(this)?.parentFromChildNext({
                    childEditor: this,
                    direction,
                    x: this.carryX ?? this.getBoundingClientRect().right,
                }) ?? null);
            }
        }
    }
    childFromParentNext(args) {
        if (args.direction === EnterEditorDirection.up ||
            args.direction === EnterEditorDirection.down) {
            this.carryX = args.x;
        }
        return EdElTree.hasChildren(this) ? this.parentFromParentNext(args) : this;
    }
    parentFromParentNext(args) {
        const { direction } = args;
        if (direction === EnterEditorDirection.up) {
            const { x } = args;
            const myBound = this.getBoundingClientRect();
            const a = this.closestSinkToPosition([x, myBound.top]);
            return a === this
                ? this
                : a?.childFromParentNext({ direction, x }) ?? null;
        }
        else if (direction === EnterEditorDirection.down) {
            const { x } = args;
            const myBound = this.getBoundingClientRect();
            const a = this.closestSinkToPosition([x, myBound.bottom]);
            return a === this
                ? this
                : a?.childFromParentNext({ direction, x }) ?? null;
        }
        else if (direction === EnterEditorDirection.left)
            return Iter.first(children(this))?.childFromParentNext(args) ?? null;
        else if (direction === EnterEditorDirection.right)
            return this;
        return null;
    }
    getOutput = () => Array.from(Iter.map(children(this), (editor) => editor.getOutput())).join();
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
    return lines[x]?.[y + 2]?.data ?? lines[x + 1]?.[0]?.data ?? null;
}
function below(box, boxes, carryX) {
    const { lines, index } = linesAndIndex(box, boxes);
    const nextLine = lines[index[0] + 1] ?? [];
    return (min(nextLine, ({ data }) => carryX ? numXDist(carryX, data) : xDist(box, data))?.data ?? null);
}
function before(box, boxes) {
    const { lines, index: [x, y], } = linesAndIndex(box, boxes);
    return (lines[x]?.[y - 2]?.data ??
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
const top = ({ n, interval: [top, _] }) => [
    n,
    top,
]; // assuming interval[0] is top, which is not enforced
const yIntervalFromTop = ([n, top]) => ({
    n,
    interval: [top, top],
});
const xBiasedDist = ([x1, y1], [x2, y2]) => Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 4);
const { mergeAndSort } = make2DLineFunctions({
    dist: (a, b) => {
        const i = seperatingInterval(a.interval, b.interval);
        if (i === null)
            return Math.sqrt((a.n - b.n) ** 2); // intervals overlap so just get 1D distance
        return xBiasedDist([a.n, i[0]], [b.n, i[1]]);
    },
    // wish these could be editors/polygons that get deconstructed, projected, then reconstructed somehow
    xProj: ([p1, p2]) => (p) => yIntervalFromTop(segXProj([top(p1), top(p2)])(top(p))),
    isPointLeft: (p1) => (p2) => p1.n < p2.n,
    isPointBelow: (p1) => (p2) => top(p1)[1] > top(p2)[1],
});
function leftAndRightYIntervalsFromEditorElement(el) {
    const r = getBoundingClientRect(el);
    const yInterval = {
        interval: [r.top, r.bottom],
        data: el,
    };
    return [
        { ...yInterval, n: r.left },
        { ...yInterval, n: r.right },
    ];
}
function linesAndIndex(el, els) {
    const caretSinks = Iter.map(els, leftAndRightYIntervalsFromEditorElement);
    const lines = mergeAndSort(caretSinks);
    const index = findIndex2D(lines, (p) => p.data === el);
    return { lines, index };
}
// necessary because `Object.assign` does not see DOMRect properties.
const getBoundingClientRect = (element) => {
    const { top, right, bottom, left, width, height, x, y } = element.getBoundingClientRect();
    return { top, right, bottom, left, width, height, x, y };
};
let SELECTION_ANCHOR = null; //⚓
let SELECTION_END = null;
// when selection changes the old SELECTION span is cleared and the new one is highlighted
// function clearSelection()
function select(editor) {
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
function* traverseEditors(start, end) {
    const comp = EdElTree.compareOrder(start, end);
    if (comp === "!")
        return;
    if (comp === ">") {
        let cur = start;
        while (cur) {
            yield cur; // don't include start when going to the right
            if (cur === end)
                return;
            cur = cur.next("ArrowRight");
        }
    }
    if (comp === "<") {
        let cur = start;
        while (cur) {
            if (cur === end)
                return;
            yield cur; // include start when going to the left
            cur = cur.next("ArrowLeft");
        }
    }
}
