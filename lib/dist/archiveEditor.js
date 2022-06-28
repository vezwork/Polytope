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
    parentEditor = undefined;
    rootEditor() {
        let curAncestor = this;
        while (true) {
            if (curAncestor.parentEditor)
                curAncestor = curAncestor.parentEditor;
            else
                return curAncestor;
        }
    }
    builder;
    selectionStartEditor = null;
    constructor({ parentEditor, builder } = {
        parentEditor: undefined,
    }) {
        super();
        const meta = this.constructor.meta;
        this.builder = builder;
        this.parentEditor = parentEditor;
        this.attachShadow({ mode: "open" });
        const paletteEl = document.createElement("div");
        paletteEl.className = "palette";
        paletteEl.innerText = meta?.name ?? "_";
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
        .palette {
          display: none;
        }
      `;
        this.shadowRoot.append(baseStyleEl, paletteEl);
        if (meta?.isStyled !== false) {
            const styleEl = document.createElement("style");
            styleEl.textContent = `
        :host {
          --editor-name: 'editor';
          --editor-color: #017BFF;
          --editor-name-color: white;
          --editor-background-color: #E6F2FF;
          --editor-outline-color: #d4e9ff;
  
          // unused:
          --highlight-text-color: black;
          --highlight-editor-color: yellow;
          --highlight-editor-name-color: black;
          --highlight-editor-background-color: yellow;
  
          display: inline-flex;
  
          vertical-align: middle;
  
          border-radius: 4px;
          background: var(--editor-background-color);
          border: 2px solid var(--editor-outline-color);
          box-sizing: border-box;
          position: relative;
          font-family: monospace;
  
          line-height: 1;
        }
        :host(.isFocused) .palette {
            display: block;
            font-size: 14px;
            padding: 2px 5px;
            background: var(--editor-color);
            color: var(--editor-name-color);
            position: absolute;
            top: 100%;
            left: -2px;
            border-radius: 0 0 4px 4px;
            font-family: monospace;
            z-index: 10;
        }
        :host(.isFocused) {
            border: 2px solid var(--editor-color);
        }
        :host(:not(.isFocused)) {
            color: rgba(0,0,0,0.5);
        }
      `;
            this.shadowRoot.append(styleEl, document.createElement("slot"));
        }
        if (!this.hasAttribute("tabindex"))
            this.setAttribute("tabindex", "0"); // make tabbable by default
        this.setAttribute("isEditor", "true");
        // focus
        this.addEventListener("focusout", (e) => this.makeUnfocused());
        // inputs
        this.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            this.makeFocused();
            this.rootEditor().clearChildSelections();
        });
        this.addEventListener("mousemove", (e) => {
            const isLeftDown = (e.buttons & 1) === 1;
            if (isLeftDown && this.childEditors().length === 0) {
                const rootEditor = this.rootEditor();
                if (rootEditor.selectionStartEditor) {
                    let isInLinearSelection = false;
                    for (const editor of rootEditor.childEditors()) {
                        if (editor === rootEditor.selectionStartEditor || editor === this) {
                            if (editor.childEditors().length === 0)
                                editor.makeSelected();
                            if (rootEditor.selectionStartEditor === this) {
                                isInLinearSelection = false;
                            }
                            else {
                                if (isInLinearSelection)
                                    this.makeFocused();
                                isInLinearSelection = !isInLinearSelection;
                            }
                        }
                        else if (isInLinearSelection) {
                            editor.makeSelected();
                        }
                        else {
                            editor.makeUnselected();
                        }
                    }
                }
                else {
                    rootEditor.selectionStartEditor = this;
                }
            }
            e.stopPropagation();
        });
        this.addEventListener("keydown", (e) => {
            this.rootEditor().clearChildSelections();
            if (e.key === "Backspace") {
                // delete
                this.parentEditor?.deleteChildEditor(this);
                e.stopPropagation();
            }
            else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                const childEditors = this.childEditors();
                if (childEditors.length > 0) {
                    const lastChildEditor = childEditors[childEditors.length - 1];
                    lastChildEditor.focusFromParentEditor({
                        direction: EnterEditorDirection.right, // TODO: fix for up
                    });
                }
                else {
                    this.parentEditor?.focusFromChildEditor({
                        childEditor: this,
                        direction: ExitEditorDirection.left, // TODO: fix for down
                    });
                }
                e.stopPropagation();
            }
            else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                this.parentEditor?.focusFromChildEditor({
                    childEditor: this,
                    direction: ExitEditorDirection.right, // TODO: fix for down
                });
                e.stopPropagation();
            }
        });
    }
    childEditors() {
        return Array.from(this.querySelectorAll(`[isEditor=true]`));
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
        // TODO!
    }
    clearChildSelections() {
        this.makeUnselected();
        this.rootEditor().selectionStartEditor = null;
        for (const editor of this.childEditors())
            editor.makeUnselected();
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
                this.parentEditor?.focusFromChildEditor({
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
    getOutput = () => this.childEditors()
        .map((editor) => editor.getOutput())
        .join();
    makeSelected() {
        this.classList.add("isSelected");
    }
    makeUnselected() {
        this.classList.remove("isSelected");
    }
    makeFocused() {
        this.focus({ preventScroll: true });
        this.classList.add("isFocused");
        if (this.parentEditor)
            this.parentEditor.makeUnfocused();
    }
    makeUnfocused() {
        this.classList.remove("isFocused");
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
