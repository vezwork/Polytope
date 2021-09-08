import { withIndex } from "./Iterable.js";
import {
    PlusJoinerElement,
    DivJoinerElement,
    ExpJoinerElement,
    RadicalJoinerElement,
    SubJoinerElement,
    MulJoinerElement,
    Vec2JoinerElement
} from "./sub_math_editors.js";
import {
    BidirectionalEditorPair
} from "./bidirectional_editor_pair.js";

export class EditorElement extends HTMLElement {

    parentEditor = undefined;
    isFocused = false;

    constructor({ parentEditor }={}) {
        super();

        this.parentEditor = parentEditor;

        this.attachShadow({mode: 'open'});

        const styleEl = document.createElement('style');
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
                justify-content: center;

                vertical-align: middle;

                user-select: none;
                border-radius: 4px;
                background: var(--editor-background-color);
                border: 2px solid var(--editor-outline-color);
                padding: 2px;
                box-sizing: border-box;
                position: relative;
                font-family: monospace;

                line-height: 1;

                min-height: 1.6rem;
                min-width: 1.5rem;
            }
            :host(:focus)::before {
                content: var(--editor-name);
                font-size: 14px;
                padding: 1px 8px 2px 8px;
                background: var(--editor-color);
                color: var(--editor-name-color);
                position: absolute;
                bottom: -17px;
                left: -2px;
                border-radius: 0 0 4px 4px;
                font-family: monospace;
                z-index: 10;
            }
            :host(:focus) {
                border: 2px solid var(--editor-color);
                color: black !important;
                outline: none;
            }
            :host(:not(:focus)) {
                color: rgba(0,0,0,0.5);
            }
        `;
        this.shadowRoot.append(styleEl);

        if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', 0);

        this.addEventListener('focus', (e) => {
            e.stopPropagation();
            this.isFocused = true;
        });
        this.addEventListener('subEditorClicked', (e) => {
            this.parentEditor?.dispatchEvent(new CustomEvent('subEditorClicked', { detail: [this, ...e.detail] }));
        });
        this.addEventListener('blur', (e) => {
            e.stopPropagation();
            this.isFocused = false;
        });
        this.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.parentEditor?.dispatchEvent(new CustomEvent('subEditorClicked', { detail: [this] }));
            this.focus();
        });
        this.addEventListener('keydown', (e) => e.stopPropagation());
    }

    get javaScriptCode() {
        return '';
    }
}

export class TextEditorElement extends EditorElement {

    code = [];
    caret = 0;
    minorCaret = 0;
    isCaretInSlot = false;

    constructor({ code=[] }={}) {
        super(...arguments);

        this.code = code;
        for (const slotOrChar of code) {
            if (typeof slotOrChar !== 'string') {
                const slot = slotOrChar;
                slot.parentEditor = this;
            }
        }

        this.style.setProperty('--editor-name', `'text'`);
        this.style.setProperty('--editor-color', '#017BFF');
        this.style.setProperty('--editor-name-color', 'white');
        this.style.setProperty('--editor-background-color', '#E6F2FF');
        this.style.setProperty('--editor-outline-color', '#d4e9ff');

        this.styleEl = document.createElement('style');
        this.styleEl.textContent = `
            code {
                white-space: pre;
                width: inherit;
                height: inherit;
                display: inline-block;
            }
            :host(:not(:focus)) code caret {
                display: none;
            }
            caret {
                position: relative;
                display: inline-block;
                height: 1rem;
                width: 0px;
            }
            caret::after {
                content: "";
                height: 1.2rem;
                left: -1px;
                width: 2px;
                position: absolute;
                background: black;
                animation: blinker 1s linear infinite;
            }
            @keyframes blinker {
                0% { opacity: 1; }
                49% { opacity: 1; }
                50% { opacity: 0; }
                100% { opacity: 0; }
            }
        `;
        this.codeEl = document.createElement('code');
        this.shadowRoot.append(this.styleEl, this.codeEl);

        this.addEventListener('subEditorDeleted', (e) => {
            this.code = this.code.filter((slotOrChar) => slotOrChar !== e.detail);
            this.codeEl.innerHTML = '';
            this.codeEl.append(...this.displayHTML());
        });
        this.addEventListener('blur', (e) => {
            this.minorCaret = this.caret;
            this.codeEl.innerHTML = '';
            this.codeEl.append(...this.displayHTML());
        });
        this.addEventListener('mousedown', (e) => {
            const targetEl = e.path[0];
            if (targetEl.getAttribute('i')) {
                let chari = parseInt(targetEl.getAttribute('i'));

                const rect = targetEl.getBoundingClientRect();
                const x = e.clientX - rect.left; //x position within the element.
                if (x >= rect.width/2) {
                    chari = chari + 1;
                }

                this.caret = chari;
                this.minorCaret = this.caret;
            }
            this.codeEl.innerHTML = '';
            this.codeEl.append(...this.displayHTML());
            setTimeout(() => this.focus());
        });
        this.addEventListener('mousemove', (e) => {
            if (this.isFocused) {
                const targetEl = e.path[0];
                if (targetEl.getAttribute('i') && e.buttons === 1) {
                    let chari = parseInt(targetEl.getAttribute('i'));

                    const rect = targetEl.getBoundingClientRect();
                    const x = e.clientX - rect.left; //x position within the element.
                    if (x >= rect.width/2) {
                        chari = chari + 1;
                    }


                    if (chari !== this.caret) {
                        this.caret = chari;

                        this.codeEl.innerHTML = '';
                        this.codeEl.append(...this.displayHTML());
                    }
                }
            }
        });
        document.addEventListener('copy', (e) => {
            if (this.isFocused && this.minorCaret !== this.caret) {
                let start;
                let end;
                let output = '';
                if (this.minorCaret > this.caret) {
                    start = this.caret;
                    end = this.minorCaret;
                } else {
                    end = this.caret;
                    start = this.minorCaret;
                }
                for (let i = start; i < this.code.length && i < end; i++) {
                    const slotOrChar = this.code[i];
                    if (typeof slotOrChar === 'string') {
                        const char = slotOrChar;
                        output += char;
                    } else {
                        const slot = slotOrChar;
                        output += slot.getOutput();
                    }
                }

                e.clipboardData.setData('text/plain', output);
                e.preventDefault();
                console.log('copied!', output)
            }
        });
        document.addEventListener('paste', (e) => {
            let paste = (e.clipboardData || window.clipboardData).getData('text');
            console.log(paste);
            if (paste && document.activeElement === this) {
                this.insertText(paste);
                const focuser = this.moveCaret(paste.length);
                this.codeEl.innerHTML = '';
                this.codeEl.append(...this.displayHTML());
            }
        });
        this.addEventListener('keydown', (e) => {
            if (e.key === "Control") {
                // TODO: modifier is down
                return;
            }
            if (!this.isCaretInSlot) {
                if (this.keyHandler) {
                    const isHandled = this.keyHandler(e);
                    if (isHandled) return;
                }
            }
            if (this.isCaretInSlot) {

            }
            else if (e.key === "Backspace") {
                if (this.parentEditor && this.code.length === 0) {
                    this.parentEditor.dispatchEvent(new CustomEvent('subEditorDeleted', { detail: this }));
                }
                this.backspace();
                this.moveCaret(-1);
                this.codeEl.innerHTML = '';
                this.codeEl.append(...this.displayHTML());

                this.parentEditor?.dispatchEvent(
                    new CustomEvent(
                        'childEditorUpdate',
                        { detail: {
                            out: this.getOutput(),
                            editor: this,
                        }}
                    )
                );
            } else if (e.key === "Enter") {
                this.insertText("\n");
                const focuser = this.moveCaret(1);
                this.codeEl.innerHTML = '';
                this.codeEl.append(...this.displayHTML());
                //note: shouldn't happen in practice
                if (focuser) {
                   this.blur();
                   focuser.focus();
                   this.isCaretInSlot = true;
                }
            } else if (e.key === "Meta") {

            }  else if (e.key === "CapsLock") {
                //this.code.splice(this.caret, 0, new GraphEditorElement({ parentEditor: this }));
                //this.code.splice(this.caret, 0, new BidirectionalEditorPair({ parentEditor: this }));
                const focuser = this.moveCaret(1);
                this.codeEl.innerHTML = '';
                this.codeEl.append(...this.displayHTML());
                if (focuser) {
                    this.blur();
                    focuser.focus(this, 1, e.shiftKey);
                    this.isCaretInSlot = true;
                }

            } else if (e.key === "Shift") {

            } else if (e.key === "Alt") {
                this.code.splice(this.caret, 0, new MathEditorElement({ parentEditor: this }));
                const focuser = this.moveCaret(1);
                this.codeEl.innerHTML = '';
                this.codeEl.append(...this.displayHTML());
                if (focuser) {
                    this.blur();
                    focuser.focus(this, 1, e.shiftKey);
                    this.isCaretInSlot = true;
                }
            } else if (e.key === "Control") {
               

            } else if (e.key === "Tab") {
                this.insertText("\t");
                const focuser = this.moveCaret(1);
                this.codeEl.innerHTML = '';
                this.codeEl.append(...this.displayHTML());
                e.preventDefault();

            } else if (e.key === 'ArrowLeft') {
                const focuser = this.moveCaret(-1, e.shiftKey);
                this.codeEl.innerHTML = '';
                this.codeEl.append(...this.displayHTML());
                if (focuser) {
                    this.blur();
                    focuser.focus(this, 0, e.shiftKey);
                    this.isCaretInSlot = true;
                }
            } else if (e.key === 'ArrowRight') {
                const focuser =  this.moveCaret(1, e.shiftKey);
                this.codeEl.innerHTML = '';
                this.codeEl.append(...this.displayHTML());
                if (focuser) {
                    this.blur();
                    focuser.focus(this, 1, e.shiftKey);
                    this.isCaretInSlot = true;
                }
            } else if (e.key === 'ArrowUp') {
                this.moveCaretUp(e.shiftKey);
                this.codeEl.innerHTML = '';
                this.codeEl.append(...this.displayHTML());
            } else if (e.key === 'ArrowDown') {
                this.moveCaretDown(e.shiftKey);
                this.codeEl.innerHTML = '';
                this.codeEl.append(...this.displayHTML());
            } else {
                if (e.ctrlKey || e.metaKey) return;
                e.preventDefault();
                this.insertText(e.key);
                this.moveCaret(1);
                this.codeEl.innerHTML = '';
                this.codeEl.append(...this.displayHTML());
                // note: shouldn't happen in practice
                //if (focuser) {
                //    this.blur();
                //    focuser.focus();
                //}
                this.parentEditor?.dispatchEvent(
                    new CustomEvent(
                        'childEditorUpdate',
                        { detail: {
                            out: this.getOutput(),
                            editor: this,
                        }}
                    )
                );
            }
        });
        this.codeEl.innerHTML = '';
        this.codeEl.append(...this.displayHTML());
        this.addEventListener('childEditorUpdate', (e) => {
            this.parentEditor?.dispatchEvent(
                new CustomEvent(
                    'childEditorUpdate',
                    { detail: {
                        out: this.getOutput(),
                        editor: this,
                    }}
                )
            );
        })
    }

    connectedCallback() {
    }

    insertText(text) {
        const insert = text.split('');
        this.code.splice(this.caret, 0, ...insert);
    }

    insertSlot() {
        this.code.splice(this.caret, 0, new TextEditorElement({ parentEditor: this }));
    }

    backspace() {
        this.code.splice(this.caret-1, 1);
    }

    moveCaret(change, isSelecting) {
        if (this.caret + change > this.code.length || this.caret + change < 0) {
            if (this.parentEditor) {
                if (!isSelecting) {
                    return this.parentEditor;
                }
            }
            return;
        }

        const newCaret = this.caret + change;

        if (isSelecting) {
            this.caret = newCaret;
        } else {
            if (change < 0 && this.code[newCaret] && typeof this.code[newCaret] !== 'string') {
                this.caret = newCaret;
                this.minorCaret = this.caret;
                return this.code[newCaret];
            } else if (change > 0 && this.code[newCaret-1] && typeof this.code[newCaret-1] !== 'string') {
                this.caret = newCaret-1;
                this.minorCaret = this.caret;
                return this.code[newCaret-1];
            } else {
                this.caret = newCaret;
                this.minorCaret = this.caret;
            }
        }
    }

    lineIndicesFromCodeIndex(index) {
        let start = 0;
        let end = this.code.length;
        for (let i = index-1; i >= 0; i--) {
            const slotOrChar = this.code[i];
            if (typeof slotOrChar === 'string') {
                const char = slotOrChar;

                if (char === '\n') {
                    start = i+1;
                    break;
                }
            }
        }
        for (let i = index; i <= this.code.length; i++) {
            const slotOrChar = this.code[i];
            if (typeof slotOrChar === 'string') {
                const char = slotOrChar;

                if (char === '\n') {
                    end = i;
                    break;
                }
            }
        }
        return [start, end];
    }

    moveCaretUp(isSelecting) {
        const [lineStart, lineEnd] = this.lineIndicesFromCodeIndex(this.caret);
        if (lineStart === 0) {
            this.caret = 0;
            if (!isSelecting) this.minorCaret = this.caret;
            return;
        }
        const caretOffsetLineStart = this.caret - lineStart;
        const [prevLineStart, prevLineEnd] = this.lineIndicesFromCodeIndex(lineStart-1);
        this.caret = Math.min(prevLineStart + caretOffsetLineStart, prevLineEnd);
        if (!isSelecting) this.minorCaret = this.caret;
    }

    moveCaretDown(isSelecting) {
        const [lineStart, lineEnd] = this.lineIndicesFromCodeIndex(this.caret);
        if (lineEnd === this.code.length) {
            this.caret = this.code.length;
            if (!isSelecting) this.minorCaret = this.caret;
            return;
        }
        const caretOffsetLineStart = this.caret - lineStart;
        const [nextLineStart, nextLineEnd] = this.lineIndicesFromCodeIndex(lineEnd+1);
        this.caret = Math.min(nextLineStart + caretOffsetLineStart, nextLineEnd);
        if (!isSelecting) this.minorCaret = this.caret;
    }

    displayHTML() {
        let results = [];

        for (const [slotOrChar, i] of withIndex(this.code)) {
            if (i === this.caret) {
                results.push(document.createElement('caret'));
            }
            if (typeof slotOrChar === 'string') {
                const char = slotOrChar;
                const charEl = document.createElement('span');
                charEl.textContent = char;
                charEl.setAttribute('i', i);
                if ((i < this.caret && i >= this.minorCaret) || (i >= this.caret && i < this.minorCaret)) {
                    charEl.style.background = 'black';
                    charEl.style.color = 'white';
                }
                results.push(charEl);

            } else {
                const slot = slotOrChar;
                results.push(slot);
            }
        }
        if (this.caret === this.code.length) {
            results.push(document.createElement('caret'));
        }

        return results;
    }

    getOutput() {
        let output = '';

        for (const [slotOrChar, i] of withIndex(this.code)) {
            if (typeof slotOrChar === 'string') {
                const char = slotOrChar;
                output += char;
            } else {
                const slot = slotOrChar;
                output += slot.getOutput();
            }
        }

        return output;
    }

    focus(fromEl, position, isSelecting) {
        super.focus();

        this.isCaretInSlot = false;

        if (fromEl !== undefined && position !== undefined) {
            for (const [slotOrChar, i] of withIndex(this.code)) {
                if (slotOrChar === fromEl) { // case: exiting from slot
                    this.caret = i + position;
                    if (!isSelecting) this.minorCaret = this.caret;
                    this.codeEl.innerHTML = '';
                    this.codeEl.append(...this.displayHTML());
                    return;
                }
            }
            if (position === 1) { // case: entering from a parent on the left
                this.caret = 0;
                this.minorCaret = this.caret;
            }
            if (position === 0) { // case: entering from a parent on the right
                this.caret = this.code.length;
                this.minorCaret = this.caret;
            }
            this.codeEl.innerHTML = '';
            this.codeEl.append(...this.displayHTML());
        }
    }

    blur() {
        super.blur();

        this.minorCaret = this.caret;

        this.codeEl.innerHTML = '';
        this.codeEl.append(...this.displayHTML());
    }
}

export class MathEditorElement extends TextEditorElement {

    constructor() {
        super(...arguments);

        this.style.setProperty('--editor-name', `'math'`);
        this.style.setProperty('--editor-color', '#FFD600');
        this.style.setProperty('--editor-name-color', 'black');
        this.style.setProperty('--editor-background-color', '#fff7cf');
        this.style.setProperty('--editor-outline-color', '#fff1a8');
    }

    keyHandler(e) {
        if (e.key === 'Alt') {
            return true;
        }
        else if (e.key === '/') {
            // elevate left and right (non commutative)
            const pre = this.code.slice(0, this.caret);
            const post = this.code.slice(this.caret, this.code.length);
            const focuser = new DivJoinerElement({ parentEditor: this, leftCode: pre, rightCode: post });
            this.code = [focuser];
            this.codeEl.innerHTML = '';
            this.codeEl.append(...this.displayHTML());
            this.blur();
            focuser.focus();

            this.parentEditor?.dispatchEvent(
                new CustomEvent(
                    'childEditorUpdate',
                    { detail: {
                        out: this.getOutput(),
                        editor: this,
                    }}
                )
            );

            return true;
        } else if (e.key === '+') {
            // elevate left and right
            const pre = this.code.slice(0, this.caret);
            const post = this.code.slice(this.caret, this.code.length);
            const focuser = new PlusJoinerElement({ parentEditor: this, leftCode: pre, rightCode: post });
            this.code = [focuser];
            this.codeEl.innerHTML = '';
            this.codeEl.append(...this.displayHTML());
            this.blur();
            focuser.focus();

            this.parentEditor?.dispatchEvent(
                new CustomEvent(
                    'childEditorUpdate',
                    { detail: {
                        out: this.getOutput(),
                        editor: this,
                    }}
                )
            );

            return true;
        } else if (e.key === '*') {
            // elevate left and right
            const pre = this.code.slice(0, this.caret);
            const post = this.code.slice(this.caret, this.code.length);
            const focuser = new MulJoinerElement({ parentEditor: this, leftCode: pre, rightCode: post });
            this.code = [focuser];
            this.codeEl.innerHTML = '';
            this.codeEl.append(...this.displayHTML());
            this.blur();
            focuser.focus();

            this.parentEditor?.dispatchEvent(
                new CustomEvent(
                    'childEditorUpdate',
                    { detail: {
                        out: this.getOutput(),
                        editor: this,
                    }}
                )
            );

            return true;
        } else if (e.key === '-') {
            // elevate left and right
            const pre = this.code.slice(0, this.caret);
            const post = this.code.slice(this.caret, this.code.length);
            const focuser = new SubJoinerElement({ parentEditor: this, leftCode: pre, rightCode: post });
            this.code = [focuser];
            this.codeEl.innerHTML = '';
            this.codeEl.append(...this.displayHTML());
            this.blur();
            focuser.focus();

            this.parentEditor?.dispatchEvent(
                new CustomEvent(
                    'childEditorUpdate',
                    { detail: {
                        out: this.getOutput(),
                        editor: this,
                    }}
                )
            );

            return true;
        } else if (e.key === '^') {
            // elevate left and right (non commutative)
            const pre = this.code.slice(0, this.caret);
            const post = this.code.slice(this.caret, this.code.length);
            const focuser = new ExpJoinerElement({ parentEditor: this, leftCode: pre, rightCode: post });
            this.code = [focuser];
            this.codeEl.innerHTML = '';
            this.codeEl.append(...this.displayHTML());
            this.blur();
            focuser.focus();

            this.parentEditor?.dispatchEvent(
                new CustomEvent(
                    'childEditorUpdate',
                    { detail: {
                        out: this.getOutput(),
                        editor: this,
                    }}
                )
            );

            return true;
        } else if (e.key === '√') {
            // elevate right
            this.code.splice(this.caret, 0, new RadicalJoinerElement({ parentEditor: this }));
            const focuser = this.moveCaret(1);
            this.codeEl.innerHTML = '';
            this.codeEl.append(...this.displayHTML());
            if (focuser) {
                this.blur();
                focuser.focus(this, 1, e.shiftKey);
            }

            this.parentEditor?.dispatchEvent(
                new CustomEvent(
                    'childEditorUpdate',
                    { detail: {
                        out: this.getOutput(),
                        editor: this,
                    }}
                )
            );

            return true;
        } else if (e.key === '[') {
            const pre = this.code.slice(0, this.caret);
            const post = this.code.slice(this.caret, this.code.length);
            const focuser = new Vec2JoinerElement({ parentEditor: this, leftCode: post, rightCode: [] });
            this.code = [...pre, focuser];
            this.codeEl.innerHTML = '';
            this.codeEl.append(...this.displayHTML());
            this.blur();
            focuser.focus();

            this.parentEditor?.dispatchEvent(
                new CustomEvent(
                    'childEditorUpdate',
                    { detail: {
                        out: this.getOutput(),
                        editor: this,
                    }}
                )
            );

            return true;
        }
        return false;
    }
}

export class GraphEditorElement extends EditorElement {

    nodes = [];

    constructor() {
        super(...arguments);
        this.style.setProperty('--editor-name', `'graph'`);
        this.style.setProperty('--editor-color', '#7300CF');
        this.style.setProperty('--editor-name-color', 'white');
        this.style.setProperty('--editor-background-color', '#eed9ff');
        this.style.setProperty('--editor-outline-color', '#b59dc9');

        this.styleEl = document.createElement('style');
        this.styleEl.textContent = `
            :host {
                position: relative;
                height: 250px;
                width: 250px;
            }

