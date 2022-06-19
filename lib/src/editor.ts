export type EditorArgumentObject = {
  parentEditor?: EditorElement;
  builder?: (input: string) => { output: EditorElement };
};

export class EditorElement extends HTMLElement {
  meta?: {
    editorName?: string;
  };
  parentEditor?: EditorElement = undefined;
  builder?: (input: string) => { output: EditorElement };
  isFocused = false;

  constructor(
    { parentEditor, builder }: EditorArgumentObject = {
      parentEditor: undefined,
    }
  ) {
    super();

    this.builder = builder;

    this.parentEditor = parentEditor;

    this.attachShadow({ mode: "open" });

    const paletteEl = document.createElement("div");
    paletteEl.className = "palette";

    // EXPERIMENTAL CODE
    const butEl = document.createElement("span");
    butEl.className = "but";
    butEl.innerText = "↑eval↑";
    butEl.addEventListener("click", async () => {
      const [{ ConstructiveUnidirectionalEditor }, { TextEditorElement }] =
        await Promise.all([
          import("./editors/bidirectional_editor_pair.js"),
          import("./editors/TextEditorElement.js"),
        ]);

      const LiftedEval = ConstructiveUnidirectionalEditor({
        leftEditorFactory: (a, me) =>
          new TextEditorElement({ parentEditor: me, code: [this] }),
        leftEditorOutput: (editor) => editor.getOutput(),
        name: Math.random().toFixed(4).toString(),
      });

      this.parentEditor?.dispatchEvent(
        new CustomEvent("subEditorReplaced", {
          detail: {
            old: this,
            new: new LiftedEval({
              parentEditor: this.parentEditor,
              builder: this.builder,
            }),
          },
        })
      );
    });
    // EXPERIMENTAL CODE END

    setTimeout(
      () => (
        (paletteEl.innerText = this.meta?.editorName ?? "editor"),
        paletteEl.append(butEl)
      )
    );

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
            .but {
              display: inline-block;
              cursor: pointer;
              opacity: 0.8;
              padding: 2px;
              margin: 1px 1px 1px 6px;
              background: var(--editor-name-color);
              color: var(--editor-color);
              border-radius: 0 0 3px 3px;
            }
            .but:hover {
              opacity: 1;
            }
            .palette {
              display: none;
            }
            :host(:focus) .palette {
                display: block;
                font-size: 14px;
                padding: 1px 2px 2px 8px;
                background: var(--editor-color);
                color: var(--editor-name-color);
                position: absolute;
                bottom: -24px;
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
    this.shadowRoot.append(styleEl, paletteEl);

    if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");

    this.addEventListener("focus", (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.isFocused = true;
    });
    this.addEventListener("subEditorClicked", (e: CustomEvent) => {
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

  focusEditor(
    fromEl?: HTMLElement,
    position?: 1 | 0 | -1 | undefined,
    isSelecting?: boolean
  ): void {
    this.focus({ preventScroll: true });
  }

  getOutput() {
    return "";
  }
}

// editorDescription: [{
//     name: string;
//     description: string;
//     iconPath: string;
//     ElementConstructor: HTMLElement;
// }]

customElements.define("polytope-editor", EditorElement);
