import { makeCaretNavFunctions } from "./caretNav.js";
import { makeTreeFunctions } from "./structure/tree.js";
export function makeCaretFunctions({ getBounds, parent, children, getCarryX, setCarryX, }) {
    const { lines, childAbove, childAfter, childBefore, childBelow, belowInFirstLine, aboveInLastLine, } = makeCaretNavFunctions({
        getBounds,
        children,
        getCarryX,
    });
    const EdElTree = makeTreeFunctions({
        parent,
        children,
    });
    const firstSpatialChild = (e) => lines(children(e))?.at(0)?.at(0)?.data ?? null;
    const lastSpatialChild = (e) => lines(children(e))?.at(-1)?.at(-1)?.data ?? null;
    const toChild = (parent, child, direction) => {
        const isRoot = EdElTree.isRoot(parent);
        if ("ArrowUp" === direction)
            return childAbove(parent, isRoot)(child);
        if ("ArrowRight" === direction)
            return childAfter(parent)(child);
        if ("ArrowDown" === direction)
            return childBelow(parent, isRoot)(child);
        if ("ArrowLeft" === direction)
            return childBefore(parent)(child);
        return null;
    };
    const next = (e, direction) => {
        if (direction === "ArrowDown" || direction === "ArrowUp")
            setCarryX(e)(getCarryX(e) ?? getBounds(e).right);
        if (direction === "ArrowLeft" || direction === "ArrowRight")
            setCarryX(e)(null);
        return direction === "ArrowLeft" && EdElTree.hasChildren(e)
            ? lastSpatialChild(e)
            : broadenView(e, direction);
    };
    const broadenView = (e, direction) => {
        const par = parent(e);
        if (par === null)
            return null;
        let eNext = toChild(par, e, direction);
        return eNext
            ? zoomIn(eNext, direction)
            : direction === "ArrowRight"
                ? par
                : broadenView(par, direction);
    };
    const zoomIn = (editor, direction) => {
        if (editor === null)
            return null;
        if (EdElTree.isLeaf(editor))
            return editor;
        if (direction === "ArrowLeft")
            return editor;
        else if (direction === "ArrowRight")
            return zoomIn(firstSpatialChild(editor), direction);
        else if (direction === "ArrowDown" || direction === "ArrowUp") {
            const x = getCarryX(editor) ?? 0; // This is guaranteed to be defined in `next` if ArrowDown or ArrowUp was pressed
            const myBound = getBounds(editor);
            const closestIn = direction === "ArrowDown"
                ? belowInFirstLine(x, children(editor))
                : direction === "ArrowUp"
                    ? aboveInLastLine(x, children(editor))
                    : null;
            if (closestIn &&
                Math.abs(getBounds(closestIn).right - x) <= Math.abs(myBound.right - x))
                return zoomIn(closestIn, direction);
            else
                return editor;
        }
        return null;
    };
    return {
        next,
        lines,
    };
}
