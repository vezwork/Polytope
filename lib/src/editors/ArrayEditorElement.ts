import { withIndex } from "../Iterable.js";
import { EditorArgumentObject, EditorElement } from "../editor.js";

export type ArrayEditorElementArguments = EditorArgumentObject & {
  contents?: Array<unknown>;
};

export class ArrayEditorElement<T> extends EditorElement {
  meta = {
    editorName: "Array",
  };
  contents: Array<T> = [];
  caret = 0;
  minorCaret = 0;

  styleEl: HTMLStyleElement;
  contentsEl: HTMLElement;

  keyHandler(e: KeyboardEvent): boolean {
    return false; // override me!
  }

  processClipboardText(clipboardText: string): Array<T> {
    return []; // override me!
  }

  onCaretMoveOverContentItem(contentItems: Array<T>) {
    // override me!
  }

  getContentItemOutput(item: T) {
    return item.toString(); // override me!
  }

  cursorPosFromMouseEvent(e: MouseEvent) {
    const cand = Array.from(this.shadowRoot.querySelectorAll("*[i]"))
      .map((childEl) => ({
        el: childEl,
        rect: childEl.getBoundingClientRect(),
      }))
      .sort(
        (childA, childB) =>
          Math.abs(e.clientX - childA.rect.right) -
          Math.abs(Math.abs(e.clientX - childB.rect.right))
      )[0];

    const tryAttribute = cand?.el.getAttribute("i");
    if (tryAttribute) {
      let chari = parseInt(tryAttribute);
      const x = e.clientX - cand.rect.left; //x position offset from the left of the element
      if (x >= cand.rect.width / 2) {
        chari = chari + 1;
      }
      return chari;
    }
    return this.contents.length - 1;
  }

  focusEditor(
    fromEl?: HTMLElement,
    position?: 1 | 0 | undefined,
    isSelecting?: boolean
  ) {
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

  constructor({ contents }: ArrayEditorElementArguments = {}) {
    super(...arguments);

    if (Array.isArray(contents)) {
      // hmm: should actually parse?
      this.contents = contents;
    }

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
      this.moveCaret(0, false);
    });

    this.addEventListener("mousedown", (e) => {
      e.stopPropagation();
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
        e.stopPropagation();
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
        }
      }
    };
    document.addEventListener("copy", copy);
    document.addEventListener("cut", copy);
    document.addEventListener("paste", (e: ClipboardEvent) => {
      let pasteText = e.clipboardData.getData("text");

      if (pasteText && this.isFocused) {
        e.preventDefault();
        const processed = this.processClipboardText(pasteText);
        this.insert(processed);
      }
    });

    this.addEventListener("childEditorUpdate", (e) => {
      this.parentEditor?.dispatchEvent(
        new CustomEvent("childEditorUpdate", {
          detail: {
            out: this.getOutput(),
            editor: this,
          },
        })
      );
    });
    this.render();

    this.addEventListener("keydown", (e) => {
      if (e.key === " ") {
        e.preventDefault();
      }
      if (e.ctrlKey || e.metaKey) {
        // TODO: modifier is down
        return;
      }

      if (e.composedPath().includes(this)) {
        if (this.keyHandler?.(e)) return;
      }

      if (!e.composedPath().includes(this)) {
      } else if (e.key === "Backspace") {
        if (this.parentEditor && this.contents.length === 0) {
          this.parentEditor.dispatchEvent(
            new CustomEvent("subEditorDeleted", { detail: this })
          );
        }
        this.backspace();
      } else if (e.key === "ArrowLeft") {
        if (this.moveCaret(-1, e.shiftKey)) {
          this.parentEditor.focus();
          this.blur();
          this.parentEditor.focusEditor(this, 0, e.shiftKey);
        }
        this.render();
      } else if (e.key === "ArrowRight") {
        if (this.moveCaret(1, e.shiftKey)) {
          this.parentEditor.focus();
          this.blur();
          this.parentEditor.focusEditor(this, 1, e.shiftKey);
        }
        this.render();
      }
    });
  }

  caretsOrdered(): [number, number] {
    let start: number;
    let end: number;
    if (this.minorCaret > this.caret) {
      start = this.caret;
      end = this.minorCaret;
    } else {
      end = this.caret;
      start = this.minorCaret;
    }
    return [start, end];
  }

  insert(arr: Array<T>) {
    const [start, end] = this.caretsOrdered();

    if (start === end) {
      this.contents.splice(this.caret, 0, ...arr);
      this.moveCaret(arr.length);
    } else {
      this.contents.splice(start, end, ...arr);
    }

    this.render();

    this.parentEditor?.dispatchEvent(
      new CustomEvent("childEditorUpdate", {
        detail: {
          out: this.getOutput(),
          editor: this,
        },
      })
    );
  }

  backspace() {
    const [startCaret, endCaret] = this.caretsOrdered();

    if (this.minorCaret === this.caret) {
      this.contents.splice(startCaret - 1, 1);
      this.moveCaret(-1, false);
    } else {
      this.contents.splice(startCaret, endCaret - startCaret);
      this.setCaret(startCaret);
    }

    this.render();

    this.parentEditor?.dispatchEvent(
      new CustomEvent("childEditorUpdate", {
        detail: {
          out: this.getOutput(),
          editor: this,
        },
      })
    );
  }

  setCaret(position: number) {
    this.caret = Math.max(0, Math.min(position, this.contents.length));
    this.minorCaret = this.caret;

    this.render();
  }

  moveCaret(change: number, isSelecting?: boolean): boolean {
    if (this.caret + change > this.contents.length || this.caret + change < 0) {
      return true;
    }

    const newCaret = this.caret + change;

    if (isSelecting) {
      this.caret = newCaret;
    } else {
      if (this.caret < newCaret) {
        this.onCaretMoveOverContentItem(
          this.contents.slice(this.caret, newCaret)
        );
      } else {
        this.onCaretMoveOverContentItem(
          this.contents.slice(newCaret, this.caret)
        );
      }
      this.caret = newCaret;
      this.minorCaret = newCaret;
    }

    this.render();

    return false;
  }

  isIndexInSelection(i: number) {
    return (
      (i < this.caret && i >= this.minorCaret) ||
      (i >= this.caret && i < this.minorCaret)
    );
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
      if (
        (i < this.caret && i >= this.minorCaret) ||
        (i >= this.caret && i < this.minorCaret)
      ) {
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

  blur() {
    super.blur();

    this.moveCaret(0, false); // unselect
    this.render();
  }

  getHighlightedOutput() {
    if (!this.isFocused || this.minorCaret === this.caret) return "";

    const [start, end] = this.caretsOrdered();

    let output = "";
    for (let i = start; i < end; i++) {
      output += this.getContentItemOutput(this.contents[i]);
    }
    return output + "";
  }

  getOutput() {
    let output = "";
    for (const contentItem of this.contents) {
      output += this.getContentItemOutput(contentItem);
    }
    return output + "";
  }
}
customElements.define("array-editor", ArrayEditorElement);
