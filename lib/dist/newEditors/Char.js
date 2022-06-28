import { EditorElement, ExitEditorDirection, } from "../editor.js";
export class CharEditorElement extends EditorElement {
    static meta = {
        name: "char",
        isStyled: false,
        customElementTag: "char-editor",
    };
    char;
    constructor(args) {
        super(...arguments);
        this.char = args.char;
        this.shadowRoot.append(this.char);
        this.addEventListener("keydown", (e) => {
            if (e.key.length === 1) {
                this.after(new CharEditorElement({
                    parentEditor: this.parentEditor,
                    char: e.key,
                }));
                this.parentEditor?.focusFromChildEditor({
                    childEditor: this,
                    direction: ExitEditorDirection.right,
                });
            }
        });
    }
    getOutput = () => this.char;
}
customElements.define(CharEditorElement.meta.customElementTag, CharEditorElement);
