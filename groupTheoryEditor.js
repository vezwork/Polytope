import { TextEditorElement } from "http://localhost:8080/lib/editor.js";
import { ConstructBinarySymbolJoinerElement, ConstructExpJoinerElement } from "http://localhost:8080/mathEditors.js"

export const GroupAlgebraEditor = (name) => {
    class C extends TextEditorElement {
        constructor() {
            super(...arguments);

            this.style.setProperty('--editor-name', `'group algebra'`);
            this.style.setProperty('--editor-color', '#FFD600');
            this.style.setProperty('--editor-name-color', 'black');
            this.style.setProperty('--editor-background-color', '#fff7cf');
            this.style.setProperty('--editor-outline-color', '#fff1a8');
        }

        keyHandler(e) {
            if (e.key === '*') {
                // elevate left and right
                const pre = this.code.slice(0, this.caret);
                const post = this.code.slice(this.caret, this.code.length);
                const focuser = new MulJoinerElement({ parentEditor: this, leftCode: pre, rightCode: post });
                this.code = [focuser];
                return focuser;
            } else if (e.key === '^') {
                // elevate left and right (non commutative)
                const pre = this.code.slice(0, this.caret);
                const post = this.code.slice(this.caret, this.code.length);
                const focuser = new ExpJoinerElement({ parentEditor: this, leftCode: pre, rightCode: post });
                this.code = [focuser];
                return focuser;
            }
        }
    }
    customElements.define(`${name}-group-algebra-editor`, C);

    const ExpJoinerElement = ConstructExpJoinerElement(`${name}.exponentiate`, C, C);
    const MulJoinerElement = ConstructBinarySymbolJoinerElement(`${name}.action`, C, '·', C);

    return C;
};

export const GroupZ3AlgebraEditor = GroupAlgebraEditor('z3');
export const GroupA4AlgebraEditor = GroupAlgebraEditor('a4');
