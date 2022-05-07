import { withIndex } from "./Iterable.js";

export class EditorElement extends HTMLElement {
  parentEditor = undefined;
  isFocused = false;

  constructor({ parentEditor } = {}) {
    super();

    this.parentEditor = parentEditor;

    this.attachShadow({ mode: "open" });

    const styleEl = document.createElement("style");
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
                box-sizing: border-box;
                position: relative;
                font-family: monospace;

                line-height: 1;

                min-height: 1.6rem;
                min-width: 0.5rem;
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

    if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", 0);

    this.addEventListener("focus", (e) => {
      e.stopPropagation();
      this.isFocused = true;
    });
    this.addEventListener("subEditorClicked", (e) => {
      this.parentEditor?.dispatchEvent(
        new CustomEvent("subEditorClicked", { detail: [this, ...e.detail] })
      );
    });
    this.addEventListener("blur", (e) => {
      e.stopPropagation();
      this.isFocused = false;
    });
    this.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      this.parentEditor?.dispatchEvent(
        new CustomEvent("subEditorClicked", { detail: [this] })
      );
      this.focus();
      this.isFocused = true;
    });
    this.addEventListener("keydown", (e) => e.stopPropagation());
  }

  get javaScriptCode() {
    return "";
  }
}

export class TextEditorElement extends EditorElement {
  code = [];
  caret = 0;
  minorCaret = 0;
  isCaretInSlot = false;

