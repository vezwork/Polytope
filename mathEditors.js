import { TextEditorElement } from "./lib/dist/editors/TextEditorElement.js";

export class MathEditorElement extends TextEditorElement {
  constructor() {
    super(...arguments);

    this.style.setProperty("--editor-name", `'math'`);
    this.style.setProperty("--editor-color", "#FFD600");
    this.style.setProperty("--editor-name-color", "black");
    this.style.setProperty("--editor-background-color", "#fff7cf");
    this.style.setProperty("--editor-outline-color", "#fff1a8");
  }

  keyHandler(e) {
    if (e.key === "/") {
      // elevate left and right (non commutative)
      const pre = this.code.slice(0, this.caret);
      const post = this.code.slice(this.caret, this.code.length);
      const focuser = new DivJoinerElement({
        parentEditor: this,
        leftCode: pre,
        rightCode: post,
      });
      this.code = [focuser];
      return focuser;
    } else if (e.key === "+") {
      // elevate left and right
      const pre = this.code.slice(0, this.caret);
      const post = this.code.slice(this.caret, this.code.length);
      const focuser = new PlusJoinerElement({
        parentEditor: this,
        leftCode: pre,
        rightCode: post,
      });
      this.code = [focuser];
      return focuser;
    } else if (e.key === "*") {
      // elevate left and right
      const pre = this.code.slice(0, this.caret);
      const post = this.code.slice(this.caret, this.code.length);
      const focuser = new MulJoinerElement({
        parentEditor: this,
        leftCode: pre,
        rightCode: post,
      });
      this.code = [focuser];
      return focuser;
    } else if (e.key === "-") {
      // elevate left and right
      const pre = this.code.slice(0, this.caret);
      const post = this.code.slice(this.caret, this.code.length);
      const focuser = new SubJoinerElement({
        parentEditor: this,
        leftCode: pre,
        rightCode: post,
      });
      this.code = [focuser];
      return focuser;
    } else if (e.key === "^") {
      // elevate left and right (non commutative)
      const pre = this.code.slice(0, this.caret);
      const post = this.code.slice(this.caret, this.code.length);
      const focuser = new ExpJoinerElement({
        parentEditor: this,
        leftCode: pre,
        rightCode: post,
      });
      this.code = [focuser];
      return focuser;
    } else if (e.key === "√") {
      // no elevations
      const focuser = new RadicalJoinerElement({ parentEditor: this });
      this.code.splice(this.caret, 0, focuser);
      return focuser;
    } else if (e.key === "[") {
      const pre = this.code.slice(0, this.caret);
      const post = this.code.slice(this.caret, this.code.length);
      const focuser = new MatrixJoinerElement({
        parentEditor: this,
        code2DArray: [
          [pre, post],
          [[], []],
        ],
      });
      this.code = [...pre, focuser];
      return focuser;
    }
  }
}
customElements.define("math-editor", MathEditorElement);

export const UnaryJoinerElement = (outputFuncName, Editor, createElements) => {
  class C extends HTMLElement {
    parentEditor = undefined;
    constructor({ parentEditor, code = [] } = {}) {
      super();
      //if (!parentEditor) throw `No parent editor on unary ${outputFuncName} joiner element`;
      this.parentEditor = parentEditor;

      this.editor = new Editor({ parentEditor: this, code });

      this.attachShadow({ mode: "open" });
      this.shadowRoot.append(...createElements(this.editor));

      this.addEventListener("focus", (e) => {
        e.stopPropagation();
        this.focus();
      });
      //this.addEventListener('blur', (e) => e.stopPropagation());
      this.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        this.focus();
      });
      this.addEventListener("mousemove", (e) => e.stopPropagation());
      //this.addEventListener('keydown', (e) => e.stopPropagation());
      this.addEventListener("childEditorUpdate", (e) => {
        this.parentEditor?.dispatchEvent(
          new CustomEvent("childEditorUpdate", { detail: this.getOutput() })
        );
      });
    }

    focusEditor(fromEl, position, isSelecting) {
      super.focus();

      if (fromEl !== undefined && position !== undefined) {
        if (fromEl === this.editor) {
          // case: entering from leftEditor
          if (position === 1) {
            this.blur();
            this.parentEditor.focusEditor(this, 1, false);
          }
          if (position === 0) {
            this.blur();
            this.parentEditor.focusEditor(this, 0, false);
          }
          return;
        }

        if (position === 1) {
          // case: entering from a parent on the left
          this.blur();
          this.editor.focusEditor(this, 1, false);
        }
        if (position === 0) {
          // case: entering from a parent on the right
          this.blur();
          this.editor.focusEditor(this, 0, false);
        }
        return;
      }
      this.blur();
      this.editor.focusEditor(this, 1, false);
    }

    getOutput() {
      return `${outputFuncName}(${this.editor.getOutput()})`;
    }
  }

  customElements.define(`${outputFuncName}-unary-joiner-editor`, C);
  return C;
};

