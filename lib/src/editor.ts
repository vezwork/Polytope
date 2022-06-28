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

function yBiasedManhattanDist(
  [x1, y1]: [number, number],
  [x2, y2]: [number, number]
) {
  return Math.abs(x1 - x2) * 2 + Math.abs(y1 - y2);
}

function closestPointOnBounds(
  [x, y]: [number, number],
  {
    top,
    right,
    bottom,
    left,
  }: { top: number; right: number; bottom: number; left: number }
): [number, number] {
  return [clamp(left, x, right), clamp(top, y, bottom)];
}

function clamp(min: number, n: number, max: number) {
  return Math.max(min, Math.min(n, max));
}

export class EditorElement extends HTMLElement {
  static meta?: EditorMetaObject;

  parentEditor(): EditorElement | null {
    // could be optimizing it by caching it against the parent element?
    return this.parentElement.closest("[isEditor=true]");
  }
  rootEditor() {
    let curAncestor: EditorElement = this;
    while (true) {
      if (curAncestor.parentEditor) curAncestor = curAncestor.parentEditor();
      else return curAncestor;
    }
  }

  descendentEditors(): EditorElement[] {
    return Array.from(this.querySelectorAll(`[isEditor=true]`));
  }
  childEditors(): EditorElement[] {
    const descendents = this.descendentEditors();
    return descendents.filter(
      (editor) => !descendents.includes(editor.parentEditor())
    );
  }
  focusedDescendent(): EditorElement | null {
    return this.querySelector(`[isEditor=true][isFocused=true]`);
  }

  childBelow(
    childEditor: EditorElement,
    carryX: number | null
  ): EditorElement | null {
    // mild spatial nav
    const boundsChild = childEditor.getBoundingClientRect();
    const boundsChildEditors = this.childEditors().map((editor) => ({
      editor,
      bounds: editor.getBoundingClientRect(),
    }));
    const boundsBelow = boundsChildEditors.filter(
      ({ editor, bounds }) =>
        boundsChild.bottom < bounds.top && editor !== childEditor
    );
    const closestBelow = boundsBelow.sort(
      (a, b) =>
        yBiasedManhattanDist(
          [carryX ?? boundsChild.right, boundsChild.bottom],
          closestPointOnBounds(
            [carryX ?? boundsChild.right, boundsChild.bottom],
            a.bounds
          )
        ) -
        yBiasedManhattanDist(
          [carryX ?? boundsChild.right, boundsChild.bottom],
          closestPointOnBounds(
            [carryX ?? boundsChild.right, boundsChild.bottom],
            b.bounds
          )
        )
    );
    return closestBelow[0]?.editor ?? null;
  }
  childAbove(
    childEditor: EditorElement,
    carryX: number | null
  ): EditorElement | null {
    // mild spatial nav
    const boundsChild = childEditor.getBoundingClientRect();
    const boundsChildEditors = this.childEditors().map((editor) => ({
      editor,
      bounds: editor.getBoundingClientRect(),
    }));
    const boundsAbove = boundsChildEditors.filter(
      ({ editor, bounds }) =>
        boundsChild.top > bounds.bottom && editor !== childEditor
    );
    const closestAbove = boundsAbove.sort(
      (a, b) =>
        yBiasedManhattanDist(
          [carryX ?? boundsChild.right, boundsChild.top],
          closestPointOnBounds(
            [carryX ?? boundsChild.right, boundsChild.top],
            a.bounds
          )
        ) -
        yBiasedManhattanDist(
          [carryX ?? boundsChild.right, boundsChild.top],
          closestPointOnBounds(
            [carryX ?? boundsChild.right, boundsChild.top],
            b.bounds
          )
        )
    );
    return closestAbove[0]?.editor ?? null;
  }
  childBefore(childEditor: EditorElement): EditorElement | null {
    const childEditors = this.childEditors();
    return childEditors[childEditors.indexOf(childEditor) - 1] ?? null;
  }
  childAfter(childEditor: EditorElement): EditorElement | null {
    const childEditors = this.childEditors();
    return childEditors[childEditors.indexOf(childEditor) + 1] ?? null;
  }

