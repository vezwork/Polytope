import { ArrayEditorElement } from "./ArrayEditorElement.js";

const STAFF_BOTTOM_NOTE_Y = 20.5;
const STAFF_LINE_HEIGHT = 5;

const NOTES = [
  "c4",
  "d4",
  "e4",
  "f4",
  "g4",
  "a4",
  "b4",
  "c5",
  "d5",
  "e5",
  "f5",
  "g5",
  "a5",
  " ",
] as const;

const KEY_TO_NOTE = {
  a: "e4",
  s: "f4",
  d: "g4",
  f: "a4",
  g: "b4",
  h: "c5",
  j: "d5",
  k: "e5",
  l: "f5",
  ";": "g5",
  " ": " ",
};

export class MusicStaffEditorElement extends ArrayEditorElement<{
  note: typeof NOTES[number] | " ";
  length: number;
}> {
  meta = {
    editorName: "♫ Staff",
  };

  styleEl2: HTMLStyleElement;

  getHighlightedOutput() {
    if (!this.isFocused || this.minorCaret === this.caret) return "[]";

    const [start, end] = this.caretsOrdered();

    return "(" + JSON.stringify(this.contents.slice(start, end)) + ")";
  }

  getOutput() {
    return "(" + JSON.stringify(this.contents) + ")";
  }

  processClipboardText(clipboardText: string): Array<{
    note: typeof NOTES[number];
    length: number;
  }> {
    return JSON.parse(clipboardText.substring(1, clipboardText.length - 1));
  }

  constructor(arg) {
    super(arg);

    this.style.setProperty("--editor-color", "black");
    this.style.setProperty("--editor-name-color", "white");
    this.style.setProperty("--editor-background-color", "white");
    this.style.setProperty("--editor-outline-color", "black");
    this.styleEl2 = document.createElement("style");
    this.styleEl2.textContent = `
            :host {
              padding: 10px;
            }
            :host(:not(:focus-visible)) #caret {
              display: none;
            }
            #caret {
                animation: blinker 1s linear infinite;
            }
            @keyframes blinker {
                0% { opacity: 1; }
                49% { opacity: 1; }
                50% { opacity: 0; }
                100% { opacity: 0; }
            }
        `;
    this.shadowRoot.append(this.styleEl2);

    this.contentsEl.innerHTML = svgElText();
    this.render();
  }

  render() {
    const notesWrapperEl = this.shadowRoot.getElementById("notes");
    if (!notesWrapperEl) return;

    notesWrapperEl.innerHTML = "";
    let x = 25;
    let i = 0;
    for (const { note, length } of this.contents) {
      const y =
        STAFF_BOTTOM_NOTE_Y - (NOTES.indexOf(note) * STAFF_LINE_HEIGHT) / 2;

      if (note === " ") {
        notesWrapperEl.append(
          makeSVGEl("use", { href: "#quarter-rest", x, y: 11, i })
        );
      } else if (y < 10) {
        notesWrapperEl.append(
          makeSVGEl("use", { href: "#quarter-note-flipped", x, y: y + 10.5, i })
        );
      } else {
        notesWrapperEl.append(
          makeSVGEl("use", { href: "#quarter-note", x, y, i })
        );
      }

      if (i !== 0 && i % 4 === 0) {
        notesWrapperEl.append(
          makeSVGEl("use", { href: "#vertical-line", x: x - 3 })
        );
      }

      x += 14;
      i++;
    }

    this.shadowRoot.getElementById("svg").setAttribute("width", x * 2 + "");
    this.shadowRoot
      .getElementById("svg")
      .setAttribute("viewBox", `0 0 ${x} 38`);

    notesWrapperEl.append(
      makeSVGEl("use", { href: "#caret", x: 19.5 + this.caret * 14, y: 5 })
    );

    const [start, end] = this.caretsOrdered();
    if (start !== end) {
      const el = makeSVGEl("rect", {
        fill: "white",
        x: 22 + start * 14,
        y: 6,
        height: 26.5,
        width: (end - start) * 14 - 1,
        rx: 2,
      });
      el.style.mixBlendMode = "difference";
      notesWrapperEl.append(el);
    }
  }

  keyHandler(e) {
    if (KEY_TO_NOTE[e.key]) {
      this.insert([{ note: KEY_TO_NOTE[e.key], length: 1 }]);
      return true;
    }
  }
}
customElements.define("music-staff-editor", MusicStaffEditorElement);

function makeSVGEl(name, props = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", name);
  for (const [key, value] of Object.entries(props))
    el.setAttributeNS(null, key, value);
  return el;
}

