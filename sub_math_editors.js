import { MathEditorElement } from "./editor.js";

export const UnaryJoinerElement = (outputFuncName, createElements) => {
    class C extends HTMLElement {
        parentEditor = undefined;
        constructor({ parentEditor, code=[] }={}) {
            super();
            //if (!parentEditor) throw `No parent editor on unary ${outputFuncName} joiner element`;
            this.parentEditor = parentEditor;

            this.editor = new MathEditorElement({ parentEditor: this, code });

            this.attachShadow({mode: 'open'});
            this.shadowRoot.append(...createElements(this.editor));

            this.addEventListener('focus', (e) => {
                e.stopPropagation();
                this.focus();
            });
            //this.addEventListener('blur', (e) => e.stopPropagation());
            this.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                this.focus();
            });
            this.addEventListener('mousemove', (e) => e.stopPropagation());
            //this.addEventListener('keydown', (e) => e.stopPropagation());
        }

        focus(fromEl, position, isSelecting) {
            super.focus();

            if (fromEl !== undefined && position !== undefined) {
                if (fromEl === this.editor) { // case: entering from leftEditor
                    if (position === 1) {
                        this.blur();
                        this.parentEditor.focus(this, 1, false);
                    }
                    if (position === 0) {
                        this.blur();
                        this.parentEditor.focus(this, 0, false);
                    }
                    return;
                }

                if (position === 1) { // case: entering from a parent on the left
                    this.blur();
                    this.editor.focus(this, 1, false);
                }
                if (position === 0) { // case: entering from a parent on the right
                    this.blur();
                    this.editor.focus(this, 0, false);
                }
                return;
            }
            this.blur();
            this.editor.focus(this, 1, false);
        }

        getOutput() {
            return `${outputFuncName}(${this.editor.getOutput()})`;
        }
    }

    customElements.define(`${outputFuncName}-unary-joiner-editor`, C);
    return C;
}

export const BinaryJoinerElement = (outputFuncName, createElements) => {
    class C extends HTMLElement {
        parentEditor = undefined;
        constructor({ parentEditor, leftCode=[], rightCode=[] }={}) {
            super();
            //if (!parentEditor) throw `No parent editor on binary ${outputFuncName} joiner element`;
            this.parentEditor = parentEditor;

            this.leftEditor = new MathEditorElement({ parentEditor: this, code: leftCode });
            this.rightEditor = new MathEditorElement({ parentEditor: this, code: rightCode });

            this.attachShadow({mode: 'open'});
            this.shadowRoot.append(...createElements(this.leftEditor, this.rightEditor));

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
            return `${outputFuncName}(${this.leftEditor.getOutput()}, ${this.rightEditor.getOutput()})`;
        }
    }

    customElements.define(`${outputFuncName}-binary-joiner-editor`, C);
    return C;
};

export const DivJoinerElement = BinaryJoinerElement(
    'div',
    (leftEditor, rightEditor) => {
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            :host {
                display: inline-flex;
                vertical-align: middle;
                flex-direction: column;
                align-items: stretch;
            }

            div {
                width: 100%;
                height: 2px;
                background: currentColor;
            }
        `;
        const divEl = document.createElement('div');
        return [styleEl, leftEditor, divEl, rightEditor];
    },
);

export const BinarySymbolJoinerElement = (outputFuncName, symbol) => BinaryJoinerElement(
    outputFuncName,
    (leftEditor, rightEditor) => {
        const plusEl = document.createElement('span');
        plusEl.textContent = symbol;
        return [leftEditor, plusEl, rightEditor];
    },
);
export const PlusJoinerElement = BinarySymbolJoinerElement('plus', '+');

export const ExpJoinerElement = BinaryJoinerElement(
    'exp',
    (leftEditor, rightEditor) => {
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            :host {
                display: inline-flex;
            }

            .right {
                margin-bottom: 0.5rem;
                transform: scale(0.9);
            }

            .left {
                align-self: flex-end;
            }
        `;
        leftEditor.className = 'left';
        rightEditor.className = 'right';
        return [styleEl, leftEditor, rightEditor];
    },
);

export const RadicalJoinerElement = UnaryJoinerElement(
    'sqrt',
    (editor) => {
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            :host {
                display: inline-flex;
                align-items: stretch;
                vertical-align: middle;
            }
            span{
                border-top: 2px solid currentColor;
            }
            img {
                width: 30px;
                flex-shrink: 1;
                flex-grow: 1;
                object-fit: fill;
            }

        `;
        const objEl = document.createElement('img');
        objEl.src = './radical.svg';
        const rootEditorWrapperEl = document.createElement('span');
        rootEditorWrapperEl.append(editor);
        return [styleEl, objEl, rootEditorWrapperEl];
    },
);
