import { EditorArgumentObject, EditorElement } from "../editor.js";
import { CharEditorElement } from "./Char.js";

export class ArrayEditorElement extends EditorElement {
  static meta = {
    name: "char array",
    isStyled: true,
    customElementTag: "char-array-editor",
  };

  chars: string[];
  startCaret: CharEditorElement = new CharEditorElement({
    parentEditor: this,
    char: "",
  });

  constructor(args: EditorArgumentObject & { chars: string[] }) {
    super(...arguments);
    this.chars = args.chars;

    this.append(this.startCaret);
    for (const char of args.chars) {
      this.append(new CharEditorElement({ parentEditor: this, char }));
    }
  }

  deleteChildEditor(editor: EditorElement) {
    if (editor === this.startCaret) {
      this.parentEditor?.deleteBeforeChildEditor(this);
    } else {
      super.deleteChildEditor(editor);
    }
  }
}
customElements.define(
  ArrayEditorElement.meta.customElementTag,
  ArrayEditorElement
);