  constructor({ code = [], builder } = {}) {
    super(...arguments);

    this.builder = builder;

    this.code = code;
    for (const slotOrChar of code) {
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
    this.codeEl = document.createElement("code");
    this.shadowRoot.append(this.styleEl, this.codeEl);

    this.addEventListener("subEditorDeleted", (e) => {
      this.focus(e.detail, 1);
      setTimeout(() => {
        this.code = this.code.filter((slotOrChar) => slotOrChar !== e.detail);
        this.codeEl.innerHTML = "";
        this.codeEl.append(...this.displayHTML());
      });
    });
    this.addEventListener("subEditorReplaced", (e) => {
      const index = this.code.indexOf(e.detail.old);
      this.code.splice(index, 1, e.detail.new);
      this.codeEl.innerHTML = "";
      this.codeEl.append(...this.displayHTML());
      setTimeout(() => {
        e.detail.new.focus();
      });
    });
    this.addEventListener("blur", (e) => {
      this.minorCaret = this.caret;
      this.codeEl.innerHTML = "";
      this.codeEl.append(...this.displayHTML());
    });
    this.addEventListener("mousedown", (e) => {
      const targetEl = e.path[0];
      if (targetEl.getAttribute("i")) {
        let chari = parseInt(targetEl.getAttribute("i"));

        const rect = targetEl.getBoundingClientRect();
        const x = e.clientX - rect.left; //x position within the element.
        if (x >= rect.width / 2) {
          chari = chari + 1;
        }

        this.caret = chari;
        this.minorCaret = this.caret;
      }
      this.codeEl.innerHTML = "";
      this.codeEl.append(...this.displayHTML());
      setTimeout(() => this.focus());
    });
    this.addEventListener("mousemove", (e) => {
      if (this.isFocused) {
        const targetEl = e.path[0];
        if (targetEl.getAttribute("i") && e.buttons === 1) {
          let chari = parseInt(targetEl.getAttribute("i"));

          const rect = targetEl.getBoundingClientRect();
          const x = e.clientX - rect.left; //x position within the element.
          if (x >= rect.width / 2) {
            chari = chari + 1;
          }

          if (chari !== this.caret) {
            this.caret = chari;

            this.codeEl.innerHTML = "";
            this.codeEl.append(...this.displayHTML());
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
          this.codeEl.innerHTML = "";
          this.codeEl.append(...this.displayHTML());

          this.parentEditor?.dispatchEvent(
            new CustomEvent("childEditorUpdate", {
              detail: {
                out: this.getOutput(),
                editor: this,
              },
            })
          );
        }
      }
    };
    document.addEventListener("copy", copy);
    document.addEventListener("cut", copy);
    document.addEventListener("paste", (e) => {
      let paste = (e.clipboardData || window.clipboardData).getData("text");

      if (paste && this.isFocused) {
        if (this.builder) {
          const unwrappedOut = this.builder(paste).output.map((thing) => {
            if (typeof thing !== "string") thing.parentEditor = this;

            return thing;
          });
          console.log(unwrappedOut);
          this.code.splice(this.caret, 0, ...unwrappedOut);
          this.moveCaret(unwrappedOut.length);
        } else {
          this.insertText(paste);
          this.moveCaret(paste.length);
        }
        this.codeEl.innerHTML = "";
        this.codeEl.append(...this.displayHTML());
      }
    });
    this.addEventListener("keydown", (e) => {
      if (e.key === "Control") {
        // TODO: modifier is down
        return;
      }
      if (!this.isCaretInSlot) {
        if (this.keyHandler) {
          const maybeFocuser = this.keyHandler(e);

          if (maybeFocuser) {
            this.codeEl.innerHTML = "";
            this.codeEl.append(...this.displayHTML());
            this.blur();
            maybeFocuser.focus();

            this.parentEditor?.dispatchEvent(
              new CustomEvent("childEditorUpdate", {
                detail: {
                  out: this.getOutput(),
                  editor: this,
                },
              })
            );
            return;
          }
        }
      }
      if (this.isCaretInSlot) {
      } else if (e.key === "Backspace") {
        if (this.parentEditor && this.code.length === 0) {
          this.parentEditor.dispatchEvent(
            new CustomEvent("subEditorDeleted", { detail: this })
          );
        }
        this.backspace();
        this.codeEl.innerHTML = "";
        this.codeEl.append(...this.displayHTML());

        this.parentEditor?.dispatchEvent(
          new CustomEvent("childEditorUpdate", {
            detail: {
              out: this.getOutput(),
              editor: this,
            },
          })
        );
      } else if (e.key === "Enter") {
        this.insertText("\n");
        const focuser = this.moveCaret(1);
        this.codeEl.innerHTML = "";
        this.codeEl.append(...this.displayHTML());
        //note: shouldn't happen in practice
        if (focuser) {
          this.blur();
          focuser.focus();
          this.isCaretInSlot = true;
        }
        this.parentEditor?.dispatchEvent(
          new CustomEvent("childEditorUpdate", {
            detail: {
              out: this.getOutput(),
              editor: this,
            },
          })
        );
      } else if (e.key === "Alt") {
      } else if (e.key === "Meta") {
      } else if (e.key === "CapsLock") {
      } else if (e.key === "Shift") {
      } else if (e.key === "Control") {
      } else if (e.key === "Tab") {
        this.insertText("  ");
        const focuser = this.moveCaret(2);
        this.codeEl.innerHTML = "";
        this.codeEl.append(...this.displayHTML());
        e.preventDefault();
      } else if (e.key === "ArrowLeft") {
        const focuser = this.moveCaret(-1, e.shiftKey);
        this.codeEl.innerHTML = "";
        this.codeEl.append(...this.displayHTML());
        if (focuser) {
          this.blur();
          focuser.focus(this, 0, e.shiftKey);
          this.isCaretInSlot = true;
        }
      } else if (e.key === "ArrowRight") {
        const focuser = this.moveCaret(1, e.shiftKey);
        this.codeEl.innerHTML = "";
        this.codeEl.append(...this.displayHTML());
        if (focuser) {
          this.blur();
          focuser.focus(this, 1, e.shiftKey);
          this.isCaretInSlot = true;
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        this.moveCaretUp(e.shiftKey);
        this.codeEl.innerHTML = "";
        this.codeEl.append(...this.displayHTML());
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        this.moveCaretDown(e.shiftKey);
        this.codeEl.innerHTML = "";
        this.codeEl.append(...this.displayHTML());
      } else {
        if (e.ctrlKey || e.metaKey) return;
        e.preventDefault();
        this.insertText(e.key);
        this.moveCaret(1);
        this.codeEl.innerHTML = "";
        this.codeEl.append(...this.displayHTML());
        // note: shouldn't happen in practice
        //if (focuser) {
        //    this.blur();
        //    focuser.focus();
        //}
        this.parentEditor?.dispatchEvent(
          new CustomEvent("childEditorUpdate", {
            detail: {
              out: this.getOutput(),
              editor: this,
            },
          })
        );
      }
    });
    this.codeEl.innerHTML = "";
    this.codeEl.append(...this.displayHTML());
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
  }

  getHighlighted() {
    if (this.isFocused && this.minorCaret !== this.caret) {
      let start;
      let end;
      let output = "";
      if (this.minorCaret > this.caret) {
        start = this.caret;
        end = this.minorCaret;
      } else {
        end = this.caret;
        start = this.minorCaret;
      }
      for (let i = start; i < this.code.length && i < end; i++) {
        const slotOrChar = this.code[i];
        if (typeof slotOrChar === "string") {
          const char = slotOrChar;
          output += char;
        } else {
          const slot = slotOrChar;
          output += slot.getOutput();
        }
      }
      return output;
    }
    return "";
  }

  connectedCallback() {}

  insertText(text) {
    const insert = text.split("");
    this.code.splice(this.caret, 0, ...insert);
  }

  insertSlot() {
    this.code.splice(
      this.caret,
      0,
      new TextEditorElement({ parentEditor: this })
    );
  }

  backspace() {
    let start;
    let length;
    let move;
    if (this.minorCaret === this.caret) {
      start = this.caret - 1;
      length = 1;
      move = -1;
    } else if (this.minorCaret > this.caret) {
      start = this.caret;
      length = this.minorCaret - this.caret;
      move = 0;
    } else if (this.minorCaret < this.caret) {
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
    } else {
      if (
        change < 0 &&
        this.code[newCaret] &&
        typeof this.code[newCaret] !== "string"
      ) {
        this.caret = newCaret;
        this.minorCaret = this.caret;
        return this.code[newCaret];
      } else if (
        change > 0 &&
        this.code[newCaret - 1] &&
        typeof this.code[newCaret - 1] !== "string"
      ) {
        this.caret = newCaret - 1;
        this.minorCaret = this.caret;
        return this.code[newCaret - 1];
      } else {
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
      if (!isSelecting) this.minorCaret = this.caret;
      return;
    }
    const caretOffsetLineStart = this.caret - lineStart;
    const [prevLineStart, prevLineEnd] = this.lineIndicesFromCodeIndex(
      lineStart - 1
    );
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
    const [nextLineStart, nextLineEnd] = this.lineIndicesFromCodeIndex(
      lineEnd + 1
    );
    this.caret = Math.min(nextLineStart + caretOffsetLineStart, nextLineEnd);
    if (!isSelecting) this.minorCaret = this.caret;
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
        if (
          (i < this.caret && i >= this.minorCaret) ||
          (i >= this.caret && i < this.minorCaret)
        ) {
          charEl.style.background = "black";
          charEl.style.color = "white";
        }
        results.push(charEl);
      } else {
        const slot = slotOrChar;
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
        if (slotOrChar === fromEl) {
          // case: exiting from slot
          this.caret = i + position;
          if (!isSelecting) this.minorCaret = this.caret;
          this.codeEl.innerHTML = "";
          this.codeEl.append(...this.displayHTML());
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
      this.codeEl.innerHTML = "";
      this.codeEl.append(...this.displayHTML());
    }
  }

  blur() {
    super.blur();

    this.minorCaret = this.caret;

    this.codeEl.innerHTML = "";
    this.codeEl.append(...this.displayHTML());
  }
}
export class StringEditorElement extends TextEditorElement {
  constructor() {
    super(...arguments);

    this.style.setProperty("--editor-name", `'string'`);
    this.style.setProperty("--editor-color", "black");
    this.style.setProperty("--editor-name-color", "white");
    this.style.setProperty("--editor-background-color", "white");
    this.style.setProperty("--editor-outline-color", "black");
  }

  getOutput() {
    let output = '"';

    for (const [slotOrChar, i] of withIndex(this.code)) {
      if (typeof slotOrChar === "string") {
        const char = slotOrChar;
        output += char;
      } else {
        const slot = slotOrChar;
        output += slot.getOutput();
      }
    }

    return output + '"';
  }
}

export const MakeGraphEditorElement = (
  NestedEditorConstructor = TextEditorElement,
  name = "custom"
) => {
  class GraphEditorElement extends EditorElement {
    nodes = [];

    constructor() {
      super(...arguments);

      this.style.setProperty("--editor-name", `'graph'`);
      this.style.setProperty("--editor-color", "#7300CF");
      this.style.setProperty("--editor-name-color", "white");
      this.style.setProperty("--editor-background-color", "#eed9ff");
      this.style.setProperty("--editor-outline-color", "#b59dc9");

      this.styleEl = document.createElement("style");
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
      this.canvas = document.createElement("canvas");
      this.canvas.width = 250;
      this.canvas.height = 250;
      this.context = this.canvas.getContext("2d");
      this.shadowRoot.append(this.styleEl, this.canvas);

      this.fromNode = null;
      this.mouse = [0, 0];

      this.fromInput(...arguments);
      setTimeout(() => this.render());

      this.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && this.parentEditor) {
          this.parentEditor.dispatchEvent(
            new CustomEvent("subEditorDeleted", { detail: this })
          );
          this.parentEditor?.dispatchEvent(
            new CustomEvent("childEditorUpdate", {
              detail: {
                out: this.getOutput(),
                editor: this,
              },
            })
          );
        } else if (e.key === "ArrowLeft" && this.parentEditor) {
          this.blur();
          this.parentEditor.focus(this, 0, e.shiftKey);
        } else if (e.key === "ArrowRight" && this.parentEditor) {
          this.blur();
          this.parentEditor.focus(this, 1, e.shiftKey);
        }
      });
      this.addEventListener("subEditorDeleted", (e) => {
        this.nodes = this.nodes.filter(({ editor }) => editor !== e.detail);
        for (const node of this.nodes) {
          node.adjacent = node.adjacent.filter(
            ({ editor }) => editor !== e.detail
          );
        }
        this.shadowRoot.removeChild(e.detail);
        this.render();
        this.focus();
        this.parentEditor?.dispatchEvent(
          new CustomEvent("childEditorUpdate", {
            detail: {
              out: this.getOutput(),
              editor: this,
            },
          })
        );
      });
      this.addEventListener("subEditorClicked", (e) => {
        const subFocus = this.nodes.find(
          ({ editor }) => editor === e.detail[0]
        );
        if (subFocus) {
          this.fromNode = subFocus; // HACK
        }
      });
      this.addEventListener("mousemove", (e) => {
        this.mouse = [e.offsetX, e.offsetY];
        if (this.fromNode && e.metaKey) {
          this.fromNode.x = Math.max(
            0,
            Math.min(
              this.mouse[0] - 10,
              this.offsetWidth - this.fromNode.editor.offsetWidth - 2
            )
          );
          this.fromNode.y = Math.max(
            0,
            Math.min(
              this.mouse[1] - 10,
              this.offsetHeight - this.fromNode.editor.offsetHeight - 2
            )
          );
        }
        this.render();
      });
      this.addEventListener("mousedown", (e) => {
        const editor = new NestedEditorConstructor({ parentEditor: this });
        editor.style.position = "absolute";
        const node = {
          x: e.offsetX - 10,
          y: e.offsetY - 10,
          editor,
          adjacent: [],
        };
        this.nodes.push(node);
        this.shadowRoot.append(editor);
        this.blur();
        setTimeout(() => editor.focus());
        this.fromNode = node;
        this.render();
        this.parentEditor?.dispatchEvent(
          new CustomEvent("childEditorUpdate", {
            detail: {
              out: this.getOutput(),
              editor: this,
            },
          })
        );
      });
      this.addEventListener("mouseup", (e) => {
        const targetEl = e.path[0];
        const targetNode = this.nodes.find(
          ({ editor }) =>
            editor.contains(targetEl) || editor.shadowRoot.contains(targetEl)
        );
        if (targetNode) {
          if (
            this.fromNode &&
            this.fromNode !== targetNode &&
            !this.fromNode.adjacent.includes(targetNode)
          ) {
            this.fromNode.adjacent.push(targetNode);
            this.parentEditor?.dispatchEvent(
              new CustomEvent("childEditorUpdate", {
                detail: {
                  out: this.getOutput(),
                  editor: this,
                },
              })
            );
          }
        }
        this.fromNode = null;
        this.render();
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
    }

    render() {
      this.context.strokeStyle = "#7300CF";
      this.context.fillStyle = "#7300CF";
      this.context.lineWidth = 2;
      this.context.lineCap = "round";
      this.canvas.width = this.offsetWidth;
      this.canvas.height = this.offsetHeight;
      if (this.fromNode) {
        this.context.beginPath();
        this.context.moveTo(
          this.fromNode.x + this.fromNode.editor.offsetWidth / 2,
          this.fromNode.y + this.fromNode.editor.offsetHeight / 2
        );
        this.context.lineTo(...this.mouse);
        this.context.stroke();
      }
      for (const { x, y, editor, adjacent } of this.nodes) {
        editor.style.top = `${y}px`;
        editor.style.left = `${x}px`;
        for (const otherNode of adjacent) {
          this.context.beginPath();
          const start = [
            x + editor.offsetWidth / 2,
            y + editor.offsetHeight / 2,
          ];
          const end = [
            otherNode.x + otherNode.editor.offsetWidth / 2,
            otherNode.y + otherNode.editor.offsetHeight / 2,
          ];
          this.context.moveTo(...start);
          this.context.lineTo(...end);
          this.context.stroke();

          const angle = Math.atan2(end[0] - start[0], end[1] - start[1]);
          const dir = [Math.sin(angle), Math.cos(angle)];
          const dist =
            Math.min(
              otherNode.editor.offsetHeight * Math.abs(1 / Math.cos(angle)),
              otherNode.editor.offsetWidth * Math.abs(1 / Math.sin(angle))
            ) / 2; // https://math.stackexchange.com/a/924290/421433
          this.context.beginPath();
          this.context.moveTo(end[0] - dir[0] * dist, end[1] - dir[1] * dist);
          this.context.lineTo(
            end[0] - dir[0] * (dist + 11) + dir[1] * 7,
            end[1] - dir[1] * (dist + 11) - dir[0] * 7
          );
          this.context.stroke();
          this.context.moveTo(end[0] - dir[0] * dist, end[1] - dir[1] * dist);
          this.context.lineTo(
            end[0] - dir[0] * (dist + 11) - dir[1] * 7,
            end[1] - dir[1] * (dist + 11) + dir[0] * 7
          );
          this.context.stroke();
        }
      }
    }

    fromInput(input) {
      if (!input || !input.nodes || !input.edges || !input.positions) return;
      const { nodes, edges, positions } = input;

      for (let i = 0; i < nodes.length; i++) {
        const nodeValue = nodes[i];
        const position = positions[i];

        let editor;
        if (nodeValue instanceof HTMLElement) {
          editor = new NestedEditorConstructor({
            code: [nodeValue],
            parentEditor: this,
          });
        } else {
          editor = new NestedEditorConstructor({
            code: [String(nodeValue)],
            parentEditor: this,
          });
        }
        editor.style.position = "absolute";

        this.nodes[i] = {
          x: position[0],
          y: position[1],
          editor,
          adjacent: [],
        };
        this.shadowRoot.append(editor);
      }
      for (let i = 0; i < nodes.length; i++) {
        const edgeList = edges[i];

        for (const edgeIndex of edgeList) {
          this.nodes[i].adjacent.push(this.nodes[edgeIndex]);
        }
      }
    }

    getOutput() {
      let nodes = [];
      let positions = [];
      let edges = [];

      for (const [{ editor, x, y, adjacent }, i] of withIndex(this.nodes)) {
        nodes[i] = `"${editor.getOutput()}"`;
        positions[i] = [x, y];

        edges[i] = [];
        for (const otherNode of adjacent) {
          const otherNodeIndex = this.nodes.findIndex((n) => n === otherNode);
          edges[i].push(otherNodeIndex);
        }
      }

      return `({
    "nodes": [${nodes}],
    "edges": [${edges.map((edgeList) => `[${edgeList}]`)}],
    "positions": [${positions.map(([x, y]) => `[${x}, ${y}]`)}]
})`;
    }
  }
  customElements.define(`graph-editor-${name}`, GraphEditorElement);
  return GraphEditorElement;
};

const GRAPH_COLORS = ["red", "blue", "green", "purple"];
export class ColoredGraphEditorElement extends EditorElement {
  nodes = [];
  currentColor = 0;

  constructor() {
    super(...arguments);
    this.style.setProperty("--editor-name", `'graph'`);
    this.style.setProperty("--editor-color", GRAPH_COLORS[0]);
    this.style.setProperty("--editor-name-color", "white");
    this.style.setProperty("--editor-background-color", "white");
    this.style.setProperty("--editor-outline-color", "black");

    this.styleEl = document.createElement("style");
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
    this.canvas = document.createElement("canvas");
    this.canvas.width = 250;
    this.canvas.height = 250;
    this.context = this.canvas.getContext("2d");
    this.shadowRoot.append(this.styleEl, this.canvas);

    this.fromNode = null;
    this.mouse = [0, 0];

    this.fromInput(...arguments);
    setTimeout(() => this.render());

    this.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && this.parentEditor) {
        this.parentEditor.dispatchEvent(
          new CustomEvent("subEditorDeleted", { detail: this })
        );
        this.blur();
        this.parentEditor.focus();
      } else if (e.key === "ArrowLeft" && this.parentEditor) {
        this.blur();
        this.parentEditor.focus(this, 0, e.shiftKey);
      } else if (e.key === "ArrowRight" && this.parentEditor) {
        this.blur();
        this.parentEditor.focus(this, 1, e.shiftKey);
      } else if (e.key === "Meta") {
        this.currentColor = (this.currentColor + 1) % GRAPH_COLORS.length;
        this.style.setProperty(
          "--editor-color",
          GRAPH_COLORS[this.currentColor]
        );
      }
    });
    this.addEventListener("subEditorDeleted", (e) => {
      this.nodes = this.nodes.filter(({ editor }) => editor !== e.detail);
      for (const node of this.nodes) {
        for (let i = 0; i < GRAPH_COLORS.length; i++) {
          node.adjacent[i] = node.adjacent[i].filter(
            ({ editor }) => editor !== e.detail
          );
        }
      }
      this.shadowRoot.removeChild(e.detail);
      this.render();
      this.focus();
      this.parentEditor?.dispatchEvent(
        new CustomEvent("childEditorUpdate", {
          detail: {
            out: this.getOutput(),
            editor: this,
          },
        })
      );
    });
    this.addEventListener("subEditorClicked", (e) => {
      const subFocus = this.nodes.find(({ editor }) => editor === e.detail[0]);
      if (subFocus) {
        this.fromNode = subFocus; // HACK
      }
    });
    this.addEventListener("mousemove", (e) => {
      this.mouse = [e.offsetX, e.offsetY];
      if (this.fromNode && e.metaKey) {
        this.fromNode.x = Math.max(
          0,
          Math.min(
            this.mouse[0] - 10,
            this.offsetWidth - this.fromNode.editor.offsetWidth - 2
          )
        );
        this.fromNode.y = Math.max(
          0,
          Math.min(
            this.mouse[1] - 10,
            this.offsetHeight - this.fromNode.editor.offsetHeight - 2
          )
        );
      }
      this.render();
    });
    this.addEventListener("mousedown", (e) => {
      const editor = new StringEditorElement({
        parentEditor: this,
        code: String(this.nodes.length).split(""),
      });
      editor.style.position = "absolute";
      const node = {
        x: e.offsetX - 10,
        y: e.offsetY - 10,
        editor,
        adjacent: {
          0: [],
          1: [],
          2: [],
          3: [],
        },
      };
      this.nodes.push(node);
      this.shadowRoot.append(editor);
      this.blur();
      setTimeout(() => editor.focus());
      this.fromNode = node;
      this.render();
      this.parentEditor?.dispatchEvent(
        new CustomEvent("childEditorUpdate", {
          detail: {
            out: this.getOutput(),
            editor: this,
          },
        })
      );
    });
    this.addEventListener("mouseup", (e) => {
      const targetEl = e.path[0];
      const targetNode = this.nodes.find(
        ({ editor }) =>
          editor.contains(targetEl) || editor.shadowRoot.contains(targetEl)
      );
      if (targetNode) {
        if (
          this.fromNode &&
          this.fromNode !== targetNode &&
          !this.fromNode.adjacent[this.currentColor].includes(targetNode)
        ) {
          this.fromNode.adjacent[this.currentColor].push(targetNode);
        }
      }
      this.fromNode = null;
      this.render();
      this.parentEditor?.dispatchEvent(
        new CustomEvent("childEditorUpdate", {
          detail: {
            out: this.getOutput(),
            editor: this,
          },
        })
      );
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
  }

  render() {
    this.context.lineWidth = 2;
    this.context.lineCap = "round";
    this.canvas.width = this.offsetWidth;
    this.canvas.height = this.offsetHeight;
    if (this.fromNode) {
      this.context.strokeStyle = GRAPH_COLORS[this.currentColor];
      this.context.beginPath();
      this.context.moveTo(
        this.fromNode.x + this.fromNode.editor.offsetWidth / 2,
        this.fromNode.y + this.fromNode.editor.offsetHeight / 2
      );
      this.context.lineTo(...this.mouse);
      this.context.stroke();
    }
    for (const { x, y, editor, adjacent } of this.nodes) {
      editor.style.top = `${y}px`;
      editor.style.left = `${x}px`;

      const drawConnections = (otherNodes) => {
        for (const otherNode of otherNodes) {
          this.context.beginPath();
          const start = [
            x + editor.offsetWidth / 2,
            y + editor.offsetHeight / 2,
          ];
          const end = [
            otherNode.x + otherNode.editor.offsetWidth / 2,
            otherNode.y + otherNode.editor.offsetHeight / 2,
          ];
          this.context.moveTo(...start);
          this.context.lineTo(...end);
          this.context.stroke();

          const angle = Math.atan2(end[0] - start[0], end[1] - start[1]);
          const dir = [Math.sin(angle), Math.cos(angle)];
          const dist =
            Math.min(
              otherNode.editor.offsetHeight * Math.abs(1 / Math.cos(angle)),
              otherNode.editor.offsetWidth * Math.abs(1 / Math.sin(angle))
            ) / 2; // https://math.stackexchange.com/a/924290/421433
          this.context.beginPath();
          this.context.moveTo(end[0] - dir[0] * dist, end[1] - dir[1] * dist);
          this.context.lineTo(
            end[0] - dir[0] * (dist + 11) + dir[1] * 7,
            end[1] - dir[1] * (dist + 11) - dir[0] * 7
          );
          this.context.stroke();
          this.context.moveTo(end[0] - dir[0] * dist, end[1] - dir[1] * dist);
          this.context.lineTo(
            end[0] - dir[0] * (dist + 11) - dir[1] * 7,
            end[1] - dir[1] * (dist + 11) + dir[0] * 7
          );
          this.context.stroke();
        }
      };
      for (let i = 0; i < GRAPH_COLORS.length; i++) {
        const color = GRAPH_COLORS[i];
        this.context.strokeStyle = color;
        drawConnections(adjacent[i]);
      }
    }
  }

  fromInput(input) {
    if (!input || !input.nodes || !input.edges || !input.positions) return;
    const { nodes, edges, positions } = input;

    for (let i = 0; i < nodes.length; i++) {
      const nodeValue = nodes[i];
      const position = positions[i];

      let editor;
      if (nodeValue instanceof HTMLElement) {
        editor = new StringEditorElement({
          code: [nodeValue],
          parentEditor: this,
        });
      } else {
        editor = new StringEditorElement({
          code: [String(nodeValue)],
          parentEditor: this,
        });
      }
      editor.style.position = "absolute";

      this.nodes[i] = {
        x: position[0],
        y: position[1],
        editor,
        adjacent: {
          0: [],
          1: [],
          2: [],
          3: [],
        },
      };
      this.shadowRoot.append(editor);
    }
    for (let j = 0; j < GRAPH_COLORS.length; j++) {
      for (let i = 0; i < nodes.length; i++) {
        const edgeList = edges[j][i];

        for (const edgeIndex of edgeList) {
          this.nodes[i].adjacent[j].push(this.nodes[edgeIndex]);
        }
      }
    }
  }

  getJSONOutput() {
    let nodes = [];
    let positions = [];
    let edges = {
      0: [],
      1: [],
      2: [],
      3: [],
    };

    for (const [{ editor, x, y, adjacent }, i] of withIndex(this.nodes)) {
      nodes[i] = editor;
      positions[i] = [x, y];

      for (let j = 0; j < GRAPH_COLORS.length; j++) {
        edges[j][i] = [];
        for (const otherNode of adjacent[j]) {
          const otherNodeIndex = this.nodes.findIndex((n) => n === otherNode);
          edges[j][i].push(otherNodeIndex);
        }
      }
    }

    return {
      isColoredGraph: true,
      nodes,
      edges,
      positions,
    };
  }

  getOutput() {
    const { nodes, edges, positions } = this.getJSONOutput();
    return `(${JSON.stringify({
      nodes: nodes.map((node) => node.getOutput().split('"').join("")),
      edges,
      positions,
      isColoredGraph: true,
    })})`;
  }
}

export class ForceGraphEditorElement extends EditorElement {
  nodes = [];

  constructor() {
    super(...arguments);

    this.style.setProperty("--editor-name", `'graph'`);
    this.style.setProperty("--editor-color", "#7300CF");
    this.style.setProperty("--editor-name-color", "white");
    this.style.setProperty("--editor-background-color", "#eed9ff");
    this.style.setProperty("--editor-outline-color", "#b59dc9");

    this.styleEl = document.createElement("style");
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
    this.canvas = document.createElement("canvas");
    this.canvas.width = 250;
    this.canvas.height = 250;
    this.context = this.canvas.getContext("2d");
    this.shadowRoot.append(this.styleEl, this.canvas);

    this.fromNode = null;
    this.mouse = [0, 0];

    this.fromInput(...arguments);
    setTimeout(() => this.render());

    this.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && this.parentEditor) {
        this.parentEditor.dispatchEvent(
          new CustomEvent("subEditorDeleted", { detail: this })
        );
      } else if (e.key === "ArrowLeft" && this.parentEditor) {
        this.blur();
        this.parentEditor.focus(this, 0, e.shiftKey);
      } else if (e.key === "ArrowRight" && this.parentEditor) {
        this.blur();
        this.parentEditor.focus(this, 1, e.shiftKey);
      }
    });
    this.addEventListener("subEditorDeleted", (e) => {
      this.nodes = this.nodes.filter(({ editor }) => editor !== e.detail);
      for (const node of this.nodes) {
        node.adjacent = node.adjacent.filter(
          ({ editor }) => editor !== e.detail
        );
      }
      this.shadowRoot.removeChild(e.detail);
      this.render();
      this.focus();
      new CustomEvent("childEditorUpdate", {
        detail: {
          out: this.getOutput(),
          editor: this,
        },
      });
    });
    this.addEventListener("subEditorClicked", (e) => {
      const subFocus = this.nodes.find(({ editor }) => editor === e.detail[0]);
      if (subFocus) {
        this.fromNode = subFocus; // HACK
      }
    });
    this.addEventListener("mousemove", (e) => {
      this.mouse = [e.offsetX, e.offsetY];
      if (this.fromNode && e.metaKey) {
        this.fromNode.x = Math.max(
          0,
          Math.min(
            this.mouse[0] - 10,
            this.offsetWidth - this.fromNode.editor.offsetWidth - 2
          )
        );
        this.fromNode.y = Math.max(
          0,
          Math.min(
            this.mouse[1] - 10,
            this.offsetHeight - this.fromNode.editor.offsetHeight - 2
          )
        );
      }
      this.render();
    });
    this.addEventListener("mousedown", (e) => {
      const editor = new StringEditorElement({ parentEditor: this });
      editor.style.position = "absolute";
      const node = {
        x: e.offsetX - 10,
        y: e.offsetY - 10,
        editor,
        adjacent: [],
      };
      this.nodes.push(node);
      this.shadowRoot.append(editor);
      this.blur();
      setTimeout(() => editor.focus());
      this.fromNode = node;
      this.render();
      new CustomEvent("childEditorUpdate", {
        detail: {
          out: this.getOutput(),
          editor: this,
        },
      });
    });
    this.addEventListener("mouseup", (e) => {
      const targetEl = e.path[0];
      const targetNode = this.nodes.find(
        ({ editor }) =>
          editor.contains(targetEl) || editor.shadowRoot.contains(targetEl)
      );
      if (targetNode) {
        if (
          this.fromNode &&
          this.fromNode !== targetNode &&
          !this.fromNode.adjacent.includes(targetNode)
        ) {
          this.fromNode.adjacent.push(targetNode);
          targetNode.adjacent.push(this.fromNode);
          new CustomEvent("childEditorUpdate", {
            detail: {
              out: this.getOutput(),
              editor: this,
            },
          });
        }
      }
      this.fromNode = null;
      this.render();
    });

    const move = () => {
      const middleOfEditor = [this.offsetWidth / 2, this.offsetHeight / 2];

      const forces = [];
      for (let i = 0; i < this.nodes.length; i++) forces[i] = [0, 0];

      for (let i = 0; i < this.nodes.length; i++) {
        const node = this.nodes[i];

        const start = [
          node.x + node.editor.offsetWidth / 2,
          node.y + node.editor.offsetHeight / 2,
        ];

        const dirToMiddle = sub(middleOfEditor, start);
        const distToMiddle = dist(start, middleOfEditor);
        const nudgeToMiddle = mul(0.0005 * distToMiddle, dirToMiddle);
        forces[i] = add(forces[i], nudgeToMiddle);

        for (let j = i + 1; j < this.nodes.length; j++) {
          const otherNode = this.nodes[j];

          const end = [
            otherNode.x + otherNode.editor.offsetWidth / 2,
            otherNode.y + otherNode.editor.offsetHeight / 2,
          ];

          const dir = sub(end, start);
          const mag = dist(start, end);

          let force = mul(node.editor.offsetWidth ** 1.3 / mag ** 2, dir);
          //if (node.adjacent.includes(otherNode)) force = add(force, mul(-mag / 500, dir));

          forces[i] = add(forces[i], mul(-1, force));
          forces[j] = add(forces[j], force);
        }
      }

      for (let i = 0; i < this.nodes.length; i++) {
        const node = this.nodes[i];
        const [x, y] = add([node.x, node.y], forces[i]);
        node.x = x;
        node.y = y;
      }
    };
    move();

    const step = () => {
      this.render();
      move();

      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  render() {
    this.context.strokeStyle = "#7300CF";
    this.context.fillStyle = "#7300CF";
    this.context.lineWidth = 2;
    this.context.lineCap = "round";
    this.canvas.width = this.offsetWidth;
    this.canvas.height = this.offsetHeight;
    if (this.fromNode) {
      this.context.beginPath();
      this.context.moveTo(
        this.fromNode.x + this.fromNode.editor.offsetWidth / 2,
        this.fromNode.y + this.fromNode.editor.offsetHeight / 2
      );
      this.context.lineTo(...this.mouse);
      this.context.stroke();
    }
    for (const { x, y, editor, adjacent } of this.nodes) {
      editor.style.top = `${y}px`;
      editor.style.left = `${x}px`;
      for (const otherNode of adjacent) {
        this.context.beginPath();
        const start = [x + editor.offsetWidth / 2, y + editor.offsetHeight / 2];
        const end = [
          otherNode.x + otherNode.editor.offsetWidth / 2,
          otherNode.y + otherNode.editor.offsetHeight / 2,
        ];
        this.context.moveTo(...start);
        this.context.lineTo(...end);
        this.context.stroke();
      }
    }
  }

  fromInput(input) {
    if (!input || !input.nodes || !input.edges) return;
    const { nodes, edges } = input;

    for (let i = 0; i < nodes.length; i++) {
      const nodeValue = nodes[i];

      let editor;
      if (nodeValue instanceof HTMLElement) {
        editor = new StringEditorElement({
          code: [nodeValue],
          parentEditor: this,
        });
      } else {
        editor = new StringEditorElement({
          code: [String(nodeValue)],
          parentEditor: this,
        });
      }
      editor.style.position = "absolute";

      this.nodes[i] = { x: 100 + i, y: 100 + i, editor, adjacent: [] };
      this.shadowRoot.append(editor);
    }
    for (let i = 0; i < nodes.length; i++) {
      const edgeList = edges[i];

      for (const edgeIndex of edgeList) {
        this.nodes[i].adjacent.push(this.nodes[edgeIndex]);
      }
    }
  }

  getOutput() {
    let nodes = [];
    let edges = [];

    for (const [{ editor, x, y, adjacent }, i] of withIndex(this.nodes)) {
      nodes[i] = editor.getOutput();

      edges[i] = [];
      for (const otherNode of adjacent) {
        const otherNodeIndex = this.nodes.findIndex((n) => n === otherNode);
        edges[i].push(otherNodeIndex);
      }
    }

    return `({
    "nodes": [${nodes}],
    "edges": [${edges.map((edgeList) => `[${edgeList}]`)}]
})`;
  }
}

// editorDescription: [{
//     name: string;
//     description: string;
//     iconPath: string;
//     ElementConstructor: HTMLElement;
// }]

export class ForceColoredGraphEditorElement extends EditorElement {
  nodes = [];
  currentColor = 0;

  constructor() {
    super(...arguments);
    this.style.setProperty("--editor-name", `'graph'`);
    this.style.setProperty("--editor-color", GRAPH_COLORS[0]);
    this.style.setProperty("--editor-name-color", "white");
    this.style.setProperty("--editor-background-color", "white");
    this.style.setProperty("--editor-outline-color", "black");

    this.styleEl = document.createElement("style");
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
    this.canvas = document.createElement("canvas");
    this.canvas.width = 250;
    this.canvas.height = 250;
    this.context = this.canvas.getContext("2d");
    this.shadowRoot.append(this.styleEl, this.canvas);

    this.fromNode = null;
    this.mouse = [0, 0];

    this.fromInput(...arguments);
    setTimeout(() => this.render());

    this.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && this.parentEditor) {
        this.parentEditor.dispatchEvent(
          new CustomEvent("subEditorDeleted", { detail: this })
        );
        this.blur();
        this.parentEditor.focus();
      } else if (e.key === "ArrowLeft" && this.parentEditor) {
        this.blur();
        this.parentEditor.focus(this, 0, e.shiftKey);
      } else if (e.key === "ArrowRight" && this.parentEditor) {
        this.blur();
        this.parentEditor.focus(this, 1, e.shiftKey);
      } else if (e.key === "Meta") {
        this.currentColor = (this.currentColor + 1) % GRAPH_COLORS.length;
        this.style.setProperty(
          "--editor-color",
          GRAPH_COLORS[this.currentColor]
        );
      }
    });
    this.addEventListener("subEditorDeleted", (e) => {
      this.nodes = this.nodes.filter(({ editor }) => editor !== e.detail);
      for (const node of this.nodes) {
        for (let i = 0; i < GRAPH_COLORS.length; i++) {
          node.adjacent[i] = node.adjacent[i].filter(
            ({ editor }) => editor !== e.detail
          );
        }
      }
      this.shadowRoot.removeChild(e.detail);
      this.render();
      this.focus();
      this.parentEditor?.dispatchEvent(
        new CustomEvent("childEditorUpdate", {
          detail: {
            out: this.getOutput(),
            editor: this,
          },
        })
      );
    });
    this.addEventListener("subEditorClicked", (e) => {
      const subFocus = this.nodes.find(({ editor }) => editor === e.detail[0]);
      if (subFocus) {
        this.fromNode = subFocus; // HACK
      }
    });
    this.addEventListener("mousemove", (e) => {
      this.mouse = [e.offsetX, e.offsetY];
      if (this.fromNode && e.metaKey) {
        this.fromNode.x = Math.max(
          0,
          Math.min(
            this.mouse[0] - 10,
            this.offsetWidth - this.fromNode.editor.offsetWidth - 2
          )
        );
        this.fromNode.y = Math.max(
          0,
          Math.min(
            this.mouse[1] - 10,
            this.offsetHeight - this.fromNode.editor.offsetHeight - 2
          )
        );
      }
      this.render();
    });
    this.addEventListener("mousedown", (e) => {
      const editor = new StringEditorElement({
        parentEditor: this,
        code: String(this.nodes.length).split(""),
      });
      editor.style.position = "absolute";
      const node = {
        x: e.offsetX - 10,
        y: e.offsetY - 10,
        editor,
        adjacent: {
          0: [],
          1: [],
          2: [],
          3: [],
        },
      };
      this.nodes.push(node);
      this.shadowRoot.append(editor);
      this.blur();
      setTimeout(() => editor.focus());
      this.fromNode = node;
      this.render();
      this.parentEditor?.dispatchEvent(
        new CustomEvent("childEditorUpdate", {
          detail: {
            out: this.getOutput(),
            editor: this,
          },
        })
      );
    });
    this.addEventListener("mouseup", (e) => {
      const targetEl = e.path[0];
      const targetNode = this.nodes.find(
        ({ editor }) =>
          editor.contains(targetEl) || editor.shadowRoot.contains(targetEl)
      );
      if (targetNode) {
        if (
          this.fromNode &&
          this.fromNode !== targetNode &&
          !this.fromNode.adjacent[this.currentColor].includes(targetNode)
        ) {
          this.fromNode.adjacent[this.currentColor].push(targetNode);
        }
      }
      this.fromNode = null;
      this.render();
      this.parentEditor?.dispatchEvent(
        new CustomEvent("childEditorUpdate", {
          detail: {
            out: this.getOutput(),
            editor: this,
          },
        })
      );
    });

