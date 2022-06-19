import { EditorElement } from "../editor.js";
import { withIndex } from "../Iterable.js";
import { add, distance, mul, sub } from "../math.js";
import { StringEditorElement } from "./StringEditorElement.js";
export class ForceGraphEditorElement extends EditorElement {
    meta = {
        editorName: "Force Graph",
    };
    nodes = [];
    styleEl;
    canvas;
    context;
    fromNode;
    mouse;
    constructor() {
        super(...arguments);
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
            if (e.key === "Backspace" && this.parentEditor) {
                this.parentEditor.dispatchEvent(new CustomEvent("subEditorDeleted", { detail: this }));
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
            this.nodes = this.nodes.filter(({ editor }) => editor !== e.detail);
            for (const node of this.nodes) {
                node.adjacent = node.adjacent.filter(({ editor }) => editor !== e.detail);
            }
            this.shadowRoot.removeChild(e.detail);
            this.render();
            this.focusEditor();
            new CustomEvent("childEditorUpdate", {
                detail: {
                    out: this.getOutput(),
                    editor: this,
                },
            });
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
            const editor = new StringEditorElement({ parentEditor: this });
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
            new CustomEvent("childEditorUpdate", {
                detail: {
                    out: this.getOutput(),
                    editor: this,
                },
            });
        });
        this.addEventListener("mouseup", (e) => {
            const targetEl = e.path[0];
            const targetNode = this.nodes.find(({ editor }) => editor.contains(targetEl) || editor.shadowRoot.contains(targetEl));
            if (targetNode) {
                if (this.fromNode &&
                    this.fromNode !== targetNode &&
                    !this.fromNode.adjacent.includes(targetNode)) {
                    this.fromNode.adjacent.push(targetNode);
                    targetNode.adjacent.push(this.fromNode);
                    new CustomEvent("childEditorUpdate", {
                        detail: {
                            out: this.getOutput(),
                            editor: this,
                        },
                    });
                }
            }
            this.fromNode = null;
            this.render();
        });
        const move = () => {
            const middleOfEditor = [
                this.offsetWidth / 2,
                this.offsetHeight / 2,
            ];
            const forces = [];
            for (let i = 0; i < this.nodes.length; i++)
                forces[i] = [0, 0];
            for (let i = 0; i < this.nodes.length; i++) {
                const node = this.nodes[i];
                const start = [
                    node.x + node.editor.offsetWidth / 2,
                    node.y + node.editor.offsetHeight / 2,
                ];
                const dirToMiddle = sub(middleOfEditor, start);
                const distToMiddle = distance(start, middleOfEditor);
                const nudgeToMiddle = mul(0.0005 * distToMiddle, dirToMiddle);
                forces[i] = add(forces[i], nudgeToMiddle);
                for (let j = i + 1; j < this.nodes.length; j++) {
                    const otherNode = this.nodes[j];
                    const end = [
                        otherNode.x + otherNode.editor.offsetWidth / 2,
                        otherNode.y + otherNode.editor.offsetHeight / 2,
                    ];
                    const dir = sub(end, start);
                    const mag = distance(start, end);
                    let force = mul(node.editor.offsetWidth ** 1.3 / mag ** 2, dir);
                    //if (node.adjacent.includes(otherNode)) force = add(force, mul(-mag / 500, dir));
                    forces[i] = add(forces[i], mul(-1, force));
                    forces[j] = add(forces[j], force);
                }
            }
            for (let i = 0; i < this.nodes.length; i++) {
                const node = this.nodes[i];
                const [x, y] = add([node.x, node.y], forces[i]);
                node.x = x;
                node.y = y;
            }
        };
        move();
        const step = () => {
            this.render();
            move();
            requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
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
            }
        }
    }
    fromInput(input) {
        if (!input || !input.nodes || !input.edges)
            return;
        const { nodes, edges } = input;
        for (let i = 0; i < nodes.length; i++) {
            const nodeValue = nodes[i];
            let editor;
            if (nodeValue instanceof EditorElement) {
                editor = new StringEditorElement({
                    code: [nodeValue],
                    parentEditor: this,
                });
            }
            else {
                editor = new StringEditorElement({
                    code: [String(nodeValue)],
                    parentEditor: this,
                });
            }
            editor.style.position = "absolute";
            this.nodes[i] = { x: 100 + i, y: 100 + i, editor, adjacent: [] };
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
        let edges = [];
        for (const [{ editor, x, y, adjacent }, i] of withIndex(this.nodes)) {
            nodes[i] = editor.getOutput();
            edges[i] = [];
            for (const otherNode of adjacent) {
                const otherNodeIndex = this.nodes.findIndex((n) => n === otherNode);
                edges[i].push(otherNodeIndex);
            }
        }
        return `({
      "nodes": [${nodes}],
      "edges": [${edges.map((edgeList) => `[${edgeList}]`)}]
  })`;
    }
}
customElements.define("force-graph-editor", ForceGraphEditorElement);
