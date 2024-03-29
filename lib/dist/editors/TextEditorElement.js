import { withIndex } from "../Iterable.js";
import { EditorElement } from "../editor.js";
export class TextEditorElement extends EditorElement {
    meta = {
        editorName: "Text",
    };
    code;
    caret = 0;
    minorCaret = 0;
    isCaretInSlot = false;
    styleEl;
    codeEl;
    keyHandler(e) {
        return null;
    }
    constructor({ code } = {}) {
        super(...arguments);
        this.code = code || [];
        for (const slotOrChar of this.code) {
            if (typeof slotOrChar !== "string") {
                const slot = slotOrChar;
                slot.parentEditor = this;
            }
        }
        this.style.setProperty("--editor-name", `'text'`);
        this.style.setProperty("--editor-color", "#017BFF");
        this.style.setProperty("--editor-name-color", "white");
        this.style.setProperty("--editor-background-color", "#E6F2FF");
        this.style.setProperty("--editor-outline-color", "#d4e9ff");
        this.styleEl = document.createElement("style");
        this.styleEl.textContent = `
            code {
                white-space: pre;
                width: inherit;
                height: inherit;
                display: inline-block;
            }
            :host(:not(:focus-visible)) code caret {
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
        this.codeEl = document.createElement("code");
        this.shadowRoot.append(this.styleEl, this.codeEl);
        this.addEventListener("subEditorDeleted", (e) => {
            this.focusEditor(e.detail, 1);
            setTimeout(() => {
                this.code = this.code.filter((slotOrChar) => slotOrChar !== e.detail);
                this.render();
            });
        });
        this.addEventListener("subEditorReplaced", (e) => {
            const index = this.code.indexOf(e.detail.old);
            this.code.splice(index, 1, e.detail.new);
            this.render();
            setTimeout(() => {
                e.detail.new.focusEditor();
            });
        });
        this.addEventListener("blur", (e) => {
            this.minorCaret = this.caret;
            this.render();
        });
        this.addEventListener("mousedown", (e) => {
            if (e.buttons === 1) {
                const pos = this.cursorPosFromMouseEvent(e);
                if (pos !== -1) {
                    this.caret = pos;
                    this.minorCaret = pos;
                    this.render();
                    setTimeout(() => this.focusEditor());
                }
                //
            }
        });
        this.addEventListener("mousemove", (e) => {
            if (this.isFocused) {
                if (e.buttons === 1) {
                    const pos = this.cursorPosFromMouseEvent(e);
                    if (pos !== -1) {
                        this.caret = pos;
                        this.render();
                    }
                }
            }
        });
        const copy = (e) => {
            if (this.isFocused && this.minorCaret !== this.caret) {
                const output = this.getHighlighted();
                e.clipboardData.setData("text/plain", output);
                e.preventDefault();
                console.log("copied!", output);
                if (e.type === "cut") {
                    this.backspace();
                    this.render();
                    this.parentEditor?.dispatchEvent(new CustomEvent("childEditorUpdate", {
                        detail: {
                            out: this.getOutput(),
                            editor: this,
                        },
                    }));
                }
            }
        };
        document.addEventListener("copy", copy);
        document.addEventListener("cut", copy);
        document.addEventListener("paste", (e) => {
            let paste = e.clipboardData.getData("text");
            if (paste && this.isFocused) {
                if (this.builder) {
                    const unwrappedOut = this.builder(paste).output.map((thing) => {
                        if (typeof thing !== "string")
                            thing.parentEditor = this;
                        return thing;
                    });
                    this.insert(unwrappedOut);
                    this.moveCaret(unwrappedOut.length);
                }
                else {
                    this.insert(paste.split(""));
                    this.moveCaret(paste.length);
                }
                this.render();
            }
        });
        this.addEventListener("keydown", (e) => {
            if (e.key === "Control") {
                // TODO: modifier is down
                return;
            }
            if (e.composedPath().includes(this)) {
                if (this.keyHandler) {
                    const maybeFocuser = this.keyHandler(e);
                    if (maybeFocuser) {
                        this.render();
                        this.blur();
                        maybeFocuser.focusEditor();
                        this.parentEditor?.dispatchEvent(new CustomEvent("childEditorUpdate", {
                            detail: {
                                out: this.getOutput(),
                                editor: this,
                            },
                        }));
                        return;
                    }
                }
            }
            if (!e.composedPath().includes(this)) {
            }
            else if (e.key === "Backspace") {
                if (this.parentEditor && this.code.length === 0) {
                    this.parentEditor.dispatchEvent(new CustomEvent("subEditorDeleted", { detail: this }));
                }
                this.backspace();
                this.render();
                this.parentEditor?.dispatchEvent(new CustomEvent("childEditorUpdate", {
                    detail: {
                        out: this.getOutput(),
                        editor: this,
                    },
                }));
            }
            else if (e.key === "Enter") {
                this.insert(["\n"]);
                const focuser = this.moveCaret(1);
                this.render();
                //note: shouldn't happen in practice
                if (focuser) {
                    throw "unexpected codepath TextEditorElement Enter";
                    // this.blur();
                    // focuser.focus();
                    // this.isCaretInSlot = true;
                }
                this.parentEditor?.dispatchEvent(new CustomEvent("childEditorUpdate", {
                    detail: {
                        out: this.getOutput(),
                        editor: this,
                    },
                }));
            }
            else if (e.key === "Alt") {
            }
            else if (e.key === "Meta") {
            }
            else if (e.key === "CapsLock") {
            }
            else if (e.key === "Shift") {
            }
            else if (e.key === "Control") {
            }
            else if (e.key === "Tab") {
                this.insert("  ".split(""));
                const focuser = this.moveCaret(2);
                this.render();
                e.preventDefault();
            }
            else if (e.key === "ArrowLeft") {
                const focuser = this.moveCaret(-1, e.shiftKey);
                this.render();
                if (focuser) {
                    this.blur();
                    focuser.focusEditor(this, 0, e.shiftKey);
                    this.isCaretInSlot = true;
                }
            }
            else if (e.key === "ArrowRight") {
                const focuser = this.moveCaret(1, e.shiftKey);
                this.render();
                if (focuser) {
                    this.blur();
                    focuser.focusEditor(this, 1, e.shiftKey);
                    this.isCaretInSlot = true;
                }
            }
            else if (e.key === "ArrowUp") {
                e.preventDefault();
                this.moveCaretUp(e.shiftKey);
                this.render();
            }
            else if (e.key === "ArrowDown") {
                e.preventDefault();
                this.moveCaretDown(e.shiftKey);
                this.render();
            }
            else {
                if (e.ctrlKey || e.metaKey)
                    return;
                e.preventDefault();
                this.insert(e.key.split(""));
                this.moveCaret(1);
                this.render();
                // note: shouldn't happen in practice
                //if (focuser) {
                //    this.blur();
                //    focuser.focus();
                //}
                this.parentEditor?.dispatchEvent(new CustomEvent("childEditorUpdate", {
                    detail: {
                        out: this.getOutput(),
                        editor: this,
                    },
                }));
            }
        });
        this.render();
        this.addEventListener("childEditorUpdate", (e) => {
            this.parentEditor?.dispatchEvent(new CustomEvent("childEditorUpdate", {
                detail: {
                    out: this.getOutput(),
                    editor: this,
                },
            }));
        });
    }
    cursorPosFromMouseEvent(e) {
        const cand = Array.from(this.codeEl.children)
            .map((childEl) => ({
            el: childEl,
            rect: childEl.getBoundingClientRect(),
        }))
            .filter(({ el, rect }) => {
            return e.clientY > rect.top && e.clientY < rect.bottom;
        })
            .sort((childA, childB) => Math.abs(e.clientX - childA.rect.right) -
            Math.abs(Math.abs(e.clientX - childB.rect.right)))[0];
        const tryAttribute = cand?.el.getAttribute("i") ??
            cand?.el.parentElement.getAttribute("i") ??
            cand?.el.parentElement.parentElement.getAttribute("i");
        if (tryAttribute) {
            let chari = parseInt(tryAttribute);
            const x = e.clientX - cand.rect.left; //x position within the element.
            if (x >= cand.rect.width / 2) {
                chari = chari + 1;
            }
            return chari;
        }
        return this.code.length - 1;
    }
    getHighlighted() {
        if (this.isFocused && this.minorCaret !== this.caret) {
            let start;
            let end;
            let output = "";
            if (this.minorCaret > this.caret) {
                start = this.caret;
                end = this.minorCaret;
            }
            else {
                end = this.caret;
                start = this.minorCaret;
            }
            for (let i = start; i < this.code.length && i < end; i++) {
                const slotOrChar = this.code[i];
                if (typeof slotOrChar === "string") {
                    const char = slotOrChar;
                    output += char;
                }
                else {
                    const slot = slotOrChar;
                    output += slot.getOutput();
                }
            }
            return output;
        }
        return "";
    }
    connectedCallback() { }
    insert(arr) {
        if (this.minorCaret === this.caret) {
            this.code.splice(this.caret, 0, ...arr);
        }
        else if (this.minorCaret > this.caret) {
            this.code.splice(this.caret, this.minorCaret - this.caret, ...arr);
        }
        else if (this.minorCaret < this.caret) {
            this.code.splice(this.minorCaret, this.caret - this.minorCaret, ...arr);
        }
    }
    insertSlot() {
        this.code.splice(this.caret, 0, new TextEditorElement({ parentEditor: this }));
    }
    backspace() {
        let start;
        let length;
        let move;
        if (this.minorCaret === this.caret) {
            start = this.caret - 1;
            length = 1;
            move = -1;
        }
        else if (this.minorCaret > this.caret) {
            start = this.caret;
            length = this.minorCaret - this.caret;
            move = 0;
        }
        else if (this.minorCaret < this.caret) {
            start = this.minorCaret;
            length = this.caret - this.minorCaret;
            move = -length;
        }
        this.code.splice(start, length);
        this.moveCaret(move);
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
        }
        else {
            if (change < 0 &&
                this.code[newCaret] &&
                typeof this.code[newCaret] !== "string") {
                this.caret = newCaret;
                this.minorCaret = this.caret;
                return this.code[newCaret];
            }
            else if (change > 0 &&
                this.code[newCaret - 1] &&
                typeof this.code[newCaret - 1] !== "string") {
                this.caret = newCaret - 1;
                this.minorCaret = this.caret;
                return this.code[newCaret - 1];
            }
            else {
                this.caret = newCaret;
                this.minorCaret = this.caret;
            }
        }
    }
    lineIndicesFromCodeIndex(index) {
        let start = 0;
        let end = this.code.length;
        for (let i = index - 1; i >= 0; i--) {
            const slotOrChar = this.code[i];
            if (typeof slotOrChar === "string") {
                const char = slotOrChar;
                if (char === "\n") {
                    start = i + 1;
                    break;
                }
            }
        }
        for (let i = index; i <= this.code.length; i++) {
            const slotOrChar = this.code[i];
            if (typeof slotOrChar === "string") {
                const char = slotOrChar;
                if (char === "\n") {
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
            if (!isSelecting)
                this.minorCaret = this.caret;
            return;
        }
        const caretOffsetLineStart = this.caret - lineStart;
        const [prevLineStart, prevLineEnd] = this.lineIndicesFromCodeIndex(lineStart - 1);
        this.caret = Math.min(prevLineStart + caretOffsetLineStart, prevLineEnd);
        if (!isSelecting)
            this.minorCaret = this.caret;
    }
    moveCaretDown(isSelecting) {
        const [lineStart, lineEnd] = this.lineIndicesFromCodeIndex(this.caret);
        if (lineEnd === this.code.length) {
            this.caret = this.code.length;
            if (!isSelecting)
                this.minorCaret = this.caret;
            return;
        }
        const caretOffsetLineStart = this.caret - lineStart;
        const [nextLineStart, nextLineEnd] = this.lineIndicesFromCodeIndex(lineEnd + 1);
        this.caret = Math.min(nextLineStart + caretOffsetLineStart, nextLineEnd);
        if (!isSelecting)
            this.minorCaret = this.caret;
    }
    render() {
        this.codeEl.innerHTML = "";
        this.codeEl.append(...this.displayHTML());
    }
    displayHTML() {
        let results = [];
        for (const [slotOrChar, i] of withIndex(this.code)) {
            if (i === this.caret) {
                results.push(document.createElement("caret"));
            }
            if (typeof slotOrChar === "string") {
                const char = slotOrChar;
                const charEl = document.createElement("span");
                charEl.textContent = char;
                charEl.setAttribute("i", i);
                if ((i < this.caret && i >= this.minorCaret) ||
                    (i >= this.caret && i < this.minorCaret)) {
                    charEl.style.background = "black";
                    charEl.style.color = "white";
                }
                results.push(charEl);
            }
            else {
                const slot = slotOrChar;
                slot.setAttribute("i", i);
                results.push(slot);
            }
        }
        if (this.caret === this.code.length) {
            results.push(document.createElement("caret"));
        }
        return results;
    }
    getOutput() {
        let output = "";
        for (const [slotOrChar, i] of withIndex(this.code)) {
            if (typeof slotOrChar === "string") {
                const char = slotOrChar;
                output += char;
            }
            else {
                const slot = slotOrChar;
                output += slot.getOutput();
            }
        }
        return output;
    }
    focusEditor(fromEl, position, isSelecting) {
        super.focusEditor();
        this.isCaretInSlot = false;
        if (fromEl !== undefined && position !== undefined) {
            for (const [slotOrChar, i] of withIndex(this.code)) {
                if (slotOrChar === fromEl) {
                    // case: exiting from slot
                    this.caret = i + position;
                    if (!isSelecting)
                        this.minorCaret = this.caret;
                    this.render();
                    return;
                }
            }
            if (position === 1) {
                // case: entering from a parent on the left
                this.caret = 0;
                this.minorCaret = this.caret;
            }
            if (position === 0) {
                // case: entering from a parent on the right
                this.caret = this.code.length;
                this.minorCaret = this.caret;
            }
            this.render();
        }
    }
    blur() {
        super.blur();
        this.minorCaret = this.caret;
        this.render();
    }
}
customElements.define("text-editor", TextEditorElement);
