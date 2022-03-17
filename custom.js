import {
    BidirectionalEditorPair, ConstructiveUnidirectionalEditor, UnidirectionalEditorPair
} from "./bidirectional_editor_pair.js";
import { GraphEditorElement, ForceColoredGraphEditorElement, ForceGraphEditorElement, ColoredGraphEditorElement, TextEditorElement, DropdownElement } from "./lib/editor.js";
import { MathEditorElement, PlusJoinerElement, DivJoinerElement, ExpJoinerElement, RadicalJoinerElement, MulJoinerElement, SubJoinerElement, MatrixJoinerElement } from "./mathEditors.js";
import { createJSONProcessor, createBuilder, createFunctionProcessor } from "./lib/stringToEditorBuilder.js";
import { generatorPaths, multiplicationTable, cycleGraph } from "./groupTheory.js";
import { MarkdownEditorElement } from "./markdownEditors.js";

const mathOperations = [{
    name: 'plus',
    arity: 2,
    ElementConstructor: PlusJoinerElement
}, {
    name: 'mul',
    arity: 2,
    ElementConstructor: MulJoinerElement
}, {
    name: 'sub',
    arity: 2,
    ElementConstructor: SubJoinerElement
}, {
    name: 'div',
    arity: 2,
    ElementConstructor: DivJoinerElement
}, {
    name: 'exp',
    arity: 2,
    ElementConstructor: ExpJoinerElement
}, {
    name: 'sqrt',
    arity: 1,
    ElementConstructor: RadicalJoinerElement
}];
export const builder = createBuilder([
    ...mathOperations.map(createFunctionProcessor),
    createJSONProcessor(
        (obj) => new GraphEditorElement(obj),
        (obj) => Array.isArray(obj.nodes) && Array.isArray(obj.edges) && Array.isArray(obj.positions)
    ),
    createJSONProcessor(
        (obj) => new ColoredGraphEditorElement(obj),
        (obj) => Boolean(obj.isColoredGraph)
    ),
    createJSONProcessor(
        (obj) => new ForceGraphEditorElement(obj),
        (obj) => Array.isArray(obj.nodes) && Array.isArray(obj.edges)
    ),
]);

const ED = ConstructiveUnidirectionalEditor({
    name: 'eval-testing',
    leftEditorFactory: (code, parentEditor) => new MyEditorElement({
        code,
        parentEditor
    }),
    leftEditorOutput: (editor) => editor.getOutput(),
});
const GraphToForceGraph = UnidirectionalEditorPair({
    name: 'graph-force-graph',
    leftEditorFactory: (string, parentEditor) => {
        return new ColoredGraphEditorElement({
            parentEditor
        })
    },
    leftEditorOutput: (editor) => {
        const { nodes, edges } = editor.getJSONOutput();
        return {
            nodes: nodes.map(node => node.getOutput().split("\"").join('')),
            edges
        }
    },
    transformer: ({ nodes, edges }) => {
        const group = { nodes, edges };
        const groupPaths = generatorPaths(group);
        const mul = multiplicationTable(group, groupPaths);
        //console.log('yo', cycleGraph(mul));
        return cycleGraph(mul);
    },
    rightEditorFactory: (code2DArray, parentEditor) => new MathEditorElement({
        parentEditor,
        code: [new MatrixJoinerElement({ code2DArray })]
    }),
    output: (leftEditor, rightEditor) => leftEditor.getOutput(),
});
const MathTextBidirectional = BidirectionalEditorPair({
    name: 'text-math',
    leftEditorFactory: (string, parentEditor) => new MyEditorElement({
        code: string.split(''),
        parentEditor
    }),
    rightEditorFactory: (string, parentEditor) => new MathEditorElement({
        code: builder(string).output,
        parentEditor
    }),
    output: (leftEditor, rightEditor) => leftEditor.getOutput(),
});
// Limited by the number of colors on the colored graph currently
const CayleyMatrixBidirectional = BidirectionalEditorPair({
    name: 'cayley-matrix',
    leftEditorFactory: (input, parentEditor) => {
        return new ForceColoredGraphEditorElement({
            ...input,
            parentEditor
        })
    },
    leftEditorOutput: (editor) => {
        const { nodes, edges } = editor.getJSONOutput();
        return {
            nodes: nodes.map(node => node.getOutput().split("\"").join('')),
            edges
        }
    },
    leftToRightTransformer: ({ nodes, edges }) => {
        const group = { nodes, edges };
        const groupPaths = generatorPaths(group);
        const mul = multiplicationTable(group, groupPaths);
        return Object.values(mul).map(
            columnObject => Object.values(columnObject).map(
                el => [el]
            )
        );
    },
    rightToLeftTransformer: (array2d) => {
        const nodes = array2d[0];
        const edges = { "0": [...nodes.map(() => [])], "1": [...nodes.map(() => [])], "2": [...nodes.map(() => [])], "3": [...nodes.map(() => [])] };
        for (let x = 0; x < array2d.length; x++) {
            for (let y = 0; y < array2d[0].length; y++) {
                const result = array2d[x][y];
                const resultIndex = nodes.findIndex((val) => val === result);
                if (y !== resultIndex) edges[x - 1][y].push(resultIndex);
            }
        }

        return {
            nodes,
            edges
        };
    },

    rightEditorOutput: (editor) => {
        const out = editor.getOutput();
        const array2dString = out.substring('matrix('.length, out.length - 1);
        return JSON.parse(array2dString);
    },
    rightEditorFactory: (code2DArray, parentEditor) => new MathEditorElement({
        parentEditor,
        code: [new MatrixJoinerElement({ code2DArray })]
    }),
    output: (leftEditor, rightEditor) => leftEditor.getOutput(),
});
const CayleeToCycleAndTable = UnidirectionalEditorPair({
    name: 'graph-force-matrix',
    leftEditorFactory: (string, parentEditor) => new GraphToForceGraph({
        parentEditor
    }),
    leftEditorOutput: (editor) => {
        const { nodes, edges } = editor.leftEditor.getJSONOutput();
        return {
            nodes: nodes.map(node => node.getOutput().split("\"").join('')),
            edges
        }
    },
    transformer: ({ nodes, edges }) => {
        const group = { nodes, edges };
        const groupPaths = generatorPaths(group);
        const mul = multiplicationTable(group, groupPaths);
        return Object.values(mul).map(
            columnObject => Object.values(columnObject).map(
                el => [el]
            )
        );
    },
    rightEditorFactory: (code2DArray, parentEditor) => new MathEditorElement({
        parentEditor,
        code: [new MatrixJoinerElement({ code2DArray })]
    }),
    output: (leftEditor, rightEditor) => rightEditor.getOutput(),
});