function svgElText() {
  return `<svg id="svg" width="360" height="76" viewBox="0 0 180 38" fill="none" xmlns="http://www.w3.org/2000/svg">
  
  <!--  start vertical line  -->
    <line x1="0.25" y1="9" x2="0.25" y2="29" stroke="currentColor" stroke-width="0.5" />
  <!--  staff lines  -->
    <line y1="8.75" x2="100%" y2="8.75" stroke="currentColor" stroke-width="0.5" />
    <line y1="13.75" x2="100%" y2="13.75" stroke="currentColor" stroke-width="0.5" />
    <line y1="18.75" x2="100%" y2="18.75" stroke="currentColor" stroke-width="0.5" />
    <line y1="23.75" x2="100%" y2="23.75" stroke="currentColor" stroke-width="0.5" />
    <line y1="28.75" x2="100%" y2="28.75" stroke="currentColor" stroke-width="0.5" />
    
  <!-- treble clef   -->
    <path d="M14.108 3.28993C14.3892 6.20396 12.2467 8.56219 10.3492 10.4684C9.48731 11.3045 10.2063 10.6064 9.75577 11.0221C9.66155 10.5756 9.48049 9.40863 9.49745 9.05536C9.61767 6.54437 11.6361 2.91513 13.4046 1.57654C13.6894 2.11408 13.9236 2.15733 14.108 3.28993ZM14.7081 18.3359C13.5723 17.4915 12.0807 17.2696 10.713 17.511C10.5366 16.3412 10.3602 15.1715 10.1838 14.0026C12.3508 11.8317 14.7072 9.31206 14.8307 6.04299C14.8851 3.96253 14.5763 1.68876 13.2838 -0.000396729C11.7162 0.119127 10.6107 2.00922 9.77881 3.18414C8.4062 5.67332 8.72656 8.6993 9.25333 11.3834C8.50714 12.2707 7.47443 13.008 6.73894 13.9318C4.56684 16.083 2.67473 18.9931 3.04709 22.207C3.21609 25.3146 5.43426 28.2041 8.45884 28.9433C9.60725 29.2369 10.8225 29.2658 11.9843 29.0356C12.187 31.1328 12.9307 33.3503 12.0696 35.386C11.4236 36.8755 9.49976 38.186 8.07542 37.4292C7.52283 37.1346 7.9706 37.3816 7.63475 37.1943C8.621 36.9547 9.47818 36.2286 9.71825 35.7355C10.4906 34.3709 9.34967 32.3436 7.73118 32.6055C5.64584 32.6484 4.78994 35.5323 6.13113 36.9724C7.37274 38.3892 9.66478 38.1953 11.1371 37.2688C12.8081 36.1689 13.0174 33.9655 12.8265 32.0845C12.762 31.4525 12.455 29.5958 12.4172 28.9274C13.0598 28.6953 12.6099 28.8724 13.517 28.5089C15.9693 27.5274 17.5338 24.5391 16.8303 21.8705C16.5372 20.5012 15.8679 19.1543 14.7081 18.3359V18.3359ZM15.2253 23.7021C15.4226 25.5579 14.2546 27.7297 12.3868 28.3253C12.2614 27.5843 12.2282 27.3829 12.1447 26.9504C11.7002 24.6575 11.4588 22.302 11.1158 19.9774C12.6136 19.8208 14.3034 20.4835 14.8243 22.0131C15.0492 22.5509 15.1405 23.1288 15.2253 23.7021V23.7021ZM10.4788 28.5453C8.1334 28.6767 5.86977 27.0586 5.28454 24.7414C4.59404 22.7345 4.7975 20.4257 6.04115 18.679C7.06916 17.0925 8.44409 15.7848 9.75512 14.4444C9.92383 15.4949 10.0925 16.5454 10.2612 17.5968C7.50421 18.3257 5.6475 22.001 7.29733 24.5419C7.78815 25.254 9.11947 26.614 9.84685 26.0649C8.83092 25.4283 8.00001 24.3322 8.17867 23.057C8.10298 21.8621 9.44158 20.3437 10.6229 20.0762C11.0271 22.7504 11.4907 25.7368 11.8949 28.412C11.4289 28.5052 10.9535 28.5453 10.4788 28.5453Z" fill="currentColor" />
  
    <g id="notes">
    </g>
  
    <defs>
      <g id="vertical-line">
        <line x1="0" y1="9" x2="0" y2="29" stroke="currentColor" stroke-width="0.5" />
      </g>
      <g id="quarter-note">
        <ellipse cx="3.19951" cy="13.3047" rx="2.75" ry="1.82261" transform="rotate(-19.4175 3.19951 13.3047)" fill="currentColor" />
        <path d="M5.35742 12.3V1" stroke="currentColor" stroke-linecap="square" />
      </g>
      <g id="quarter-note-flipped">
        <ellipse cx="3.19942" cy="2.63316" rx="2.8" ry="1.9" transform="rotate(160.583 3.19942 2.63316)" fill="currentColor" />
        <path d="M1.0415 3.63787V14.9379" stroke="currentColor" stroke-linecap="square" />
      </g>
      <g id="caret">
        <path d="M0.5 28H1L1.5 27V2L1 1H0.5" stroke="currentColor" stroke-linecap="square"/>
        <path d="M1.52949 1.94102L1.5 2M2.5 28H2L1.5 27V2M1.5 2L2 1H2.5" stroke="currentColor" stroke-linecap="square"/>
      </g>
      <g id="quarter-rest">
        <path d="M1.06217 0.41466C1.45077 0.842069 4.43005 4.60861 4.43005 4.60861C4.43005 4.60861 2.77202 6.23811 2.77202 7.94775C2.77202 9.95123 5 11.7677 5 11.7677L4.76684 12.0616C3.91192 11.554 2.46114 11.5006 1.81347 12.2753C1.01036 13.2369 2.82384 14.7062 2.82384 14.7062L2.61658 15C1.99482 14.5192 -0.647668 11.9547 0.466322 10.6992C1.1399 9.92451 1.96891 9.6841 3.13471 10.3252L0 6.98608C1.81347 4.68875 2.12435 4.02093 2.12435 3.40652C2.12435 2.1243 1.24352 1.21605 0.803106 0.628365C0.647666 0.387947 0.362692 0.200955 0.544039 0.0406769C0.725386 -0.0928884 0.829013 0.120816 1.06217 0.41466V0.41466Z" fill="currentColor"/>
      </g>
    </defs>
  </svg>`;
}
