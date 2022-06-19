import { ArrayEditorElement } from "./ArrayEditorElement.js";
export class CharArrayEditorElement extends ArrayEditorElement {
    meta = {
        editorName: "Char Array",
    };
    onCaretMoveOverContentItem(contentItems) {
        //console.log(contentItems);
    }
    keyHandler(e) {
        if (e.key.length === 1) {
            this.insert([e.key]);
            this.render();
            return true;
        }
        return false; // override me!
    }
    processClipboardText(clipboardText) {
        return clipboardText.split(""); // override me!
    }
}
customElements.define("char-array-editor", CharArrayEditorElement);
