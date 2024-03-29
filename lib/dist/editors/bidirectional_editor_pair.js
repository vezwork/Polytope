import { EditorElement } from "../editor.js";
export const BidirectionalEditorPair = ({ leftEditorFactory, rightEditorFactory, leftEditorOutput = (editor) => editor.getOutput(), leftToRightTransformer = (arg) => arg, rightEditorOutput = (editor) => editor.getOutput(), rightToLeftTransformer = (arg) => arg, output = (leftEditor, rightEditor) => leftEditor.getOutput(), name = "no-name", }) => {
    class C extends EditorElement {
        meta = {
            editorName: name,
        };
        leftEditor;
        rightEditor;
        constructor(arg) {
            super(arg);
            this.leftEditor = leftEditorFactory("", this);
            this.rightEditor = rightEditorFactory("", this);
            this.leftEditor.style.width = "400";
            this.rightEditor.style.width = "400";
            this.leftEditor.style.height = "400";
            this.rightEditor.style.height = "400";
            const midEl = document.createElement("span");
            midEl.textContent = "⇄";
            this.shadowRoot.append(this.leftEditor, midEl, this.rightEditor);
            this.addEventListener("focus", (e) => {
                e.stopPropagation();
                this.focusEditor();
            });
            //this.addEventListener('blur', (e) => e.stopPropagation());
            this.addEventListener("mousedown", (e) => {
                e.stopPropagation();
                this.focusEditor();
            });
            //this.addEventListener('keydown', (e) => e.stopPropagation());
            this.addEventListener("childEditorUpdate", (e) => {
                try {
                    const { editor } = e.detail;
                    if (editor === this.leftEditor) {
                        const out = leftEditorOutput(editor);
                        const newRightEditor = rightEditorFactory(leftToRightTransformer(out), this);
                        this.shadowRoot.replaceChild(newRightEditor, this.rightEditor);
                        this.rightEditor = newRightEditor;
                    }
                    if (editor === this.rightEditor) {
                        const out = rightEditorOutput(editor);
                        const newLeftEditor = leftEditorFactory(rightToLeftTransformer(out), this);
                        this.shadowRoot.replaceChild(newLeftEditor, this.leftEditor);
                        this.leftEditor = newLeftEditor;
                    }
                    this.parentEditor?.dispatchEvent(new CustomEvent("childEditorUpdate", {
                        detail: {
                            out: this.getOutput(),
                            editor: this,
                        },
                    }));
                    this.leftEditor.style.width = "400";
                    this.rightEditor.style.width = "400";
                    this.leftEditor.style.height = "400";
                    this.rightEditor.style.height = "400";
                    this.style.outline = "none";
                }
                catch (e) {
                    this.style.outline = "2px solid red";
                    console.error(e);
                }
            });
        }
        focusEditor(fromEl, position, isSelecting) {
            super.focus();
            // TODO: add handling for backspace out of right editor
            if (fromEl !== undefined && position !== undefined) {
                if (fromEl === this.leftEditor) {
                    // case: entering from leftEditor
                    if (position === 1) {
                        this.blur();
                        this.rightEditor.focusEditor(this, 1, false);
                    }
                    if (position === 0) {
                        this.blur();
                        this.parentEditor.focusEditor(this, 0, false);
                    }
                    return;
                }
                else if (fromEl === this.rightEditor) {
                    // case: entering from rightEditor
                    if (position === 1) {
                        this.blur();
                        this.parentEditor.focusEditor(this, 1, false);
                    }
                    if (position === 0) {
                        this.blur();
                        this.leftEditor.focusEditor(this, 0, false);
                    }
                    return;
                }
                if (position === 1) {
                    // case: entering from a parent on the left
                    this.blur();
                    this.leftEditor.focusEditor(this, 1, false);
                }
                if (position === 0) {
                    // case: entering from a parent on the right
                    this.blur();
                    this.rightEditor.focusEditor(this, 0, false);
                }
                return;
            }
            this.blur();
            this.rightEditor.focusEditor(this, 1, false);
        }
        getOutput() {
            return output(this.leftEditor, this.rightEditor);
        }
    }
    customElements.define(`bidirectional-${name}-editor-pair`, C);
    return C;
};
export const UnidirectionalEditorPair = ({ leftEditorFactory, leftEditorOutput = (editor) => editor.getOutput(), transformer = (arg) => arg, rightEditorFactory, output = (leftEditor, rightEditor) => leftEditor.getOutput(), name = "no-name", }) => {
    class C extends EditorElement {
        leftEditor;
        rightEditor;
        constructor(arg) {
            super(arg);
            //if (!parentEditor) throw `No parent editor on binary ${outputFuncName} joiner element`;
            this.leftEditor = leftEditorFactory("", this);
            this.rightEditor = rightEditorFactory("", this);
            this.leftEditor.style.width = "400";
            this.rightEditor.style.width = "400";
            this.leftEditor.style.height = "400";
            this.rightEditor.style.height = "400";
            const midEl = document.createElement("span");
            midEl.textContent = "→";
            this.shadowRoot.append(this.leftEditor, midEl, this.rightEditor);
            this.addEventListener("focus", (e) => {
                e.stopPropagation();
                this.focusEditor();
            });
            //this.addEventListener('blur', (e) => e.stopPropagation());
            this.addEventListener("mousedown", (e) => {
                e.stopPropagation();
                this.focusEditor();
            });
            //this.addEventListener('keydown', (e) => e.stopPropagation());
            this.addEventListener("childEditorUpdate", (e) => {
                const { editor } = e.detail;
                if (editor === this.leftEditor) {
                    const out = leftEditorOutput(editor);
                    const newRightEditor = rightEditorFactory(transformer(out), this);
                    this.shadowRoot.replaceChild(newRightEditor, this.rightEditor);
                    this.rightEditor = newRightEditor;
                    this.parentEditor?.dispatchEvent(new CustomEvent("childEditorUpdate", {
                        detail: {
                            out: this.getOutput(),
                            editor: this,
                        },
                    }));
                }
                this.leftEditor.style.width = "400";
                this.rightEditor.style.width = "400";
                this.leftEditor.style.height = "400";
                this.rightEditor.style.height = "400";
            });
        }
        focusEditor(fromEl, position, isSelecting) {
            super.focus();
            // TODO: add handling for backspace out of right editor
            if (fromEl !== undefined && position !== undefined) {
                if (fromEl === this.leftEditor) {
                    // case: entering from leftEditor
                    if (position === 1) {
                        this.blur();
                        this.rightEditor.focusEditor(this, 1, false);
                    }
                    if (position === 0) {
                        this.blur();
                        this.parentEditor.focusEditor(this, 0, false);
                    }
                    return;
                }
                else if (fromEl === this.rightEditor) {
                    // case: entering from rightEditor
                    if (position === 1) {
                        this.blur();
                        this.parentEditor.focusEditor(this, 1, false);
                    }
                    if (position === 0) {
                        this.blur();
                        this.leftEditor.focusEditor(this, 0, false);
                    }
                    return;
                }
                if (position === 1) {
                    // case: entering from a parent on the left
                    this.blur();
                    this.leftEditor.focusEditor(this, 1, false);
                }
                if (position === 0) {
                    // case: entering from a parent on the right
                    this.blur();
                    this.rightEditor.focusEditor(this, 0, false);
                }
                return;
            }
            this.blur();
            this.rightEditor.focusEditor(this, 1, false);
        }
        getOutput() {
            return output(this.leftEditor, this.rightEditor);
        }
    }
    customElements.define(`unidirectional-${name}-editor-pair`, C);
    return C;
};
export const ConstructiveUnidirectionalEditor = ({ leftEditorFactory, leftEditorOutput, name = "no-name", }) => {
    class C extends EditorElement {
        meta = {
            editorName: name,
        };
        leftEditor;
        rightEditor;
        constructor(arg) {
            super(arg);
            this.style.setProperty("--editor-name", `'eval'`);
            this.style.setProperty("--editor-color", "gray");
            this.style.setProperty("--editor-name-color", "white");
            this.style.setProperty("--editor-background-color", "LightGray");
            this.style.setProperty("--editor-outline-color", "gray");
            const styleEl = document.createElement("style");
            styleEl.textContent = `
            .but {
              display: inline-block;
              cursor: pointer;
              opacity: 0.8;
              padding: 2px;
              margin: 1px 1px 1px 6px;
              background: var(--editor-name-color);
              color: var(--editor-color);
              border-radius: 0 0 3px 3px;
            }
            .but:hover {
              opacity: 1;
            }
        `;
            this.shadowRoot.append(styleEl);
            this.leftEditor = leftEditorFactory(arg.leftCode, this);
            this.leftEditor.parentEditor = this;
            this.rightEditor = document.createElement("span");
            const midEl = document.createElement("div");
            midEl.innerHTML = `⟶eval⟶`;
            const butEl = document.createElement("button");
            butEl.innerText = "take";
            butEl.addEventListener("click", async () => this.parentEditor?.dispatchEvent(new CustomEvent("subEditorReplaced", {
                detail: {
                    old: this,
                    new: this.rightEditor,
                },
            })));
            this.shadowRoot.append(this.leftEditor, midEl, this.rightEditor, butEl);
            this.addEventListener("focus", (e) => {
                e.stopPropagation();
                this.focusEditor();
            });
            //this.addEventListener('blur', (e) => e.stopPropagation());
            this.addEventListener("mousedown", (e) => {
                e.stopPropagation();
                this.focusEditor();
            });
            //this.addEventListener('keydown', (e) => e.stopPropagation());
            const onUpdate = async () => {
                const out = leftEditorOutput(this.leftEditor);
                try {
                    console.log("(" + JSON.stringify(eval(out)) + ")");
                    //const rightEditor = (await evalModule(out)).default;
                    const rightEditor = this.builder("(" + JSON.stringify(eval(out)) + ")").output[0];
                    rightEditor.parentEditor = this;
                    this.shadowRoot.replaceChild(rightEditor, this.rightEditor);
                    this.rightEditor = rightEditor;
                }
                catch (er) { }
            };
            this.addEventListener("childEditorUpdate", onUpdate);
            onUpdate();
        }
        focusEditor(fromEl, position, isSelecting) {
            super.focus();
            // TODO: add handling for backspace out of right editor
            if (fromEl !== undefined && position !== undefined) {
                if (fromEl === this.leftEditor) {
                    // case: entering from leftEditor
                    if (position === 1) {
                        this.blur();
                        if (this.rightEditor instanceof EditorElement)
                            this.rightEditor.focusEditor(this, 1, false);
                    }
                    if (position === 0) {
                        this.blur();
                        this.parentEditor.focusEditor(this, 0, false);
                    }
                    return;
                }
                else if (fromEl === this.rightEditor) {
                    // case: entering from rightEditor
                    if (position === 1) {
                        this.blur();
                        this.parentEditor.focusEditor(this, 1, false);
                    }
                    if (position === 0) {
                        this.blur();
                        this.leftEditor.focusEditor(this, 0, false);
                    }
                    return;
                }
                if (position === 1) {
                    // case: entering from a parent on the left
                    this.blur();
                    this.leftEditor.focusEditor(this, 1, false);
                }
                if (position === 0) {
                    // case: entering from a parent on the right
                    this.blur();
                    if (this.rightEditor instanceof EditorElement)
                        this.rightEditor.focusEditor(this, 0, false);
                }
                return;
            }
            this.blur();
            if (this.rightEditor instanceof EditorElement)
                this.rightEditor.focusEditor(this, 1, false);
        }
        getOutput() {
            if (this.rightEditor instanceof EditorElement &&
                this.rightEditor?.getOutput) {
                return this.rightEditor.getOutput();
            }
            else {
                return "";
            }
        }
    }
    customElements.define(`constructive-unidirectional-${name}-editor-pair`, C);
    return C;
};
// async function evalModule(js) {
//   const encodedJs = encodeURIComponent(js);
//   const dataUri = "data:text/javascript;charset=utf-8," + encodedJs;
//   return import(dataUri);
// }
