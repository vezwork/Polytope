import { MathEditorElement } from "./editor.js";

export const UnaryJoinerElement = (outputFuncName, createElements) => {
    class C extends HTMLElement {
        parentEditor = undefined;
        constructor({ parentEditor, code = [] } = {}) {
            super();
            //if (!parentEditor) throw `No parent editor on unary ${outputFuncName} joiner element`;
            this.parentEditor = parentEditor;

            this.editor = new MathEditorElement({ parentEditor: this, code });

            this.attachShadow({ mode: 'open' });
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
            this.addEventListener('childEditorUpdate', (e) => {
                this.parentEditor?.dispatchEvent(
                    new CustomEvent(
                        'childEditorUpdate',
                        { detail: this.getOutput() }
                    )
                );
            })
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
        constructor({ parentEditor, leftCode = [], rightCode = [] } = {}) {
            super();
            //if (!parentEditor) throw `No parent editor on binary ${outputFuncName} joiner element`;
            this.parentEditor = parentEditor;

            this.leftEditor = new MathEditorElement({ parentEditor: this, code: leftCode });
            this.rightEditor = new MathEditorElement({ parentEditor: this, code: rightCode });

            this.attachShadow({ mode: 'open' });
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
            this.addEventListener('childEditorUpdate', (e) => {
                this.parentEditor?.dispatchEvent(
                    new CustomEvent(
                        'childEditorUpdate',
                        { detail: this.getOutput() }
                    )
                );
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
            return `${outputFuncName}(${this.leftEditor.getOutput()}, ${this.rightEditor.getOutput()})`;
        }
    }

    customElements.define(`${outputFuncName}-binary-joiner-editor`, C);
    return C;
};

export const GridJoinerElement = (outputFuncName, createElements) => {
    class C extends HTMLElement {
        parentEditor = undefined;
        constructor({ parentEditor, code2DArray = [[[]]] } = {}) {
            super();
            //if (!parentEditor) throw `No parent editor on binary ${outputFuncName} joiner element`;
            this.parentEditor = parentEditor;

            this.editor2DArray = [];
            for (let x = 0; x < code2DArray.length; x++) {
                this.editor2DArray[x] = [];
                for (let y = 0; y < code2DArray[x].length; y++) {
                    this.editor2DArray[x][y] = new MathEditorElement({
                        parentEditor: this,
                        code: code2DArray[x][y]
                    });
                }
            }

            this.attachShadow({ mode: 'open' });
            this.shadowRoot.append(...createElements(this.editor2DArray));

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
                this.parentEditor?.dispatchEvent(
                    new CustomEvent(
                        'childEditorUpdate',
                        { detail: this.getOutput() }
                    )
                );
            })
        }

        focus(fromEl, position, isSelecting) {
            super.focus();

            // TODO: add handling for backspace out of right editor
            const width = this.editor2DArray.length;
            const height = this.editor2DArray[0].length;

            if (fromEl !== undefined && position !== undefined) {

                let x;
                let y;
                let found = false;

                outerLoop:
                for (x = 0; x < this.editor2DArray.length; x++) {
                    for (y = 0; y < this.editor2DArray[x].length; y++) {
                        if (this.editor2DArray[x][y] === fromEl) {
                            found = true;
                            break outerLoop;
                        }
                    }
                }

                this.blur();
                if (found) {
                    if (position === 1) {

                        if (y === height - 1) {
                            y = 0;
                            x++;
                        } else {
                            y++;
                        }
                        if (x === width) {
                            this.parentEditor.focus(this, 1, false);

                        } else {
                            this.editor2DArray[x][y].focus(this, 1, false);
                        }
                    }
                    if (position === 0) {
                        if (y === 0) {
                            y = height - 1;
                            x--;
                        } else {
                            y--;
                        }
                        if (x === -1) {
                            this.parentEditor.focus(this, 0, false);
                        } else {
                            this.editor2DArray[x][y].focus(this, 1, false);
                        }
                    }
                    return;
                }


                if (position === 1) { // case: entering from a parent on the left
                    this.editor2DArray[0][0].focus(this, 1, false);
                }
                if (position === 0) { // case: entering from a parent on the right
                    this.editor2DArray[width - 1][height - 1].focus(this, 0, false);
                }
                return;
            }
            this.editor2DArray[width - 1][height - 1].focus(this, 0, false);
        }

        getOutput() {
            const outputs = '[' + this.editor2DArray.map(
                editor1DArray => '[' + editor1DArray.map(editor => editor.getOutput()).join(',') + ']'
            ).join(',') + ']';
            return `${outputFuncName}(${outputs})`;
        }
    }

    customElements.define(`${outputFuncName}-grid-joiner-editor`, C);
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

export const Vec2JoinerElement = BinaryJoinerElement(
    'vec2',
    (leftEditor, rightEditor) => {
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            :host {
                display: inline-flex;
                vertical-align: middle;
                flex-direction: column;
                align-items: stretch;
                position: relative;
                padding: 2px;
                gap: 2px;
                border-left: 2px solid currentColor;
                border-right: 2px solid currentColor;
            }
            :host::before {
                content: "";
                position: absolute;
                top: 0;
                left: 0;
                height: calc(100% - 4px);
                width: 5px;
                border-top: 2px solid currentColor;
                border-bottom: 2px solid currentColor;
              }
              :host::after {
                content: "";
                position: absolute;
                top: 0;
                right: 0;
                height: calc(100% - 4px);
                width: 5px;
                border-top: 2px solid currentColor;
                border-bottom: 2px solid currentColor;
              }
        `;
        return [styleEl, leftEditor, rightEditor];
    },
);

export const MatrixJoinerElement = GridJoinerElement(
    'matrix',
    (editor2DArray) => {
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            :host {
                display: inline-flex;
                vertical-align: middle;
                flex-direction: column;
                align-items: stretch;
                position: relative;
                padding: 2px;
                gap: 2px;
                border-left: 2px solid currentColor;
                border-right: 2px solid currentColor;
            }
            span {
                display: inline-flex;
                vertical-align: middle;
                flex-direction: row;
                align-items: stretch;
                position: relative;
                padding: 2px;
                gap: 2px;
            }
            :host::before {
                content: "";
                position: absolute;
                top: 0;
                left: 0;
                height: calc(100% - 4px);
                width: 5px;
                border-top: 2px solid currentColor;
                border-bottom: 2px solid currentColor;
              }
              :host::after {
                content: "";
                position: absolute;
                top: 0;
                right: 0;
                height: calc(100% - 4px);
                width: 5px;
                border-top: 2px solid currentColor;
                border-bottom: 2px solid currentColor;
              }
        `;

        return [styleEl, ...editor2DArray.map((cur) => {
            const columnEl = document.createElement('span');
            columnEl.append(...cur);
            return columnEl;
        })];
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
export const MulJoinerElement = BinarySymbolJoinerElement('mul', '·');
export const SubJoinerElement = BinarySymbolJoinerElement('sub', '-');

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