    const move = () => {
      const middleOfEditor = [this.offsetWidth / 2, this.offsetHeight / 2];

      const forces = [];
      for (let i = 0; i < this.nodes.length; i++) forces[i] = [0, 0];

      for (let i = 0; i < this.nodes.length; i++) {
        const node = this.nodes[i];

        const start = [
          node.x + node.editor.offsetWidth / 2,
          node.y + node.editor.offsetHeight / 2,
        ];

        const dirToMiddle = sub(middleOfEditor, start);
        const distToMiddle = dist(start, middleOfEditor);
        const nudgeToMiddle = mul(0.0005 * distToMiddle, dirToMiddle);
        forces[i] = add(forces[i], nudgeToMiddle);

        for (let j = i + 1; j < this.nodes.length; j++) {
          const otherNode = this.nodes[j];

          const end = [
            otherNode.x + otherNode.editor.offsetWidth / 2,
            otherNode.y + otherNode.editor.offsetHeight / 2,
          ];

          const dir = sub(end, start);
          const mag = dist(start, end);

          let force = mul(node.editor.offsetWidth ** 1.3 / mag ** 2, dir);
          //if (node.adjacent.includes(otherNode)) force = add(force, mul(-mag / 500, dir));

          forces[i] = add(forces[i], mul(-1, force));
          forces[j] = add(forces[j], force);
        }
      }

      for (let i = 0; i < this.nodes.length; i++) {
        const node = this.nodes[i];
        const [x, y] = add([node.x, node.y], forces[i]);
        node.x = x;
        node.y = y;
      }
    };
    move();

