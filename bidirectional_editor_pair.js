export const BidirectionalEditorPair = ({
    leftEditorFactory,
    rightEditorFactory,
    name = 'no-name' } = {}) => {
    class C extends HTMLElement {
        parentEditor = undefined;
        constructor({ parentEditor } = {}) {
            super();
            //if (!parentEditor) throw `No parent editor on binary ${outputFuncName} joiner element`;
            this.parentEditor = parentEditor;

            this.leftEditor = leftEditorFactory('', this);
            this.rightEditor = rightEditorFactory('', this);
            this.leftEditor.style.width = 400;
            this.rightEditor.style.width = 400;
            this.leftEditor.style.height = 400;
            this.rightEditor.style.height = 400;

            this.attachShadow({ mode: 'open' });
            const midEl = document.createElement('span');
            midEl.textContent = '⇄';
            this.shadowRoot.append(this.leftEditor, midEl, this.rightEditor);

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
                if (editor === this.leftEditor) {
                    const newRightEditor = rightEditorFactory(out, this);
                    this.shadowRoot.replaceChild(newRightEditor, this.rightEditor);
                    this.rightEditor = newRightEditor;
                }
                if (editor === this.rightEditor) {
                    const newLeftEditor = leftEditorFactory(out, this);
                    this.shadowRoot.replaceChild(newLeftEditor, this.leftEditor);
                    this.leftEditor = newLeftEditor;

                }
                this.leftEditor.style.width = 400;
                this.rightEditor.style.width = 400;
                this.leftEditor.style.height = 400;
                this.rightEditor.style.height = 400;
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

    customElements.define(`bidirectional-${name}-editor-pair`, C);
    return C;
}

export const UnidirectionalEditorPair = ({
    leftEditorFactory,
    leftEditorOutput,
    transformer = (arg) => arg,
    rightEditorFactory,
    name = 'no-name' } = {}) => {
    class C extends HTMLElement {
        parentEditor = undefined;
        constructor({ parentEditor } = {}) {
            super();
            //if (!parentEditor) throw `No parent editor on binary ${outputFuncName} joiner element`;
            this.parentEditor = parentEditor;

            this.leftEditor = leftEditorFactory('', this);
            this.rightEditor = rightEditorFactory('', this);
            this.leftEditor.style.width = 400;
            this.rightEditor.style.width = 400;
            this.leftEditor.style.height = 400;
            this.rightEditor.style.height = 400;

            this.attachShadow({ mode: 'open' });
            const midEl = document.createElement('span');
            midEl.textContent = '→';
            this.shadowRoot.append(this.leftEditor, midEl, this.rightEditor);

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
                const { editor } = e.detail;
                if (editor === this.leftEditor) {
                    const out = leftEditorOutput(editor);
                    const newRightEditor = rightEditorFactory(transformer(out), this);
                    this.shadowRoot.replaceChild(newRightEditor, this.rightEditor);
                    this.rightEditor = newRightEditor;
                }
                this.leftEditor.style.width = 400;
                this.rightEditor.style.width = 400;
                this.leftEditor.style.height = 400;
                this.rightEditor.style.height = 400;
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

    customElements.define(`unidirectional-${name}-editor-pair`, C);
    return C;
}

export const ConstructiveUnidirectionalEditor = ({
    leftEditorFactory,
    leftEditorOutput,
    name = 'no-name' } = {}) => {
    class C extends HTMLElement {
        parentEditor = undefined;
        constructor({ parentEditor, leftCode } = {}) {
            super();
            //if (!parentEditor) throw `No parent editor on binary ${outputFuncName} joiner element`;
            this.parentEditor = parentEditor;

            this.leftEditor = leftEditorFactory(leftCode, this);
            this.rightEditor = document.createElement('span');

            this.attachShadow({ mode: 'open' });
            const midEl = document.createElement('span');
            midEl.textContent = '→eval→';
            this.shadowRoot.append(this.leftEditor, midEl, this.rightEditor);

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
            const onUpdate = async () => {
                const out = leftEditorOutput(this.leftEditor);
                try {
                    const rightEditor = await eval(`(async () => { ${out} })()`); // EVAL IS VERY BAD! IT DOES NOT PRESERVE INTERIOR EDITORS
                    rightEditor.parentEditor = this;
                    this.shadowRoot.replaceChild(rightEditor, this.rightEditor);
                    this.rightEditor = rightEditor;
                } catch (e) { }
            };
            onUpdate();
            this.addEventListener('childEditorUpdate', onUpdate)
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

    customElements.define(`constructive-unidirectional-${name}-editor-pair`, C);
    return C;
}