export const BinaryJoinerElement = (
  outputFuncName,
  LeftEditor,
  RightEditor,
  createElements
) => {
  class C extends HTMLElement {
    parentEditor = undefined;
    constructor({ parentEditor, leftCode = [], rightCode = [] } = {}) {
      super();
      //if (!parentEditor) throw `No parent editor on binary ${outputFuncName} joiner element`;
      this.parentEditor = parentEditor;

      this.leftEditor = new LeftEditor({ parentEditor: this, code: leftCode });
      this.rightEditor = new RightEditor({
        parentEditor: this,
        code: rightCode,
      });

      this.attachShadow({ mode: "open" });
      this.shadowRoot.append(
        ...createElements(this.leftEditor, this.rightEditor)
      );

      this.addEventListener("focus", (e) => {
        e.stopPropagation();
        this.focus();
      });
      //this.addEventListener('blur', (e) => e.stopPropagation());
      this.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        this.focus();
      });
      //this.addEventListener('keydown', (e) => e.stopPropagation());
      this.addEventListener("childEditorUpdate", (e) => {
        this.parentEditor?.dispatchEvent(
          new CustomEvent("childEditorUpdate", { detail: this.getOutput() })
        );
      });
    }

    focusEditor(fromEl, position, isSelecting) {
      super.focus();

      // TODO: add handling for backspace out of right editor

      if (fromEl !== undefined && position !== undefined) {
        if (fromEl === this.leftEditor) {
          // case: entering from leftEditor
          if (position === 1) {
            this.blur();
            this.rightEditor.focusEditor(this, 1, false);
          }
          if (position === 0) {
            this.blur();
            this.parentEditor.focusEditor(this, 0, false);
          }
          return;
        } else if (fromEl === this.rightEditor) {
          // case: entering from rightEditor
          if (position === 1) {
            this.blur();
            this.parentEditor.focusEditor(this, 1, false);
          }
          if (position === 0) {
            this.blur();
            this.leftEditor.focusEditor(this, 0, false);
          }
          return;
        }

        if (position === 1) {
          // case: entering from a parent on the left
          this.blur();
          this.leftEditor.focusEditor(this, 1, false);
        }
        if (position === 0) {
          // case: entering from a parent on the right
          this.blur();
          this.rightEditor.focusEditor(this, 0, false);
        }
        return;
      }
      this.blur();
      this.rightEditor.focusEditor(this, 1, false);
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
            // TODO: make this a generic Editor
            parentEditor: this,
            code: code2DArray[x][y],
          });
        }
      }

      this.attachShadow({ mode: "open" });
      this.shadowRoot.append(...createElements(this.editor2DArray));

      this.addEventListener("focus", (e) => {
        e.stopPropagation();
        this.focus();
      });
      //this.addEventListener('blur', (e) => e.stopPropagation());
      this.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        this.focus();
      });
      //this.addEventListener('keydown', (e) => e.stopPropagation());
      this.addEventListener("childEditorUpdate", (e) => {
        this.parentEditor?.dispatchEvent(
          new CustomEvent("childEditorUpdate", { detail: this.getOutput() })
        );
      });
    }

    focusEditor(fromEl, position, isSelecting) {
      super.focus();

      // TODO: add handling for backspace out of right editor
      const width = this.editor2DArray.length;
      const height = this.editor2DArray[0].length;

      if (fromEl !== undefined && position !== undefined) {
        let x;
        let y;
        let found = false;

        outerLoop: for (x = 0; x < this.editor2DArray.length; x++) {
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
              this.parentEditor.focusEditor(this, 1, false);
            } else {
              this.editor2DArray[x][y].focusEditor(this, 1, false);
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
              this.parentEditor.focusEditor(this, 0, false);
            } else {
              this.editor2DArray[x][y].focusEditor(this, 1, false);
            }
          }
          return;
        }

        if (position === 1) {
          // case: entering from a parent on the left
          this.editor2DArray[0][0].focusEditor(this, 1, false);
        }
        if (position === 0) {
          // case: entering from a parent on the right
          this.editor2DArray[width - 1][height - 1].focusEditor(this, 0, false);
        }
        return;
      }
      this.editor2DArray[width - 1][height - 1].focusEditor(this, 0, false);
    }

    getOutput() {
      const outputs =
        "[" +
        this.editor2DArray
          .map(
            (editor1DArray) =>
              "[" +
              editor1DArray.map((editor) => editor.getOutput()).join(",") +
              "]"
          )
          .join(",") +
        "]";
      return `${outputFuncName}(${outputs})`;
    }
  }

  customElements.define(`${outputFuncName}-grid-joiner-editor`, C);
  return C;
};

