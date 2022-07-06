import {
  closestElementAbove,
  closestElementBelow,
  closestElementToPosition,
} from "./closestElement.js";

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

  // spatial vertical nav
  childAbove(childEditor: EditorElement): EditorElement | null {
    return closestElementAbove(childEditor, this.childEditors(), this.carryX);
  }
  childBelow(childEditor: EditorElement): EditorElement | null {
    return closestElementBelow(childEditor, this.childEditors(), this.carryX);
  }
  // html tree ordered horizontal nav
  childAfter(childEditor: EditorElement): EditorElement | null {
    const childEditors = this.childEditors();
    return childEditors[childEditors.indexOf(childEditor) + 1] ?? null;
  }
  childBefore(childEditor: EditorElement): EditorElement | null {
    const childEditors = this.childEditors();
    return childEditors[childEditors.indexOf(childEditor) - 1] ?? null;
  }
  // distance to entire child bounding boxes or to just `this`'s right side
  closestSinkToPosition(position: [number, number]): EditorElement {
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
      if (e.key.startsWith("Arrow")) {
        this.isParentEditor()
          ? this.parentOnInputArrow(e)
          : this.leafOnInputArrow(e);
      }
    });
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
      [ExitEditorDirection.up]: this.childAbove(childEditor),
      [ExitEditorDirection.right]: this.childAfter(childEditor),
      [ExitEditorDirection.down]: this.childBelow(childEditor),
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
      const a = this.closestSinkToPosition([x, myBound.top]);
      if (a === this) this.makeFocused();
      else a.focusFromParentEditor({ direction, x });
    } else if (direction === EnterEditorDirection.down) {
      const { x } = args;
      const myBound = this.getBoundingClientRect();
      const a = this.closestSinkToPosition([x, myBound.bottom]);
      if (a === this) this.makeFocused();
      else a.focusFromParentEditor({ direction, x });
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
