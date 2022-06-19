import { withIndex } from "../Iterable.js";
import { EditorElement } from "../editor.js";
export class ArrayEditorElement extends EditorElement {
    meta = {
        editorName: "Text",
    };
    contents;
    caret = 0;
    minorCaret = 0;
    styleEl;
    contentsEl;
    keyHandler(e) {
        return false; // override me!
    }
    processClipboardText(clipboardText) {
        return []; // override me!
    }
    constructor({ contents } = {}) {
        super(...arguments);
        this.style.setProperty("--editor-name", `'text'`);
        this.style.setProperty("--editor-color", "#017BFF");
        this.style.setProperty("--editor-name-color", "white");
        this.style.setProperty("--editor-background-color", "#E6F2FF");
        this.style.setProperty("--editor-outline-color", "#d4e9ff");
        this.styleEl = document.createElement("style");
        this.styleEl.textContent = `
            contents {
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
        this.contentsEl = document.createElement("contents");
        this.shadowRoot.append(this.styleEl, this.contentsEl);
        this.addEventListener("blur", (e) => {
            this.minorCaret = this.caret;
            this.render();
        });
        this.addEventListener("mousedown", (e) => {
            if (e.buttons === 1) {
                const pos = this.cursorPosFromMouseEvent(e);
                this.caret = pos;
                this.minorCaret = pos;
                this.render();
                setTimeout(() => this.focusEditor());
            }
        });
        this.addEventListener("mousemove", (e) => {
            if (this.isFocused) {
                if (e.buttons === 1) {
                    const pos = this.cursorPosFromMouseEvent(e);
                    this.caret = pos;
                    this.render();
                }
            }
        });
        const copy = (e) => {
            if (this.isFocused && this.minorCaret !== this.caret) {
                const output = this.getHighlightedOutput();
                e.clipboardData.setData("text/plain", output);
                e.preventDefault();
                console.log("copied!", output);
                if (e.type === "cut") {
                    this.backspace();
                    this.render();
                }
            }
        };
        document.addEventListener("copy", copy);
        document.addEventListener("cut", copy);
        document.addEventListener("paste", (e) => {
            let pasteText = e.clipboardData.getData("text");
            if (pasteText && this.isFocused) {
                const processed = this.processClipboardText(pasteText);
                this.insert(processed);
                this.moveCaret(processed.length);
                this.render();
            }
        });
        this.addEventListener("childEditorUpdate", (e) => {
            this.parentEditor?.dispatchEvent(new CustomEvent("childEditorUpdate", {
                detail: {
                    out: this.getOutput(),
                    editor: this,
                },
            }));
        });
        this.render();
        this.addEventListener("keydown", (e) => {
            if (e.key === "Control") {
                // TODO: modifier is down
                return;
            }
            if (e.composedPath().includes(this)) {
                if (this.keyHandler) {
                    this.keyHandler(e);
                }
            }
            if (!e.composedPath().includes(this)) {
            }
            else if (e.key === "Backspace") {
                if (this.parentEditor && this.contents.length === 0) {
                    this.parentEditor.dispatchEvent(new CustomEvent("subEditorDeleted", { detail: this }));
                }
                this.backspace();
                this.render();
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
            else if (e.key === "ArrowLeft") {
                this.moveCaret(-1, e.shiftKey);
                this.render();
            }
            else if (e.key === "ArrowRight") {
                this.moveCaret(1, e.shiftKey);
                this.render();
            }
        });
    }
    cursorPosFromMouseEvent(e) {
        const cand = Array.from(this.contentsEl.children)
            .map((childEl) => ({
            el: childEl,
            rect: childEl.getBoundingClientRect(),
        }))
            .filter(({ el, rect }) => {
            return e.pageY > rect.top && e.pageY < rect.bottom;
        })
            .sort((childA, childB) => Math.abs(e.screenX - childA.rect.right) -
            Math.abs(Math.abs(e.screenX - childB.rect.right)))[0];
        const tryAttribute = cand?.el.getAttribute("i") ??
            cand?.el.parentElement.getAttribute("i") ??
            cand?.el.parentElement.parentElement.getAttribute("i");
        if (tryAttribute) {
            let chari = parseInt(tryAttribute);
            const x = e.pageX - cand.rect.left; //x position within the element.
            if (x >= cand.rect.width / 2) {
                chari = chari + 1;
            }
            return chari;
        }
        return this.contents.length - 1;
    }
    caretsOrdered() {
        let start;
        let end;
        if (this.minorCaret > this.caret) {
            start = this.caret;
            end = this.minorCaret;
        }
        else {
            end = this.caret;
            start = this.minorCaret;
        }
        return [start, end];
    }
    insert(arr) {
        const [start, end] = this.caretsOrdered();
        if (start === end) {
            this.contents.splice(this.caret, 0, ...arr);
            this.moveCaret(arr.length);
        }
        else {
            this.contents.splice(start, end, ...arr);
        }
        this.parentEditor?.dispatchEvent(new CustomEvent("childEditorUpdate", {
            detail: {
                out: this.getOutput(),
                editor: this,
            },
        }));
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
        this.contents.splice(start, length);
        this.moveCaret(move);
        this.parentEditor?.dispatchEvent(new CustomEvent("childEditorUpdate", {
            detail: {
                out: this.getOutput(),
                editor: this,
            },
        }));
    }
    moveCaret(change, isSelecting) {
        if (this.caret + change > this.contents.length || this.caret + change < 0) {
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
            this.onCaretMoveOverContentItem(this.contents.slice(this.caret, newCaret));
            this.caret = newCaret;
            this.minorCaret = newCaret;
        }
    }
    isIndexInSelection(i) {
        return ((i < this.caret && i >= this.minorCaret) ||
            (i >= this.caret && i < this.minorCaret));
    }
    onCaretMoveOverContentItem(contentItems) {
        // can be implemented by child class
    }
    render() {
        this.contentsEl.innerHTML = "";
        let results = [];
        for (const [contentItem, i] of withIndex(this.contents)) {
            if (i === this.caret) {
                results.push(document.createElement("caret"));
            }
            const contentEl = document.createElement("span");
            contentEl.textContent = contentItem.toString();
            contentEl.setAttribute("i", i);
            if ((i < this.caret && i >= this.minorCaret) ||
                (i >= this.caret && i < this.minorCaret)) {
                contentEl.style.background = "black";
                contentEl.style.color = "white";
            }
            results.push(contentEl);
        }
        if (this.caret === this.contents.length) {
            results.push(document.createElement("caret"));
        }
        this.contentsEl.append(...results);
    }
    focusEditor(fromEl, position, isSelecting) {
        super.focusEditor();
        if (fromEl !== undefined && position !== undefined) {
            if (position === 1) {
                // case: entering from a parent on the left
                this.caret = 0;
                this.minorCaret = this.caret;
            }
            if (position === 0) {
                // case: entering from a parent on the right
                this.caret = this.contents.length;
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
    getContentItemOutput(element) {
        return element.toString();
    }
    getHighlightedOutput() {
        if (!this.isFocused || this.minorCaret === this.caret)
            return "";
        const [start, end] = this.caretsOrdered();
        let output = "";
        for (let i = start; i < end; i++) {
            output += this.getContentItemOutput(this.contents[i]);
        }
        return output;
    }
    getOutput() {
        let output = "";
        for (const contentItem of this.contents) {
            output += this.getContentItemOutput(contentItem);
        }
        return output;
    }
}
customElements.define("textlike-editor", LinearEditorElement);