            canvas {
                position: absolute;
                top: 0;
                left: 0;
            }
        `;
        this.canvas = document.createElement('canvas');
        this.canvas.width = 250;
        this.canvas.height = 250;
        this.context = this.canvas.getContext('2d');
        this.shadowRoot.append(this.styleEl, this.canvas);

        this.fromNode = null;
        this.mouse = [0, 0];

        this.addEventListener('keydown', (e) => {
            if (e.key === "Backspace" && this.parentEditor) {
                this.parentEditor.dispatchEvent(new CustomEvent('subEditorDeleted', { detail: this }));
                this.blur();
                this.parentEditor.focus();
            } else if (e.key === 'ArrowLeft' && this.parentEditor) {
                this.blur();
                this.parentEditor.focus(this, 0, e.shiftKey);
            } else if (e.key === 'ArrowRight' && this.parentEditor) {
                this.blur();
                this.parentEditor.focus(this, 1, e.shiftKey);
            }
        });
        this.addEventListener('subEditorDeleted', (e) => {
            this.nodes = this.nodes.filter(({ editor }) => editor !== e.detail);
            this.shadowRoot.removeChild(e.detail);
            this.render();
        });
        this.addEventListener('subEditorClicked', (e) => {
            const subFocus = this.nodes.find(({ editor }) => editor === e.detail[0]);
            if (subFocus) {
                this.fromNode = subFocus; // HACK
            }
        });
        this.addEventListener('mousemove', (e) => {
            this.mouse = [e.offsetX, e.offsetY];
            if (this.fromNode && e.metaKey) {
                this.fromNode.x = Math.max(0, Math.min(this.mouse[0] - 10, this.offsetWidth - this.fromNode.editor.offsetWidth - 2));
                this.fromNode.y = Math.max(0, Math.min(this.mouse[1] - 10, this.offsetHeight  - this.fromNode.editor.offsetHeight - 2));
            }
            this.render();
        })
        this.addEventListener('mousedown', (e) => {
            const editor = new TextEditorElement({ parentEditor: this });
            editor.style.position = 'absolute';
            const node = { x: e.offsetX - 10, y: e.offsetY - 10, editor, adjacent: [] };
            this.nodes.push(node);
            this.shadowRoot.append(editor);
            this.blur();
            setTimeout(() => editor.focus());
            this.fromNode = node;
            this.render();
        });
        this.addEventListener('mouseup', (e) => {
                const targetEl = e.path[0];
                const targetNode = this.nodes.find(
                    ({ editor }) => editor.contains(targetEl) || editor.shadowRoot.contains(targetEl)
                );
                if (targetNode) {
                    if (this.fromNode && this.fromNode !== targetNode && !this.fromNode.adjacent.includes(targetNode)) {
                        this.fromNode.adjacent.push(targetNode);
                    }
                }
                this.fromNode = null;
                this.render();
        });
    }

    render() {
        this.context.strokeStyle = '#7300CF';
        this.context.fillStyle = '#7300CF';
        this.context.lineWidth = 2;
        this.context.lineCap = 'round';
        this.context.clearRect(0,0, this.canvas.width, this.canvas.height);
        if (this.fromNode) {
            this.context.beginPath();
            this.context.moveTo(
                this.fromNode.x+this.fromNode.editor.offsetWidth/2,
                this.fromNode.y+this.fromNode.editor.offsetHeight/2
            );
            this.context.lineTo(...this.mouse);
            this.context.stroke();
        }
        for (const { x, y, editor, adjacent } of this.nodes) {
            editor.style.top = `${y}px`;
            editor.style.left = `${x}px`;
            for (const otherNode of adjacent) {
                this.context.beginPath();
                const start = [x+editor.offsetWidth/2, y+editor.offsetHeight/2];
                const end = [otherNode.x+otherNode.editor.offsetWidth/2, otherNode.y+otherNode.editor.offsetHeight/2];
                this.context.moveTo(...start);
                this.context.lineTo(...end);
                this.context.stroke();

                const angle = Math.atan2(end[0]-start[0], end[1]-start[1]);
                const dir = [Math.sin(angle), Math.cos(angle)];
                const dist = Math.min(
                    otherNode.editor.offsetHeight * Math.abs(1/Math.cos(angle)),
                    otherNode.editor.offsetWidth * Math.abs(1/Math.sin(angle))
                ) / 2; // https://math.stackexchange.com/a/924290/421433
                this.context.beginPath();
                this.context.moveTo(end[0] - dir[0]*dist, end[1] - dir[1]*dist);
                this.context.lineTo(end[0] - dir[0]*(dist+11) + dir[1]*7, end[1] - dir[1]*(dist+11) - dir[0]*7);
                this.context.stroke();
                this.context.moveTo(end[0] - dir[0]*dist, end[1] - dir[1]*dist);
                this.context.lineTo(end[0] - dir[0]*(dist+11) - dir[1]*7, end[1] - dir[1]*(dist+11) + dir[0]*7);
                this.context.stroke();
            }
        }
    }

    getOutput() {
        let nodes = [];
        let positions = [];
        let edges = [];

        for (const [{ editor, x, y, adjacent }, i] of withIndex(this.nodes)) {
            nodes[i] = editor.getOutput();
            positions[i] = [x, y];

            edges[i] = [];
            for (const otherNode of adjacent) {
                const otherNodeIndex = this.nodes.findIndex((n) => n ===otherNode);
                edges[i].push(otherNodeIndex);
            }
        }

        return (
`{
    nodes: [${nodes}],
    edges: [${edges.map((edgeList) => `[${edgeList}]`)}],
    positions: [${positions.map(([x,y]) => `[${x}, ${y}]`)}]
}`
        );
    }
}

customElements.define('text-editor', TextEditorElement);
customElements.define('math-editor', MathEditorElement);
customElements.define('graph-editor', GraphEditorElement);
customElements.define('polytope-editor', EditorElement);
