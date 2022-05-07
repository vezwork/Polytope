import { EditorElement } from "../editor.js";
import { withIndex } from "../Iterable.js";
import { TextEditorElement } from "./TextEditorElement.js";
export const MakeGraphEditorElement = (NestedEditorConstructor = TextEditorElement, name = "custom") => {
    class GraphEditorElement extends EditorElement {
        constructor() {
            super(...arguments);
            this.nodes = [];
            this.style.setProperty("--editor-name", `'graph'`);
            this.style.setProperty("--editor-color", "#7300CF");
            this.style.setProperty("--editor-name-color", "white");
            this.style.setProperty("--editor-background-color", "#eed9ff");
            this.style.setProperty("--editor-outline-color", "#b59dc9");
            this.styleEl = document.createElement("style");
            this.styleEl.textContent = `
              :host {
                  position: relative;
                  height: 250px;
                  width: 250px;
              }
  
              canvas {
                  position: absolute;
                  top: 0;
                  left: 0;
              }
          `;
            this.canvas = document.createElement("canvas");
            this.canvas.width = 250;
            this.canvas.height = 250;
            this.context = this.canvas.getContext("2d");
            this.shadowRoot.append(this.styleEl, this.canvas);
            this.fromNode = null;
            this.mouse = [0, 0];
            this.fromInput(arguments[0]);
            setTimeout(() => this.render());
            this.addEventListener("keydown", (e) => {
                var _a;
                if (e.key === "Backspace" && this.parentEditor) {
                    this.parentEditor.dispatchEvent(new CustomEvent("subEditorDeleted", { detail: this }));
                    (_a = this.parentEditor) === null || _a === void 0 ? void 0 : _a.dispatchEvent(new CustomEvent("childEditorUpdate", {
                        detail: {
                            out: this.getOutput(),
                            editor: this,
                        },
                    }));
                }
                else if (e.key === "ArrowLeft" && this.parentEditor) {
                    this.blur();
                    this.parentEditor.focusEditor(this, 0, e.shiftKey);
                }
                else if (e.key === "ArrowRight" && this.parentEditor) {
                    this.blur();
                    this.parentEditor.focusEditor(this, 1, e.shiftKey);
                }
            });
            this.addEventListener("subEditorDeleted", (e) => {
                var _a;
                this.nodes = this.nodes.filter(({ editor }) => editor !== e.detail);
                for (const node of this.nodes) {
                    node.adjacent = node.adjacent.filter(({ editor }) => editor !== e.detail);
                }
                this.shadowRoot.removeChild(e.detail);
                this.render();
                this.focusEditor();
                (_a = this.parentEditor) === null || _a === void 0 ? void 0 : _a.dispatchEvent(new CustomEvent("childEditorUpdate", {
                    detail: {
                        out: this.getOutput(),
                        editor: this,
                    },
                }));
            });
            this.addEventListener("subEditorClicked", (e) => {
                const subFocus = this.nodes.find(({ editor }) => editor === e.detail[0]);
                if (subFocus) {
                    this.fromNode = subFocus; // HACK
                }
            });
            this.addEventListener("mousemove", (e) => {
                this.mouse = [e.offsetX, e.offsetY];
                if (this.fromNode && e.metaKey) {
                    this.fromNode.x = Math.max(0, Math.min(this.mouse[0] - 10, this.offsetWidth - this.fromNode.editor.offsetWidth - 2));
                    this.fromNode.y = Math.max(0, Math.min(this.mouse[1] - 10, this.offsetHeight - this.fromNode.editor.offsetHeight - 2));
                }
                this.render();
            });
            this.addEventListener("mousedown", (e) => {
                var _a;
                const editor = new NestedEditorConstructor({ parentEditor: this });
                editor.style.position = "absolute";
                const node = {
                    x: e.offsetX - 10,
                    y: e.offsetY - 10,
                    editor,
                    adjacent: [],
                };
                this.nodes.push(node);
                this.shadowRoot.append(editor);
                this.blur();
                setTimeout(() => editor.focusEditor());
                this.fromNode = node;
                this.render();
                (_a = this.parentEditor) === null || _a === void 0 ? void 0 : _a.dispatchEvent(new CustomEvent("childEditorUpdate", {
                    detail: {
                        out: this.getOutput(),
                        editor: this,
                    },
                }));
            });
            this.addEventListener("mouseup", (e) => {
                var _a;
                const targetEl = e.path[0];
                const targetNode = this.nodes.find(({ editor }) => editor.contains(targetEl) || editor.shadowRoot.contains(targetEl));
                if (targetNode) {
                    if (this.fromNode &&
                        this.fromNode !== targetNode &&
                        !this.fromNode.adjacent.includes(targetNode)) {
                        this.fromNode.adjacent.push(targetNode);
                        (_a = this.parentEditor) === null || _a === void 0 ? void 0 : _a.dispatchEvent(new CustomEvent("childEditorUpdate", {
                            detail: {
                                out: this.getOutput(),
                                editor: this,
                            },
                        }));
                    }
                }
                this.fromNode = null;
                this.render();
            });
            this.addEventListener("childEditorUpdate", (e) => {
                var _a;
                (_a = this.parentEditor) === null || _a === void 0 ? void 0 : _a.dispatchEvent(new CustomEvent("childEditorUpdate", {
                    detail: {
                        out: this.getOutput(),
                        editor: this,
                    },
                }));
            });
        }
        render() {
            this.context.strokeStyle = "#7300CF";
            this.context.fillStyle = "#7300CF";
            this.context.lineWidth = 2;
            this.context.lineCap = "round";
            this.canvas.width = this.offsetWidth;
            this.canvas.height = this.offsetHeight;
            if (this.fromNode) {
                this.context.beginPath();
                this.context.moveTo(this.fromNode.x + this.fromNode.editor.offsetWidth / 2, this.fromNode.y + this.fromNode.editor.offsetHeight / 2);
                this.context.lineTo(...this.mouse);
                this.context.stroke();
            }
            for (const { x, y, editor, adjacent } of this.nodes) {
                editor.style.top = `${y}px`;
                editor.style.left = `${x}px`;
                for (const otherNode of adjacent) {
                    this.context.beginPath();
                    const start = [
                        x + editor.offsetWidth / 2,
                        y + editor.offsetHeight / 2,
                    ];
                    const end = [
                        otherNode.x + otherNode.editor.offsetWidth / 2,
                        otherNode.y + otherNode.editor.offsetHeight / 2,
                    ];
                    this.context.moveTo(...start);
                    this.context.lineTo(...end);
                    this.context.stroke();
                    const angle = Math.atan2(end[0] - start[0], end[1] - start[1]);
                    const dir = [Math.sin(angle), Math.cos(angle)];
                    const dist = Math.min(otherNode.editor.offsetHeight * Math.abs(1 / Math.cos(angle)), otherNode.editor.offsetWidth * Math.abs(1 / Math.sin(angle))) / 2; // https://math.stackexchange.com/a/924290/421433
                    this.context.beginPath();
                    this.context.moveTo(end[0] - dir[0] * dist, end[1] - dir[1] * dist);
                    this.context.lineTo(end[0] - dir[0] * (dist + 11) + dir[1] * 7, end[1] - dir[1] * (dist + 11) - dir[0] * 7);
                    this.context.stroke();
                    this.context.moveTo(end[0] - dir[0] * dist, end[1] - dir[1] * dist);
                    this.context.lineTo(end[0] - dir[0] * (dist + 11) - dir[1] * 7, end[1] - dir[1] * (dist + 11) + dir[0] * 7);
                    this.context.stroke();
                }
            }
        }
        fromInput(input) {
            if (!input || !input.nodes || !input.edges || !input.positions)
                return;
            const { nodes, edges, positions } = input;
            for (let i = 0; i < nodes.length; i++) {
                const nodeValue = nodes[i];
                const position = positions[i];
                let editor;
                if (nodeValue instanceof EditorElement) {
                    editor = new NestedEditorConstructor({
                        code: [nodeValue],
                        parentEditor: this,
                    });
                }
                else {
                    editor = new NestedEditorConstructor({
                        code: [String(nodeValue)],
                        parentEditor: this,
                    });
                }
                editor.style.position = "absolute";
                this.nodes[i] = {
                    x: position[0],
                    y: position[1],
                    editor,
                    adjacent: [],
                };
                this.shadowRoot.append(editor);
            }
            for (let i = 0; i < nodes.length; i++) {
                const edgeList = edges[i];
                for (const edgeIndex of edgeList) {
                    this.nodes[i].adjacent.push(this.nodes[edgeIndex]);
                }
            }
        }
        getOutput() {
            let nodes = [];
            let positions = [];
            let edges = [];
            for (const [{ editor, x, y, adjacent }, i] of withIndex(this.nodes)) {
                nodes[i] = `"${editor.getOutput()}"`;
                positions[i] = [x, y];
                edges[i] = [];
                for (const otherNode of adjacent) {
                    const otherNodeIndex = this.nodes.findIndex((n) => n === otherNode);
                    edges[i].push(otherNodeIndex);
                }
            }
            return `({
      "nodes": [${nodes}],
      "edges": [${edges.map((edgeList) => `[${edgeList}]`)}],
      "positions": [${positions.map(([x, y]) => `[${x}, ${y}]`)}]
  })`;
        }
    }
    customElements.define(`graph-editor-${name}`, GraphEditorElement);
    return GraphEditorElement;
};
