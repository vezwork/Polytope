import { withIndex } from "../Iterable.js";
import { mod } from "../math.js";
import { TextEditorElement } from "./TextEditorElement.js";

export const DropdownElement = (editorDescriptions, name = "no-name") => {
  class C extends TextEditorElement {
    meta = {
      editorName: name,
    };
    selection = 0;

    dropdownEl: HTMLDivElement;
    editorEls: Array<HTMLPreElement>;

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
                      builder: this.builder,
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
                  ].ElementConstructor({
                    parentEditor: this.parentEditor,
                    builder: this.builder,
                  }),
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
