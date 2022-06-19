import { withIndex } from "../Iterable.js";
import { TextEditorElement, } from "./TextEditorElement.js";
export class StringEditorElement extends TextEditorElement {
    meta = {
        editorName: "String",
    };
    constructor(arg) {
        super(arg);
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
            }
            else {
                const slot = slotOrChar;
                output += slot.getOutput();
            }
        }
        return output + '"';
    }
}
customElements.define("string-editor", StringEditorElement);
