import { ArrayEditorElement } from "./ArrayEditorElement.js";

export class CharArrayEditorElement extends ArrayEditorElement<string> {
  static meta = {
    editorName: "Char Array",
  };

  onCaretMoveOverContentItem(contentItems: Array<string>) {
    //console.log(contentItems);
  }

  keyHandler(e: KeyboardEvent): boolean {
    if (e.key.length === 1) {
      this.insert([e.key]);
      this.render();
      return true;
    }
    return false; // override me!
  }

  processClipboardText(clipboardText: string): Array<string> {
    return clipboardText.split(""); // override me!
  }
}
customElements.define("char-array-editor", CharArrayEditorElement);