export const DivJoinerElement = BinaryJoinerElement(
  "div",
  MathEditorElement,
  MathEditorElement,
  (leftEditor, rightEditor) => {
    const styleEl = document.createElement("style");
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
    const divEl = document.createElement("div");
    return [styleEl, leftEditor, divEl, rightEditor];
  }
);

export const Vec2JoinerElement = BinaryJoinerElement(
  "vec2",
  MathEditorElement,
  MathEditorElement,
  (leftEditor, rightEditor) => {
    const styleEl = document.createElement("style");
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
  }
);

export const MatrixJoinerElement = GridJoinerElement(
  "matrix",
  (editor2DArray) => {
    const styleEl = document.createElement("style");
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

    return [
      styleEl,
      ...editor2DArray.map((cur) => {
        const columnEl = document.createElement("span");
        columnEl.append(...cur);
        return columnEl;
      }),
    ];
  }
);

export const ConstructBinarySymbolJoinerElement = (
  outputFuncName,
  LeftEditor,
  symbol,
  RightEditor
) =>
  BinaryJoinerElement(
    outputFuncName,
    LeftEditor,
    RightEditor,
    (leftEditor, rightEditor) => {
      const plusEl = document.createElement("span");
      plusEl.textContent = symbol;
      return [leftEditor, plusEl, rightEditor];
    }
  );

export const ConstructExpJoinerElement = (
  outputFuncName,
  LeftEditor,
  RightEditor
) =>
  BinaryJoinerElement(
    outputFuncName,
    LeftEditor,
    RightEditor,
    (leftEditor, rightEditor) => {
      const styleEl = document.createElement("style");
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
      leftEditor.className = "left";
      rightEditor.className = "right";
      return [styleEl, leftEditor, rightEditor];
    }
  );

export const RadicalJoinerElement = UnaryJoinerElement(
  "sqrt",
  MathEditorElement,
  (editor) => {
    const styleEl = document.createElement("style");
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
    const objEl = document.createElement("img");
    objEl.src = "./assets/radical.svg";
    const rootEditorWrapperEl = document.createElement("span");
    rootEditorWrapperEl.append(editor);
    return [styleEl, objEl, rootEditorWrapperEl];
  }
);

export const ExpJoinerElement = ConstructExpJoinerElement(
  "exp",
  MathEditorElement,
  MathEditorElement
);
export const PlusJoinerElement = ConstructBinarySymbolJoinerElement(
  "plus",
  MathEditorElement,
  "+",
  MathEditorElement
);
export const MulJoinerElement = ConstructBinarySymbolJoinerElement(
  "mul",
  MathEditorElement,
  "·",
  MathEditorElement
);
export const SubJoinerElement = ConstructBinarySymbolJoinerElement(
  "sub",
  MathEditorElement,
  "-",
  MathEditorElement
);
