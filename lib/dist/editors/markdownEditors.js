import { TextEditorElement } from "./TextEditorElement.js";
import { UnaryJoinerElement } from "./mathEditors.js";
export class MarkdownEditorElement extends TextEditorElement {
    static meta = {
        editorName: "Markdown",
    };
    constructor(arg) {
        super(arg);
        this.style.setProperty("--editor-name", `'markdown'`);
        this.style.setProperty("--editor-color", "#376e32");
        this.style.setProperty("--editor-name-color", "#c1f2bd");
        this.style.setProperty("--editor-background-color", "#c1f2bd");
        this.style.setProperty("--editor-outline-color", "#376e32");
    }
    keyHandler(e) {
        if (e.key === "-") {
            // no elevations
            const focuser = new BulletJoinerElement({ parentEditor: this });
            this.code.splice(this.caret, 0, "\n", focuser);
            return focuser;
        }
        if (e.key === "#") {
            // no elevations
            const focuser = new HeaderElement({ parentEditor: this });
            this.code.splice(this.caret, 0, focuser);
            return focuser;
        }
    }
    getOutput() {
        const sOut = super.getOutput();
        return sOut
            .split("\n")
            .map((line) => "// " + line)
            .join("\n");
    }
}
customElements.define("markdown-editor", MarkdownEditorElement);
class HeaderElement extends TextEditorElement {
    meta = {
        editorName: "Markdown #",
    };
    constructor(arg) {
        super(arg);
        this.style.setProperty("--editor-name", `'markdown'`);
        this.style.setProperty("--editor-color", "#376e32");
        this.style.setProperty("--editor-name-color", "#c1f2bd");
        this.style.setProperty("--editor-background-color", "#c1f2bd");
        this.style.setProperty("--editor-outline-color", "#376e32");
        this.style.setProperty("font-weight", "900");
        this.style.setProperty("font-size", "40px");
        this.style.setProperty("padding", "10px");
    }
    keyHandler(e) {
        if (e.key === "Enter") {
            this.parentEditor.focusEditor(this, 1);
            this.parentEditor.code.splice(this.parentEditor.caret, 0, "\n");
            this.parentEditor.focusEditor(this, 1);
        }
        return null;
    }
    getOutput() {
        return `# ${super.getOutput()}`;
    }
}
customElements.define("markdown-header-inner-editor", HeaderElement);
class BulletJoinerInnerElement extends TextEditorElement {
    meta = {
        editorName: "Markdown -",
    };
    constructor(arg) {
        super(arg);
        this.style.setProperty("--editor-name", `'markdown'`);
        this.style.setProperty("--editor-color", "#376e32");
        this.style.setProperty("--editor-name-color", "#c1f2bd");
        this.style.setProperty("--editor-background-color", "#c1f2bd");
        this.style.setProperty("--editor-outline-color", "#376e32");
    }
    keyHandler(e) {
        if (e.key === "Enter") {
            this.parentEditor.parentEditor.focusEditor(this.parentEditor, 1);
            const focuser = new BulletJoinerElement({
                parentEditor: this.parentEditor.parentEditor,
            });
            this.parentEditor.parentEditor.code.splice(this.parentEditor.parentEditor.caret, 0, "\n", focuser);
            this.parentEditor.parentEditor.focusEditor(this.parentEditor, 1);
            setTimeout(() => focuser.focusEditor(this.parentEditor.parentEditor, 1));
        }
        return null;
    }
}
customElements.define("markdown-bullet-inner-editor", BulletJoinerInnerElement);
export const BulletJoinerElement = class extends UnaryJoinerElement("bullet", BulletJoinerInnerElement, (editor) => {
    const styleEl = document.createElement("style");
    styleEl.textContent = `
            :host {
                display: inline-flex;
                align-items: stretch;
                vertical-align: middle;
                align-items: center;
                padding: 10px;
                gap: 5px;
            }
            span{
                height: 6px;
                width: 6px;
                border-radius: 100%;
                background: black;
            }
        `;
    const bulletEl = document.createElement("span");
    return [styleEl, bulletEl, editor];
}) {
    getOutput() {
        return `- ${this.editor.getOutput()}`;
    }
};
customElements.define("markdown-bullet-editor", BulletJoinerElement);
