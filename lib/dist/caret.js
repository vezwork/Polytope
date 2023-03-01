import { findIndex2D, min, wrapLinesAddXIndex2D } from "./Arrays.js";
import * as Fn from "./Functions.js";
import * as Iter from "./Iterable.js";
import { segXProj } from "./math/Line2.js";
import { make2DLineFunctions } from "./math/LineT.js";
import { seperatingInterval } from "./math/NumberInterval.js";
import { makeTreeFunctions } from "./structure/tree.js";
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
export function makeCaretFunctions({ getBounds, parent, children, getCarryX, setCarryX, closestSinkToPosition, }) {
    let ExitEditorDirection;
    (function (ExitEditorDirection) {
        ExitEditorDirection[ExitEditorDirection["up"] = 0] = "up";
        ExitEditorDirection[ExitEditorDirection["right"] = 1] = "right";
        ExitEditorDirection[ExitEditorDirection["down"] = 2] = "down";
        ExitEditorDirection[ExitEditorDirection["left"] = 3] = "left";
    })(ExitEditorDirection || (ExitEditorDirection = {}));
    let EnterEditorDirection;
    (function (EnterEditorDirection) {
        EnterEditorDirection[EnterEditorDirection["up"] = 0] = "up";
        EnterEditorDirection[EnterEditorDirection["right"] = 1] = "right";
        EnterEditorDirection[EnterEditorDirection["down"] = 2] = "down";
        EnterEditorDirection[EnterEditorDirection["left"] = 3] = "left";
    })(EnterEditorDirection || (EnterEditorDirection = {}));
    const EdElTree = makeTreeFunctions({
        parent,
        children,
    });
    const next = (e, key) => EdElTree.hasChildren(e) ? parentNext(e, key) : leafNext(e, key);
    const parentNext = (childEditor, key) => {
        if (key === "ArrowLeft") {
            return (childFromParentNext(Iter.last(children(childEditor)) ?? null, {
                direction: EnterEditorDirection.right,
            }) ?? null);
        }
        else {
            return parentFromChildNext(parent(childEditor), {
                childEditor,
                direction: exitEditorDirectionFromKey(key),
                x: getCarryX(childEditor) ?? getBounds(childEditor).right,
            });
        }
    };
    const leafNext = (childEditor, key) => parentFromChildNext(parent(childEditor), {
        childEditor,
        direction: exitEditorDirectionFromKey(key),
        x: getCarryX(childEditor) ?? getBounds(childEditor).right,
    }) ?? null;
    const parentFromChildNext = (editor, args) => {
        if (editor === null)
            return null;
        const { childEditor, direction } = args;
        if (!Iter.some(children(editor), Fn.eq(childEditor)))
            throw "focusFromChildEditor: childEditor was not found in the parent";
        if (direction === ExitEditorDirection.up ||
            direction === ExitEditorDirection.down) {
            setCarryX(editor)(args.x);
        }
        let toChild = null;
        if (ExitEditorDirection.up === direction)
            toChild = childAbove(editor)(childEditor);
        if (ExitEditorDirection.right === direction)
            toChild = childAfter(editor)(childEditor);
        if (ExitEditorDirection.down === direction)
            toChild = childBelow(editor)(childEditor);
        if (ExitEditorDirection.left === direction)
            toChild = childBefore(editor)(childEditor);
        if (toChild) {
            return (childFromParentNext(toChild, {
                direction: enterDirectionFromExitDirection(direction),
                x: getCarryX(editor) ?? getBounds(childEditor).right,
            }) ?? null);
        }
        else {
            if (direction === ExitEditorDirection.right) {
                return editor;
            }
            else {
                return (parentFromChildNext(parent(editor), {
                    childEditor: editor,
                    direction,
                    x: getCarryX(editor) ?? getBounds(editor).right,
                }) ?? null);
            }
        }
    };
    const childFromParentNext = (editor, args) => {
        if (editor === null)
            return null;
        if (args.direction === EnterEditorDirection.up ||
            args.direction === EnterEditorDirection.down) {
            setCarryX(editor)(args.x);
        }
        return EdElTree.hasChildren(editor)
            ? parentFromParentNext(editor, args)
            : editor;
    };
    const parentFromParentNext = (editor, args) => {
        const { direction } = args;
        if (direction === EnterEditorDirection.up) {
            const { x } = args;
            const myBound = getBounds(editor);
            const a = closestSinkToPosition(editor)([x, myBound.top]);
            return a === editor
                ? editor
                : childFromParentNext(a, { direction, x }) ?? null;
        }
        else if (direction === EnterEditorDirection.down) {
            const { x } = args;
            const myBound = getBounds(editor);
            const a = closestSinkToPosition(editor)([x, myBound.bottom]);
            return a === editor
                ? editor
                : childFromParentNext(a, { direction, x }) ?? null;
        }
        else if (direction === EnterEditorDirection.left)
            return (childFromParentNext(Iter.first(children(editor)) ?? null, args) ?? null);
        else if (direction === EnterEditorDirection.right)
            return editor;
        return null;
    };
    const childAbove = (editor) => (childEditor) => above(childEditor, children(editor), getCarryX(editor));
    const childBelow = (editor) => (childEditor) => below(childEditor, children(editor), getCarryX(editor));
    const childAfter = (editor) => (childEditor) => after(childEditor, children(editor));
    const childBefore = (editor) => (childEditor) => before(childEditor, children(editor));
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
    function after(box, boxes) {
        const { lines, index } = linesAndIndex(box, boxes);
        const [y1, x1] = wrapLinesAddXIndex2D(lines, index, +2); // 2 YIntervals per box
        return lines[y1]?.[x1]?.data ?? null;
    }
    function below(box, boxes, carryX) {
        const { lines, index: [y, x], } = linesAndIndex(box, boxes);
        const nextLine = lines[y + 1] ?? [];
        const closestInNextLine = min(nextLine, ({ data }) => carryX ? numXDist(carryX, data) : xDist(box, data));
        return closestInNextLine?.data ?? null;
    }
    function before(box, boxes) {
        const { lines, index } = linesAndIndex(box, boxes);
        const [y1, x1] = wrapLinesAddXIndex2D(lines, index, -2); // 2 YIntervals per box
        return lines[y1]?.[x1]?.data ?? null;
    }
    function above(box, boxes, carryX) {
        const { lines, index: [y, x], } = linesAndIndex(box, boxes);
        const prevLine = lines[y - 1] ?? [];
        const closestInPrevLine = min(prevLine, ({ data }) => carryX ? numXDist(carryX, data) : xDist(box, data));
        return closestInPrevLine?.data ?? null;
    }
    function numXDist(n, el) {
        const a = getBounds(el);
        if (n > a.left && n < a.right)
            return 0;
        if (n >= a.right)
            return n - a.right;
        if (n <= a.left)
            return a.left - n;
        return 0;
    }
    function xDist(el1, el2) {
        const a = getBounds(el1);
        const b = getBounds(el2);
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
        const r = getBounds(el);
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
    return {
        next,
        linesAndIndex,
    };
}
