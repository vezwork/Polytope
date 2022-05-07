/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "EditorElement": () => (/* binding */ EditorElement)
/* harmony export */ });
class EditorElement extends HTMLElement {
    constructor({ parentEditor } = {
        parentEditor: undefined,
    }) {
        super();
        this.parentEditor = undefined;
        this.isFocused = false;
        this.parentEditor = parentEditor;
        this.attachShadow({ mode: "open" });
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
            :host(:focus)::before {
                content: var(--editor-name);
                font-size: 14px;
                padding: 1px 8px 2px 8px;
                background: var(--editor-color);
                color: var(--editor-name-color);
                position: absolute;
                bottom: -17px;
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
        this.shadowRoot.append(styleEl);
        if (!this.hasAttribute("tabindex"))
            this.setAttribute("tabindex", "0");
        this.addEventListener("focus", (e) => {
            e.stopPropagation();
            this.isFocused = true;
        });
        this.addEventListener("subEditorClicked", (e) => {
            var _a;
            (_a = this.parentEditor) === null || _a === void 0 ? void 0 : _a.dispatchEvent(new CustomEvent("subEditorClicked", { detail: [this, ...e.detail] }));
        });
        this.addEventListener("blur", (e) => {
            e.stopPropagation();
            this.isFocused = false;
        });
        this.addEventListener("mousedown", (e) => {
            var _a;
            e.stopPropagation();
            (_a = this.parentEditor) === null || _a === void 0 ? void 0 : _a.dispatchEvent(new CustomEvent("subEditorClicked", { detail: [this] }));
            this.focus();
            this.isFocused = true;
        });
        this.addEventListener("keydown", (e) => e.stopPropagation());
    }
    get javaScriptCode() {
        return "";
    }
    focusEditor(fromEl, position, isSelecting) {
        super.focus();
    }
}
// editorDescription: [{
//     name: string;
//     description: string;
//     iconPath: string;
//     ElementConstructor: HTMLElement;
// }]
customElements.define("polytope-editor", EditorElement);

/******/ })()
;