    const step = () => {
      this.render();
      move();

      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);

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
  }

  render() {
    this.context.lineWidth = 2;
    this.context.lineCap = "round";
    this.canvas.width = this.offsetWidth;
    this.canvas.height = this.offsetHeight;
    if (this.fromNode) {
      this.context.strokeStyle = GRAPH_COLORS[this.currentColor];
      this.context.beginPath();
      this.context.moveTo(
        this.fromNode.x + this.fromNode.editor.offsetWidth / 2,
        this.fromNode.y + this.fromNode.editor.offsetHeight / 2
      );
      this.context.lineTo(...this.mouse);
      this.context.stroke();
    }
    for (const { x, y, editor, adjacent } of this.nodes) {
      editor.style.top = `${y}px`;
      editor.style.left = `${x}px`;

      const drawConnections = (otherNodes) => {
        for (const otherNode of otherNodes) {
          this.context.beginPath();
          const start = [
            x + editor.offsetWidth / 2,
            y + editor.offsetHeight / 2,
          ];
          const end = [
            otherNode.x + otherNode.editor.offsetWidth / 2,
            otherNode.y + otherNode.editor.offsetHeight / 2,
          ];
          this.context.moveTo(...start);
          this.context.lineTo(...end);
          this.context.stroke();

          const angle = Math.atan2(end[0] - start[0], end[1] - start[1]);
          const dir = [Math.sin(angle), Math.cos(angle)];
          const dist =
            Math.min(
              otherNode.editor.offsetHeight * Math.abs(1 / Math.cos(angle)),
              otherNode.editor.offsetWidth * Math.abs(1 / Math.sin(angle))
            ) / 2; // https://math.stackexchange.com/a/924290/421433
          this.context.beginPath();
          this.context.moveTo(end[0] - dir[0] * dist, end[1] - dir[1] * dist);
          this.context.lineTo(
            end[0] - dir[0] * (dist + 11) + dir[1] * 7,
            end[1] - dir[1] * (dist + 11) - dir[0] * 7
          );
          this.context.stroke();
          this.context.moveTo(end[0] - dir[0] * dist, end[1] - dir[1] * dist);
          this.context.lineTo(
            end[0] - dir[0] * (dist + 11) - dir[1] * 7,
            end[1] - dir[1] * (dist + 11) + dir[0] * 7
          );
          this.context.stroke();
        }
      };
      for (let i = 0; i < GRAPH_COLORS.length; i++) {
        const color = GRAPH_COLORS[i];
        this.context.strokeStyle = color;
        drawConnections(adjacent[i]);
      }
    }
  }

  fromInput(input) {
    if (!input || !input.nodes || !input.edges) return;
    const { nodes, edges } = input;

    for (let i = 0; i < nodes.length; i++) {
      const nodeValue = nodes[i];

      let editor;
      if (nodeValue instanceof HTMLElement) {
        editor = new StringEditorElement({
          code: [nodeValue],
          parentEditor: this,
        });
      } else {
        editor = new StringEditorElement({
          code: [String(nodeValue)],
          parentEditor: this,
        });
      }
      editor.style.position = "absolute";

      this.nodes[i] = {
        x: 100 + i,
        y: 100 + i,
        editor,
        adjacent: {
          0: [],
          1: [],
          2: [],
          3: [],
        },
      };
      this.shadowRoot.append(editor);
    }
    for (let j = 0; j < GRAPH_COLORS.length; j++) {
      for (let i = 0; i < nodes.length; i++) {
        const edgeList = edges[j][i];

        for (const edgeIndex of edgeList) {
          this.nodes[i].adjacent[j].push(this.nodes[edgeIndex]);
        }
      }
    }
  }

  getJSONOutput() {
    let nodes = [];
    let positions = [];
    let edges = {
      0: [],
      1: [],
      2: [],
      3: [],
    };

    for (const [{ editor, x, y, adjacent }, i] of withIndex(this.nodes)) {
      nodes[i] = editor;
      positions[i] = [x, y];

      for (let j = 0; j < GRAPH_COLORS.length; j++) {
        edges[j][i] = [];
        for (const otherNode of adjacent[j]) {
          const otherNodeIndex = this.nodes.findIndex((n) => n === otherNode);
          edges[j][i].push(otherNodeIndex);
        }
      }
    }

    return {
      isColoredGraph: true,
      nodes,
      edges,
      positions,
    };
  }

  getOutput() {
    const { nodes, edges, positions } = this.getJSONOutput();
    return `(${JSON.stringify({
      nodes: nodes.map((node) => node.getOutput().split('"').join("")),
      edges,
      positions,
      isColoredGraph: true,
    })})`;
  }
}