export class MyEditorElement extends TextEditorElement {
    constructor({ dropdownItems = [] } = {}) {
        super(...arguments);
        // Idea: put this info in editor metadata so that you can just pass in editor classes
        this.CustomDropdown = DropdownElement([
            ...dropdownItems,
            {
                name: 'math',
                description: 'make ~structured math equations!',
                ElementConstructor: MathEditorElement,
                iconPath: "./assets/icon_math.png"
            },
            {
                name: 'markdown',
                description: 'add comments formatted with markdown',
                ElementConstructor: MarkdownEditorElement,
            },
            {
                name: 'graph',
                description: 'make simple graphs',
                ElementConstructor: GraphEditorElement,
                iconPath: "./assets/icon_graph.png"
            },
            {
                name: 'force graph',
                description: 'make automatically placed graphs',
                ElementConstructor: ForceGraphEditorElement,
                iconPath: "./assets/icon_graph.png"
            },
            {
                name: 'cgraph',
                description: 'make colored graphs!',
                ElementConstructor: ForceColoredGraphEditorElement,
                iconPath: "./assets/icon_cgraph.png"
            },
            {
                name: 'eval',
                description: '',
                ElementConstructor: ED
            },
            {
                name: 'text ⇔ math',
                description: '',
                ElementConstructor: MathTextBidirectional
            },
            {
                name: 'c graph → force graph',
                description: 'synchronize editors',
                ElementConstructor: GraphToForceGraph
            },
            {
                name: '(c graph → force graph) → matrix',
                description: '∆ group theory trifecta ∆',
                ElementConstructor: CayleeToCycleAndTable
            },
            {
                name: 'Cayley ⇔ Matrix',
                description: '',
                ElementConstructor: CayleyMatrixBidirectional
            }
        ], Math.random().toFixed(5).slice(1));
    }

    keyHandler(e) {
        if (e.key === 'Alt') {
            const focuser = new this.CustomDropdown({ parentEditor: this });
            this.code.splice(this.caret, 0, focuser);
            return focuser;
        }
        if (e.key === '`') {
            const focuser = new MathEditorElement({ code: builder(this.getHighlighted()).output });
            this.backspace();
            this.code.splice(this.caret, 0, focuser);
            return focuser;
        }
    }
}
customElements.define('my-text-editor', MyEditorElement);
