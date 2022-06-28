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
        return this.closest("[isEditor=true]");
    }
    rootEditor() {
        let curAncestor = this;
        while (true) {
            if (curAncestor.parentEditor)
                curAncestor = curAncestor.parentEditor();
            else
                return curAncestor;
        }
    }
    childEditors() {
        return Array.from(this.querySelectorAll(`[isEditor=true]`));
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
        return this.getAttribute('isFocused') === 'true';
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

          display: inline;
  
          user-select: none;
          
          color: rgba(0,0,0,0.5);
  
          min-height: 1.5rem;
          min-width: 0.4rem;
          border-right: 2px solid transparent;
        }
        :host(:focus) {
          outline: none;
        }
        :host(.isFocused) { /* browser :focus happens if children are focused too :( */
          color: rgba(0,0,0,1);
          border-right: 2px solid black !important;
        }
        :host(.isSelected) {
          background: yellow;
        }
      `;
        this.shadowRoot.append(baseStyleEl, document.createElement("slot"));
        // if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0"); // make tabbable by default
        // focus
        this.addEventListener("focusout", (e) => this.makeUnfocused());
        this.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            this.makeFocused();
        });
        this.addEventListener("keydown", (e) => {
            if (e.key === "Backspace") {
                this.onInputBackspace(e);
            }
            else if (e.key.startsWith("Arrow")) {
                this.isParentEditor()
                    ? this.parentOnInputArrow(e)
                    : this.leafOnInputArrow(e);
            }
        });
    }
    onInputBackspace(e) {
        this.parentEditor()?.deleteChildEditor(this);
        e.stopPropagation();
    }
    parentOnInputArrow(e) {
        const childEditors = this.childEditors().;
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            const lastChildEditor = childEditors[childEditors.length - 1];
            lastChildEditor.focusFromParentEditor({
                direction: EnterEditorDirection.right, // TODO: fix for up
            });
        }
        else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            this.parentEditor()?.focusFromChildEditor({
                childEditor: this,
                direction: ExitEditorDirection.right, // TODO: fix for down
            });
        }
        e.stopPropagation();
    }
    leafOnInputArrow(e) {
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            this.parentEditor()?.focusFromChildEditor({
                childEditor: this,
                direction: ExitEditorDirection.left, // TODO: fix for down
            });
        }
        else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            this.parentEditor()?.focusFromChildEditor({
                childEditor: this,
                direction: ExitEditorDirection.right, // TODO: fix for down
            });
        }
        e.stopPropagation();
    }
    deleteChildEditor(editor) {
        const childEditors = this.childEditors();
        const deleteIndex = childEditors.indexOf(editor);
        if (deleteIndex === -1)
            throw "deleteChildEditor: editor was not found in the parent";
        const prevChild = childEditors[deleteIndex - 1];
        if (prevChild) {
            prevChild.focusFromParentEditor({
                direction: EnterEditorDirection.left,
            });
        }
        else {
            this.makeFocused(); // this may behave strangely, not sure if this case will even come up
        }
        editor.parentNode.removeChild(editor);
    }
    deleteBeforeChildEditor(editor) {
        // TODO! case when deleting e.g. the delimitter in a text editor
    }
    focusFromChildEditor(args) {
        const { childEditor, direction } = args;
        const childEditors = this.childEditors();
        const focusFromIndex = childEditors.indexOf(childEditor);
        if (focusFromIndex === -1)
            throw "focusFromChildEditor: childEditor was not found in the parent";
        if (direction === ExitEditorDirection.up ||
            direction === ExitEditorDirection.left) {
            const prevChild = childEditors[focusFromIndex - 1];
            if (prevChild) {
                prevChild.focusFromParentEditor({
                    direction: enterDirectionFromExitDirection(direction),
                });
            }
            else {
                this.parentEditor()?.focusFromChildEditor({
                    childEditor: this,
                    direction,
                });
            }
        }
        else {
            const nextChild = childEditors[focusFromIndex + 1];
            if (nextChild) {
                nextChild.focusFromParentEditor({
                    direction: enterDirectionFromExitDirection(direction),
                });
            }
            else {
                this.makeFocused();
            }
        }
    }
    focusFromParentEditor(args) {
        if (this.isParentEditor()) {
            this.parentFocusFromParentEditor(args);
        }
        else {
            this.childFocusFromParentEditor(args);
        }
    }
    parentFocusFromParentEditor(args) {
        const { direction } = args;
        if (direction === EnterEditorDirection.left ||
            direction === EnterEditorDirection.up) {
            const childEditors = this.childEditors();
            if (childEditors.length > 0) {
                const lastChildEditor = childEditors[childEditors.length - 1];
                lastChildEditor.focusFromParentEditor({
                    direction: EnterEditorDirection.left, // TODO: fix for up
                });
            }
            else {
                this.makeFocused();
            }
        }
        else {
            this.makeFocused();
        }
    }
    childFocusFromParentEditor(args) {
        this.makeFocused();
    }
    getOutput = () => this.childEditors()
        .map((editor) => editor.getOutput())
        .join();
    makeFocused() {
        this.focus({ preventScroll: true });
        this.setAttribute("isFocused", 'true');
        this.parentEditor()?.makeUnfocused();
    }
    makeUnfocused() {
        this.setAttribute("isFocused", 'false');
    }
}
customElements.define("polytope-editor", EditorElement);
function exitEditorDirectionFromKey(key) {
    return ({
        ArrowUp: ExitEditorDirection.up,
        ArrowRight: ExitEditorDirection.right,
        ArrowDown: ExitEditorDirection.down,
        ArrowLeft: ExitEditorDirection.left,
    }[key] ?? null);
}
function enterDirectionFromExitDirection(exitDirection) {
    return {
        [ExitEditorDirection.up]: EnterEditorDirection.down,
        [ExitEditorDirection.right]: EnterEditorDirection.left,
        [ExitEditorDirection.down]: EnterEditorDirection.up,
        [ExitEditorDirection.left]: EnterEditorDirection.right,
    }[exitDirection];
}
