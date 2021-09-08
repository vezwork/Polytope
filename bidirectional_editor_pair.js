import { MathEditorElement, TextEditorElement } from "./editor.js";
import { stringToEditor } from "./string_to_editor.js";

export class BidirectionalEditorPair extends HTMLElement {
    parentEditor = undefined;
    constructor({ parentEditor }={}) {
        super();
        //if (!parentEditor) throw `No parent editor on binary ${outputFuncName} joiner element`;
        this.parentEditor = parentEditor;

        this.leftEditor = new TextEditorElement({ parentEditor: this });
        this.rightEditor = new MathEditorElement({ parentEditor: this });
        this.leftEditor.style.width = 500;
        this.rightEditor.style.width = 500;
        this.leftEditor.style.height = 500;
        this.rightEditor.style.height = 500;

        this.attachShadow({mode: 'open'});
        this.shadowRoot.append(this.leftEditor, this.rightEditor);

        this.addEventListener('focus', (e) => {
            e.stopPropagation();
            this.focus();
        });
        //this.addEventListener('blur', (e) => e.stopPropagation());
        this.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.focus();
        });
        //this.addEventListener('keydown', (e) => e.stopPropagation());
        this.addEventListener('childEditorUpdate', (e) => {
            const { out, editor } = e.detail;
            console.log('debuga', e.detail)
            if (editor instanceof TextEditorElement && !(editor instanceof MathEditorElement)) {
                const newRightEditor = new MathEditorElement({
                    code: stringToEditor(out).output,
                    parentEditor: this
                });
                this.shadowRoot.replaceChild(newRightEditor, this.rightEditor);
                this.rightEditor = newRightEditor;
            }
            if (editor instanceof MathEditorElement) {
                const newLeftEditor = new TextEditorElement({
                    code: out.split(''),
                    parentEditor: this
                })
                this.shadowRoot.replaceChild(newLeftEditor, this.leftEditor);
                this.leftEditor = newLeftEditor;
                
            }
            this.leftEditor.style.width = 500;
            this.rightEditor.style.width = 500;
            this.leftEditor.style.height = 500;
        this.rightEditor.style.height = 500;
        })
    }

    focus(fromEl, position, isSelecting) {
        super.focus();

        // TODO: add handling for backspace out of right editor

        if (fromEl !== undefined && position !== undefined) {
            if (fromEl === this.leftEditor) { // case: entering from leftEditor
                if (position === 1) {
                    this.blur();
                    this.rightEditor.focus(this, 1, false);
                }
                if (position === 0) {
                    this.blur();
                    this.parentEditor.focus(this, 0, false);
                }
                return;
            } else if (fromEl === this.rightEditor) { // case: entering from rightEditor
                if (position === 1) {
                    this.blur();
                    this.parentEditor.focus(this, 1, false);
                }
                if (position === 0) {
                    this.blur();
                    this.leftEditor.focus(this, 0, false);
                }
                return;
            }

            if (position === 1) { // case: entering from a parent on the left
                this.blur();
                this.leftEditor.focus(this, 1, false);
            }
            if (position === 0) { // case: entering from a parent on the right
                this.blur();
                this.rightEditor.focus(this, 0, false);
            }
            return;
        }
        this.blur();
        this.rightEditor.focus(this, 1, false);
    }

    getOutput() {
        return this.leftEditor.getOutput();
    }
}

customElements.define(`bidirectional-editor-pair`, BidirectionalEditorPair);
