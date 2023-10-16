import { EditorElement } from "../editor.js";
import { withIndex } from "../Iterable.js";
import { add, distance, mul, sub } from "../math.js";
import { StringEditorElement } from "./StringEditorElement.js";

type EditorNode = {
  x: number;
  y: number;
  editor: EditorElement;
  adjacent: {
    0: number[];
    1: number[];
    2: number[];
    3: number[];
  };
};

const GRAPH_COLORS = ["red", "blue", "green", "purple"];
export class ForceColoredGraphEditorElement extends EditorElement {
  meta = {
    editorName: "Force Colored Graph",
  };
  nodes: Array<EditorNode> = [];
  currentColor = 0;
  styleEl: HTMLStyleElement;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  fromNode: EditorNode;
  mouse: [number, number];

  constructor() {
    super(...arguments);
    this.style.setProperty("--editor-name", `'graph'`);
    this.style.setProperty("--editor-color", GRAPH_COLORS[0]);
    this.style.setProperty("--editor-name-color", "white");
    this.style.setProperty("--editor-background-color", "white");
    this.style.setProperty("--editor-outline-color", "black");

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
        this.parentEditor.dispatchEvent(
          new CustomEvent("subEditorDeleted", { detail: this })
        );
        this.blur();
        this.parentEditor.focusEditor();
      } else if (e.key === "ArrowLeft" && this.parentEditor) {
        this.blur();
        this.parentEditor.focusEditor(this, 0, e.shiftKey);
      } else if (e.key === "ArrowRight" && this.parentEditor) {
        this.blur();
        this.parentEditor.focusEditor(this, 1, e.shiftKey);
      } else if (e.key === "Meta") {
        this.currentColor = (this.currentColor + 1) % GRAPH_COLORS.length;
        this.style.setProperty(
          "--editor-color",
          GRAPH_COLORS[this.currentColor]
        );
      }
    });
    this.addEventListener("subEditorDeleted", (e: CustomEvent) => {
      this.nodes = this.nodes.filter(({ editor }) => editor !== e.detail);
      for (const node of this.nodes) {
        for (let i = 0; i < GRAPH_COLORS.length; i++) {
          node.adjacent[i] = node.adjacent[i].filter(
            ({ editor }) => editor !== e.detail
          );
        }
      }
      this.shadowRoot.removeChild(e.detail);
      this.render();
      this.focusEditor();
      this.parentEditor?.dispatchEvent(
        new CustomEvent("childEditorUpdate", {
          detail: {
            out: this.getOutput(),
            editor: this,
          },
        })
      );
    });
    this.addEventListener("subEditorClicked", (e: CustomEvent) => {
      const subFocus = this.nodes.find(({ editor }) => editor === e.detail[0]);
      if (subFocus) {
        this.fromNode = subFocus; // HACK
      }
    });
    this.addEventListener("mousemove", (e) => {
      this.mouse = [e.offsetX, e.offsetY];
      if (this.fromNode && e.metaKey) {
        this.fromNode.x = Math.max(
          0,
          Math.min(
            this.mouse[0] - 10,
            this.offsetWidth - this.fromNode.editor.offsetWidth - 2
          )
        );
        this.fromNode.y = Math.max(
          0,
          Math.min(
            this.mouse[1] - 10,
            this.offsetHeight - this.fromNode.editor.offsetHeight - 2
          )
        );
      }
      this.render();
    });
    this.addEventListener("mousedown", (e) => {
      const editor = new StringEditorElement({
        parentEditor: this,
        code: String(this.nodes.length).split(""),
      });
      editor.style.position = "absolute";
      const node = {
        x: e.offsetX - 10,
        y: e.offsetY - 10,
        editor,
        adjacent: {
          0: [],
          1: [],
          2: [],
          3: [],
        },
      };
      this.nodes.push(node);
      this.shadowRoot.append(editor);
      this.blur();
      setTimeout(() => editor.focusEditor());
      //this.fromNode = node;
      this.render();
      this.parentEditor?.dispatchEvent(
        new CustomEvent("childEditorUpdate", {
          detail: {
            out: this.getOutput(),
            editor: this,
          },
        })
      );
    });
    this.addEventListener("mouseup", (e) => {
      const targetEl = (e as MouseEvent).composedPath()[0] as Node;
      const targetNode = this.nodes.find(
        ({ editor }) =>
          editor.contains(targetEl) || editor.shadowRoot.contains(targetEl)
      );
      if (targetNode) {
        if (
          this.fromNode &&
          this.fromNode !== targetNode &&
          !this.fromNode.adjacent[this.currentColor].includes(targetNode)
        ) {
          this.fromNode.adjacent[this.currentColor].push(targetNode);
        }
      }
      this.fromNode = null;
      this.render();
      this.parentEditor?.dispatchEvent(
        new CustomEvent("childEditorUpdate", {
          detail: {
            out: this.getOutput(),
            editor: this,
          },
        })
      );
    });

    const move = () => {
      const middleOfEditor: [number, number] = [
        this.offsetWidth / 2,
        this.offsetHeight / 2,
      ];

      const forces = [];
      for (let i = 0; i < this.nodes.length; i++) forces[i] = [0, 0];

      for (let i = 0; i < this.nodes.length; i++) {
        const node = this.nodes[i];

        const start: [number, number] = [
          node.x + node.editor.offsetWidth / 2,
          node.y + node.editor.offsetHeight / 2,
        ];

        const dirToMiddle = sub(middleOfEditor, start);
        const distToMiddle = distance(start, middleOfEditor);
        const nudgeToMiddle = mul(0.0005 * distToMiddle, dirToMiddle);
        forces[i] = add(forces[i], nudgeToMiddle);

        for (let j = i + 1; j < this.nodes.length; j++) {
          const otherNode = this.nodes[j];

          const end: [number, number] = [
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

    this.addEventListener("childEditorUpdate", (e) => {
      this.parentEditor?.dispatchEvent(
        new CustomEvent("childEditorUpdate", {
          detail: {
            out: this.getOutput(),
            editor: this,
          },
        })
      );
    });
  }

  render() {
    this.context.lineWidth = 2;
    this.context.lineCap = "round";
    this.canvas.width = this.offsetWidth;
    this.canvas.height = this.offsetHeight;
    if (this.fromNode) {
      this.context.strokeStyle = GRAPH_COLORS[this.currentColor];
      this.context.beginPath();
      this.context.moveTo(
        this.fromNode.x + this.fromNode.editor.offsetWidth / 2,
        this.fromNode.y + this.fromNode.editor.offsetHeight / 2
      );
      this.context.lineTo(...this.mouse);
      this.context.stroke();
    }
    for (const { x, y, editor, adjacent } of this.nodes) {
      editor.style.top = `${y}px`;
      editor.style.left = `${x}px`;

      const drawConnections = (otherNodes) => {
        for (const otherNode of otherNodes) {
          this.context.beginPath();
          const start: [number, number] = [
            x + editor.offsetWidth / 2,
            y + editor.offsetHeight / 2,
          ];
          const end: [number, number] = [
            otherNode.x + otherNode.editor.offsetWidth / 2,
            otherNode.y + otherNode.editor.offsetHeight / 2,
          ];
          this.context.moveTo(...start);
          this.context.lineTo(...end);
          this.context.stroke();

          const angle = Math.atan2(end[0] - start[0], end[1] - start[1]);
          const dir = [Math.sin(angle), Math.cos(angle)];
          const dist =
            Math.min(
              otherNode.editor.offsetHeight * Math.abs(1 / Math.cos(angle)),
              otherNode.editor.offsetWidth * Math.abs(1 / Math.sin(angle))
            ) / 2; // https://math.stackexchange.com/a/924290/421433
          this.context.beginPath();
          this.context.moveTo(end[0] - dir[0] * dist, end[1] - dir[1] * dist);
          this.context.lineTo(
            end[0] - dir[0] * (dist + 11) + dir[1] * 7,
            end[1] - dir[1] * (dist + 11) - dir[0] * 7
          );
          this.context.stroke();
          this.context.moveTo(end[0] - dir[0] * dist, end[1] - dir[1] * dist);
          this.context.lineTo(
            end[0] - dir[0] * (dist + 11) - dir[1] * 7,
            end[1] - dir[1] * (dist + 11) + dir[0] * 7
          );
          this.context.stroke();
        }
      };
      for (let i = 0; i < GRAPH_COLORS.length; i++) {
        const color = GRAPH_COLORS[i];
        this.context.strokeStyle = color;
        drawConnections(adjacent[i]);
      }
    }
  }

  fromInput(input) {
    if (!input || !input.nodes || !input.edges) return;
    const { nodes, edges } = input;

    for (let i = 0; i < nodes.length; i++) {
      const nodeValue = nodes[i];

      let editor;
      if (nodeValue instanceof EditorElement) {
        editor = new StringEditorElement({
          code: [nodeValue],
          parentEditor: this,
        });
      } else {
        editor = new StringEditorElement({
          code: [String(nodeValue)],
          parentEditor: this,
        });
      }
      editor.style.position = "absolute";

      this.nodes[i] = {
        x: 100 + i,
        y: 100 + i,
        editor,
        adjacent: {
          0: [],
          1: [],
          2: [],
          3: [],
        },
      };
      this.shadowRoot.append(editor);
    }
    for (let j = 0; j < GRAPH_COLORS.length; j++) {
      for (let i = 0; i < nodes.length; i++) {
        const edgeList = edges[j][i];

        for (const edgeIndex of edgeList) {
          this.nodes[i].adjacent[j].push(this.nodes[edgeIndex]);
        }
      }
    }
  }

  getJSONOutput() {
    let nodes = [];
    let positions = [];
    let edges = {
      0: [],
      1: [],
      2: [],
      3: [],
    };

    for (const [{ editor, x, y, adjacent }, i] of withIndex(this.nodes)) {
      nodes[i] = editor;
      positions[i] = [x, y];

      for (let j = 0; j < GRAPH_COLORS.length; j++) {
        edges[j][i] = [];
        for (const otherNode of adjacent[j]) {
          const otherNodeIndex = this.nodes.findIndex((n) => n === otherNode);
          edges[j][i].push(otherNodeIndex);
        }
      }
    }

    return {
      isColoredGraph: true,
      nodes,
      edges,
      positions,
    };
  }

  getOutput() {
    const { nodes, edges, positions } = this.getJSONOutput();
    return `(${JSON.stringify({
      nodes: nodes.map((node) => node.getOutput().split('"').join("")),
      edges,
      positions,
      isColoredGraph: true,
    })})`;
  }
}

customElements.define(
  "force-color-graph-editor",
  ForceColoredGraphEditorElement
);
