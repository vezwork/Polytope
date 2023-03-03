import { makeCaretFunctions } from "./caret.js";
import { closestElementToPosition } from "./closestElement.js";
import * as Iter from "./Iterable.js";

// Doesn't support selection yet. Traversal would have to be added to makeCaretFunctions

// necessary because `Object.assign` does not see DOMRect properties.
const getBoundingClientRect = (element: HTMLElement) => {
  const { top, right, bottom, left, width, height, x, y } =
    element.getBoundingClientRect();
  return { top, right, bottom, left, width, height, x, y };
};

const parent = (e: EditorElement): EditorElement | null =>
  (e.parentElement?.closest("[isEditor=true]") as EditorElement) ?? null;

const descendents = (e: EditorElement) =>
  e.querySelectorAll(`[isEditor=true]`) as NodeListOf<EditorElement>;

const children = (e: EditorElement) =>
  Iter.filter(descendents(e), (d) => parent(d) === e);

const closestChildToPosition = (e: EditorElement) => (p: [number, number]) =>
  closestElementToPosition(e, children(e), p);

const setCarryX = (e: EditorElement) => (carryX: number | null) =>
  (e.carryX = carryX);

const { next } = makeCaretFunctions<EditorElement>({
  getBounds: (e: EditorElement) => getBoundingClientRect(e),
  parent,
  children,
  getCarryX: (e) => e.carryX,
  setCarryX,
});

export type EditorArgumentObject = {
  parentEditor?: EditorElement;
  builder?: (input: string) => { output: EditorElement };
};

/** EditorElement just contains data (some data is functions) */
export class EditorElement extends HTMLElement {
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
    (this.shadowRoot as ShadowRoot).append(
      baseStyleEl,
      document.createElement("slot")
    );

    if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0"); // make tabbable by default

    // focus
    this.addEventListener("focusout", (e) => this.makeUnfocused());
    this.addEventListener("focus", (e) => {
      e.stopPropagation();
      this.makeFocused();
    });
    this.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      closestChildToPosition(this)([e.clientX, e.clientY])?.makeFocused();
    });
    this.addEventListener("mousemove", (e) => {
      if (e.buttons === 1) {
        e.preventDefault();
        e.stopPropagation();
        const closest = closestChildToPosition(this)([e.clientX, e.clientY]);
        if (closest) {
          closest.makeFocused();
        }
      }
    });
    this.addEventListener("keydown", (e) => {
      if (isArrowKey(e.key)) {
        next(this, e.key)?.makeFocused();
        e.stopPropagation();
      }
    });
  }

  carryX: number | null = null;

  makeFocused() {
    this.focus({ preventScroll: true });
    this.setAttribute("isFocused", "true");
    parent(this)?.makeUnfocused();
  }
  makeUnfocused() {
    this.setAttribute("isFocused", "false");
    setCarryX(this)(null);
  }
}
customElements.define("poly-editor", EditorElement);

function isArrowKey(
  key: KeyboardEvent["key"]
): key is "ArrowUp" | "ArrowRight" | "ArrowDown" | "ArrowLeft" {
  return (
    key === "ArrowUp" ||
    key === "ArrowRight" ||
    key === "ArrowDown" ||
    key === "ArrowLeft"
  );
}