export const DropdownElement = (editorDescriptions, name = "no-name") => {
  class C extends TextEditorElement {
    selection = 0;

    constructor() {
      super(...arguments);

      this.style.setProperty("--editor-name", `'dropdown'`);
      this.style.setProperty("--editor-color", "grey");
      this.style.setProperty("--editor-name-color", "black");
      this.style.setProperty("--editor-background-color", "#FEFEFE");
      this.style.setProperty("--editor-outline-color", "grey");

      this.styleEl = document.createElement("style");
      this.styleEl.textContent = `
                .dropdown {
                    display: none;
                }
                .dropdown pre {
                    margin: 0;
                    padding: 10px;
                }
                .dropdown pre:hover {
                    background: #ffd608;

                }
                :host(:focus) .dropdown {
                    display: block;
                    position: absolute;
                    top: 100%;
                    left: -2px;
                    margin: 0;
                    background: #FEFEFE;
                    z-index: 100;
                    border-radius: 2px;
                    border: 2px solid grey;
                }
            `;
      this.dropdownEl = document.createElement("div");
      this.dropdownEl.className = "dropdown";
      this.editorEls = editorDescriptions.map(
        ({ name, description, iconPath, ElementConstructor }) => {
          const editorEl = document.createElement("pre");
          editorEl.innerHTML =
            (iconPath ? `<img src="${iconPath}" height="32"> ` : "") +
            `${name}
${description}`;
          editorEl.addEventListener("click", () => {
            if (this.parentEditor) {
              this.parentEditor.dispatchEvent(
                new CustomEvent("subEditorReplaced", {
                  detail: {
                    old: this,
                    new: new ElementConstructor({
                      parentEditor: this.parentEditor,
                    }),
                  },
                })
              );
            }
          });
          return editorEl;
        }
      );
      this.dropdownEl.append(...this.editorEls);
      this.shadowRoot.append(this.styleEl, this.dropdownEl);

      this.addEventListener("blur", () => (this.code = []));
      this.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          this.selection = mod(this.selection + 1, this.editorEls.length);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          this.selection = mod(this.selection - 1, this.editorEls.length);
        }
        for (const [editorEl, i] of withIndex(this.editorEls)) {
          if (i === this.selection) editorEl.style.background = "#ffd608";
          else editorEl.style.background = "#FEFEFE";
        }
        if (e.key === "Enter") {
          if (this.parentEditor) {
            this.parentEditor.dispatchEvent(
              new CustomEvent("subEditorReplaced", {
                detail: {
                  old: this,
                  new: new editorDescriptions[
                    this.selection
                  ].ElementConstructor({ parentEditor: this.parentEditor }),
                },
              })
            );
          }
        }
      });
      for (const [editorEl, i] of withIndex(this.editorEls)) {
        if (i === this.selection) editorEl.style.background = "#ffd608";
        else editorEl.style.background = "#FEFEFE";
      }
    }

    getOutput() {
      return "";
    }
  }

  customElements.define(`dropdown-${name}-editor`, C);
  return C;
};

function mod(x, m) {
  return ((x % m) + m) % m;
}
function round([a, b]) {
  return [Math.round(a), Math.round(b)];
}
function dist([a, b], [c, d]) {
  return Math.sqrt((a - c) ** 2 + (b - d) ** 2);
}
function mul(l, [a, b]) {
  return [a * l, b * l];
}
function add([a, b], [c, d]) {
  return [a + c, b + d];
}
function sub([a, b], [c, d]) {
  return [a - c, b - d];
}
function lerp([a, b], [c, d], l) {
  return [a * (1 - l) + c * l, b * (1 - l) + d * l];
}

customElements.define("text-editor", TextEditorElement);
customElements.define("string-editor", StringEditorElement);
customElements.define("force-graph-editor", ForceGraphEditorElement);
customElements.define("color-graph-editor", ColoredGraphEditorElement);
customElements.define(
  "force-color-graph-editor",
  ForceColoredGraphEditorElement
);
customElements.define("polytope-editor", EditorElement);
