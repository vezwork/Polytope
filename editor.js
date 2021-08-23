import { withIndex } from "./Iterable.js";
import { PlusJoinerElement, DivJoinerElement, ExpJoinerElement, RadicalJoinerElement } from "./sub_math_editors.js";

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

                user-select: none;
                border-radius: 4px;
                background: var(--editor-background-color);
                border: 2px solid var(--editor-outline-color);
                padding: 2px;
                box-sizing: border-box;
                position: relative;
                font-family: monospace;

                min-height: 1.5rem;
                min-width: 1.5rem;
            }
            :host(:focus)::after {
                content: var(--editor-name);
                font-size: 14px;
                padding: 1px 8px 2px 8px;
                background: var(--editor-color);
                color: var(--editor-name-color);
                position: absolute;
                bottom: -19px;
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
                color: black;
            }
        `;
        this.shadowRoot.append(styleEl);

        if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', 0);

        this.addEventListener('focus', (e) => {
            e.stopPropagation();
            this.isFocused = true;
        });
        this.addEventListener('blur', (e) => {
            e.stopPropagation();
            this.isFocused = false;
        });
        this.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.focus();
        });
        // this.addEventListener('mousemove', (e) => e.stopPropagation());
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
            if (this.isCaretInSlot) {

            }
            else if (e.key === "Backspace") {
                // note: backspace in an empty editor should exit the editor and delete it
                this.backspace();
                const focuser = this.moveCaret(-1);
                this.codeEl.innerHTML = '';
                this.codeEl.append(...this.displayHTML());
                if (focuser) {
                    this.blur();
                    focuser.focus(this, 0, e.shiftKey);
                }
            } else if (e.key === "Enter") {
                this.insertText("\n");
                const focuser = this.moveCaret(1);
                this.codeEl.innerHTML = '';
                this.codeEl.append(...this.displayHTML());
                //note: shouldn't happen in practice
                if (focuser) {
                   this.blur();
                   focuser.focus();
                }
            } else if (e.key === "Meta") {

            }  else if (e.key === "CapsLock") {

            } else if (e.key === "Shift") {

            } else if (e.key === "Alt") {
                this.code.splice(this.caret, 0, new MathEditorElement({ parentEditor: this }));
                const focuser = this.moveCaret(1);
                this.codeEl.innerHTML = '';
                this.codeEl.append(...this.displayHTML());
                if (focuser) {
                    this.blur();
                    focuser.focus(this, 1, e.shiftKey);
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
                }
            } else if (e.key === 'ArrowRight') {
                const focuser =  this.moveCaret(1, e.shiftKey);
                this.codeEl.innerHTML = '';
                this.codeEl.append(...this.displayHTML());
                if (focuser) {
                    this.blur();
                    focuser.focus(this, 1, e.shiftKey);
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
                if (this.keyHandler) {
                    const isHandled = this.keyHandler(e);
                    if (isHandled) return;
                }

                if (e.ctrlKey || e.metaKey) return;
                this.insertText(e.key);
                const focuser = this.moveCaret(1);
                this.codeEl.innerHTML = '';
                this.codeEl.append(...this.displayHTML());
                // note: shouldn't happen in practice
                //if (focuser) {
                //    this.blur();
                //    focuser.focus();
                //}
            }
        });
        this.codeEl.innerHTML = '';
        this.codeEl.append(...this.displayHTML());
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
                this.isCaretInSlot = true;
                return this.code[newCaret];
            } else if (change > 0 && this.code[newCaret-1] && typeof this.code[newCaret-1] !== 'string') {
                this.caret = newCaret-1;
                this.minorCaret = this.caret;
                this.isCaretInSlot = true;
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
        if (e.key === '/') {
            // elevate left and right (non commutative)
            const pre = this.code.slice(0, this.caret);
            const post = this.code.slice(this.caret, this.code.length);
            const focuser = new DivJoinerElement({ parentEditor: this, leftCode: pre, rightCode: post });
            this.code = [focuser];
            this.codeEl.innerHTML = '';
            this.codeEl.append(...this.displayHTML());
            this.blur();
            focuser.focus();
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
            return true;
        }
        return false;
    }
}
customElements.define('text-editor', TextEditorElement);
customElements.define('math-editor', MathEditorElement);
customElements.define('polytope-editor', EditorElement);
