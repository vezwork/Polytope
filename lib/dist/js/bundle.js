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
/* harmony export */   "EditorElement": () => (/* binding */ EditorElement),
/* harmony export */   "EnterEditorDirection": () => (/* binding */ EnterEditorDirection),
/* harmony export */   "ExitEditorDirection": () => (/* binding */ ExitEditorDirection)
/* harmony export */ });
Object(function webpackMissingModule() { var e = new Error("Cannot find module './closestElement.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }());

var ExitEditorDirection;
(function (ExitEditorDirection) {
    ExitEditorDirection[ExitEditorDirection["up"] = 0] = "up";
    ExitEditorDirection[ExitEditorDirection["right"] = 1] = "right";
    ExitEditorDirection[ExitEditorDirection["down"] = 2] = "down";
    ExitEditorDirection[ExitEditorDirection["left"] = 3] = "left";
})(ExitEditorDirection || (ExitEditorDirection = {}));
var EnterEditorDirection;
(function (EnterEditorDirection) {
    EnterEditorDirection[EnterEditorDirection["up"] = 0] = "up";
    EnterEditorDirection[EnterEditorDirection["right"] = 1] = "right";
    EnterEditorDirection[EnterEditorDirection["down"] = 2] = "down";
    EnterEditorDirection[EnterEditorDirection["left"] = 3] = "left";
})(EnterEditorDirection || (EnterEditorDirection = {}));
class EditorElement extends HTMLElement {
    static meta;
    parentEditor() {
        // could be optimizing it by caching it against the parent element?
        return this.parentElement.closest("[isEditor=true]");
    }
    rootEditor() {
        let curAncestor = this;
        while (true) {
            if (curAncestor.parentEditor)
                curAncestor = curAncestor.parentEditor();
            else
                return curAncestor;
        }
    }
    descendentEditors() {
        return Array.from(this.querySelectorAll(`[isEditor=true]`));
    }
    childEditors() {
        const descendents = this.descendentEditors();
        return descendents.filter((editor) => !descendents.includes(editor.parentEditor()));
    }
    // spatial vertical nav
    childAbove(childEditor) {
        return Object(function webpackMissingModule() { var e = new Error("Cannot find module './closestElement.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())(childEditor, this.childEditors(), this.carryX);
    }
    childBelow(childEditor) {
        return Object(function webpackMissingModule() { var e = new Error("Cannot find module './closestElement.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())(childEditor, this.childEditors(), this.carryX);
    }
    // html tree ordered horizontal nav
    childAfter(childEditor) {
        const childEditors = this.childEditors();
        return childEditors[childEditors.indexOf(childEditor) + 1] ?? null;
    }
    childBefore(childEditor) {
        const childEditors = this.childEditors();
        return childEditors[childEditors.indexOf(childEditor) - 1] ?? null;
    }
    // distance to entire child bounding boxes or to just `this`'s right side
    closestSinkToPosition(position) {
        return Object(function webpackMissingModule() { var e = new Error("Cannot find module './closestElement.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())(this, this.childEditors(), position);
    }
    isRootEditor() {
        return this.parentEditor() === null;
    }
    isChildEditor() {
        return !this.isRootEditor();
    }
    isParentEditor() {
        return this.childEditors().length > 0;
    }
    isLeafEditor() {
        return !this.isParentEditor();
    }
    isFocused() {
        return this.getAttribute("isFocused") === "true";
    }
    constructor() {
        super();
        // const meta = (this.constructor as typeof EditorElement).meta;
        this.setAttribute("isEditor", "true");
        this.attachShadow({ mode: "open" });
        const baseStyleEl = document.createElement("style");
        baseStyleEl.textContent = `
        :host {
          contain: paint; 

          display: inline-block;
  
          user-select: none;
  
          min-height: 1.5rem;
          min-width: 0.4rem;

          padding: 5px;
          margin: 5px;
          border: 2px solid YellowGreen;
          /* border-right: 2px solid transparent; */
        }
        :host(:focus) {
          outline: none;
        }
        :host([isFocused=true]) { /* browser :focus happens if children are focused too :( */
          border-right: 2px solid black;
        }
      `;
        this.shadowRoot.append(baseStyleEl, document.createElement("slot"));
        if (!this.hasAttribute("tabindex"))
            this.setAttribute("tabindex", "0"); // make tabbable by default
        // focus
        this.addEventListener("focusout", (e) => this.makeUnfocused());
        this.addEventListener("focus", (e) => {
            e.stopPropagation();
            this.makeFocused();
        });
        this.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            this.makeFocused();
        });
        this.addEventListener("keydown", (e) => {
            if (e.key.startsWith("Arrow")) {
                this.isParentEditor()
                    ? this.parentOnInputArrow(e)
                    : this.leafOnInputArrow(e);
            }
        });
    }
    parentOnInputArrow(e) {
        if (e.key === "ArrowLeft") {
            const childEditors = this.childEditors();
            const lastChildEditor = childEditors[childEditors.length - 1];
            lastChildEditor.focusFromParentEditor({
                direction: EnterEditorDirection.right,
            });
        }
        else {
            this.parentEditor()?.focusFromChildEditor({
                childEditor: this,
                direction: exitEditorDirectionFromKey(e.key),
                x: this.carryX ?? this.getBoundingClientRect().right,
            });
        }
        e.stopPropagation();
    }
    leafOnInputArrow(e) {
        this.parentEditor()?.focusFromChildEditor({
            childEditor: this,
            direction: exitEditorDirectionFromKey(e.key),
            x: this.carryX ?? this.getBoundingClientRect().right,
        });
        e.stopPropagation();
    }
    carryX = null;
    focusFromChildEditor(args) {
        console.debug("focusFromChildEditor", this, args);
        const { childEditor, direction } = args;
        const childEditors = this.childEditors();
        const focusFromIndex = childEditors.indexOf(childEditor);
        if (focusFromIndex === -1)
            throw "focusFromChildEditor: childEditor was not found in the parent";
        if (direction === ExitEditorDirection.up ||
            direction === ExitEditorDirection.down) {
            this.carryX = args.x;
        }
        const toChild = {
            [ExitEditorDirection.up]: this.childAbove(childEditor),
            [ExitEditorDirection.right]: this.childAfter(childEditor),
            [ExitEditorDirection.down]: this.childBelow(childEditor),
            [ExitEditorDirection.left]: this.childBefore(childEditor),
        }[direction];
        if (toChild) {
            toChild.focusFromParentEditor({
                direction: enterDirectionFromExitDirection(direction),
                x: this.carryX ?? childEditor.getBoundingClientRect().right,
            });
        }
        else {
            if (direction === ExitEditorDirection.right) {
                this.makeFocused();
            }
            else {
                this.parentEditor()?.focusFromChildEditor({
                    childEditor: this,
                    direction,
                    x: this.carryX ?? this.getBoundingClientRect().right,
                });
            }
        }
    }
    focusFromParentEditor(args) {
        console.debug("focusFromParentEditor", this, args);
        if (args.direction === EnterEditorDirection.up ||
            args.direction === EnterEditorDirection.down) {
            this.carryX = args.x;
        }
        if (this.isParentEditor()) {
            this.parentFocusFromParentEditor(args);
        }
        else {
            this.childFocusFromParentEditor(args);
        }
    }
    parentFocusFromParentEditor(args) {
        const { direction } = args;
        if (direction === EnterEditorDirection.up) {
            const { x } = args;
            const myBound = this.getBoundingClientRect();
            const a = this.closestSinkToPosition([x, myBound.top]);
            if (a === this)
                this.makeFocused();
            else
                a.focusFromParentEditor({ direction, x });
        }
        else if (direction === EnterEditorDirection.down) {
            const { x } = args;
            const myBound = this.getBoundingClientRect();
            const a = this.closestSinkToPosition([x, myBound.bottom]);
            if (a === this)
                this.makeFocused();
            else
                a.focusFromParentEditor({ direction, x });
        }
        else if (direction === EnterEditorDirection.left)
            this.childEditors()[0].focusFromParentEditor(args);
        else if (direction === EnterEditorDirection.right)
            this.makeFocused();
    }
    childFocusFromParentEditor(args) {
        this.makeFocused();
    }
    getOutput = () => this.childEditors()
        .map((editor) => editor.getOutput())
        .join();
    makeFocused() {
        this.focus({ preventScroll: true });
        this.setAttribute("isFocused", "true");
        this.parentEditor()?.makeUnfocused();
    }
    makeUnfocused() {
        this.setAttribute("isFocused", "false");
        this.carryX = null;
    }
}
customElements.define("poly-editor", EditorElement);
function exitEditorDirectionFromKey(key) {
    return ({
        ArrowUp: ExitEditorDirection.up,
        ArrowRight: ExitEditorDirection.right,
        ArrowDown: ExitEditorDirection.down,
        ArrowLeft: ExitEditorDirection.left,
    }[key] ?? null);
}
function enterDirectionFromExitDirection(exitDirection) {
    return {
        [ExitEditorDirection.up]: EnterEditorDirection.down,
        [ExitEditorDirection.right]: EnterEditorDirection.left,
        [ExitEditorDirection.down]: EnterEditorDirection.up,
        [ExitEditorDirection.left]: EnterEditorDirection.right,
    }[exitDirection];
}

/******/ })()
;