  // distance to entire child bounding boxes or to just `this`'s right side
  closestChildOrThisToPosition(pos: [number, number]): EditorElement {
    const closestChild = this.childEditors().sort((a, b) => {
      const aBound = a.getBoundingClientRect();
      const bBound = b.getBoundingClientRect();
      return (
        yBiasedManhattanDist(pos, closestPointOnBounds(pos, aBound)) - // should really be dist to the entire right vertical segment
        yBiasedManhattanDist(pos, closestPointOnBounds(pos, bBound))
      );
    })[0];

    const myBound = this.getBoundingClientRect();
    const distToClosestChild = yBiasedManhattanDist(
      pos,
      closestPointOnBounds(pos, closestChild.getBoundingClientRect())
    );
    const distToRightSideOfThis = yBiasedManhattanDist(
      pos,
      closestPointOnBounds(pos, {
        top: myBound.top,
        right: myBound.right,
        bottom: myBound.bottom,
        left: myBound.right - 1,
      })
    );
    if (distToClosestChild < distToRightSideOfThis) {
      return closestChild;
    } else {
      return this;
    }
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
    this.shadowRoot.append(baseStyleEl, document.createElement("slot"));

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
      if (e.key === "Backspace") {
        this.onInputBackspace(e);
      } else if (e.key.startsWith("Arrow")) {
        this.isParentEditor()
          ? this.parentOnInputArrow(e)
          : this.leafOnInputArrow(e);
      }
    });
  }

  private onInputBackspace(e: KeyboardEvent) {
    this.parentEditor()?.deleteChildEditor(this);
    e.stopPropagation();
  }

  private parentOnInputArrow(e: KeyboardEvent) {
    if (e.key === "ArrowLeft") {
      const childEditors = this.childEditors();
      const lastChildEditor = childEditors[childEditors.length - 1];
      lastChildEditor.focusFromParentEditor({
        direction: EnterEditorDirection.right,
      });
    } else {
      this.parentEditor()?.focusFromChildEditor({
        childEditor: this,
        direction: exitEditorDirectionFromKey(e.key),
        x: this.carryX ?? this.getBoundingClientRect().right,
      });
    }
    e.stopPropagation();
  }

  private leafOnInputArrow(e: KeyboardEvent) {
    this.parentEditor()?.focusFromChildEditor({
      childEditor: this,
      direction: exitEditorDirectionFromKey(e.key),
      x: this.carryX ?? this.getBoundingClientRect().right,
    });
    e.stopPropagation();
  }

  deleteChildEditor(editor: EditorElement) {
    const childEditors = this.childEditors();
    const deleteIndex = childEditors.indexOf(editor);
    if (deleteIndex === -1)
      throw "deleteChildEditor: editor was not found in the parent";

    const prevChild = childEditors[deleteIndex - 1];
    if (prevChild) {
      prevChild.focusFromParentEditor({
        direction: EnterEditorDirection.left,
      });
    } else {
      this.makeFocused(); // this may behave strangely, not sure if this case will even come up
    }

    editor.parentNode.removeChild(editor);
  }

  deleteBeforeChildEditor(editor: EditorElement) {
    // TODO! case when deleting e.g. the delimitter in a text editor
  }

  carryX: number | null = null;

  focusFromChildEditor(args: FocusFromChildEditorArgs) {
    console.debug("focusFromChildEditor", this, args);
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

    const toChild = {
      [ExitEditorDirection.up]: this.childAbove(childEditor, this.carryX),
      [ExitEditorDirection.right]: this.childAfter(childEditor),
      [ExitEditorDirection.down]: this.childBelow(childEditor, this.carryX),
      [ExitEditorDirection.left]: this.childBefore(childEditor),
    }[direction];

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
    console.debug("focusFromParentEditor", this, args);
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
      const a = this.closestChildOrThisToPosition([x, myBound.top]);
      if (a === this) this.makeFocused();
      else a.focusFromParentEditor({ direction, x }); // TODO: fix for carryX
    } else if (direction === EnterEditorDirection.down) {
      const { x } = args;
      const myBound = this.getBoundingClientRect();
      const a = this.closestChildOrThisToPosition([x, myBound.bottom]);
      if (a === this) this.makeFocused();
      else a.focusFromParentEditor({ direction, x }); // TODO: fix for carryX
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
  key: KeyboardEvent["key"]
): ExitEditorDirection | null {
  return (
    {
      ArrowUp: ExitEditorDirection.up,
      ArrowRight: ExitEditorDirection.right,
      ArrowDown: ExitEditorDirection.down,
      ArrowLeft: ExitEditorDirection.left,
    }[key] ?? null
  );
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
