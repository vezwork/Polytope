import { GraphEditorElement, ColoredGraphEditorElement, ForceGraphEditorElement } from "./editor.js";
import { PlusJoinerElement, DivJoinerElement, ExpJoinerElement, RadicalJoinerElement, MulJoinerElement, SubJoinerElement } from "./sub_math_editors.js";

const mathOperations = [{
    prefix: 'plus',
    arity: 2,
    ElementConstructor: PlusJoinerElement
}, {
    prefix: 'mul',
    arity: 2,
    ElementConstructor: MulJoinerElement
}, {
    prefix: 'sub',
    arity: 2,
    ElementConstructor: SubJoinerElement
}, {
    prefix: 'div',
    arity: 2,
    ElementConstructor: DivJoinerElement
}, {
    prefix: 'exp',
    arity: 2,
    ElementConstructor: ExpJoinerElement
}, {
    prefix: 'sqrt',
    arity: 2,
    ElementConstructor: RadicalJoinerElement
}];

const processMath = (mathOperations, string, i, innerString, result) => {

    let isProcessed = false;

    for (const { prefix, arity, ElementConstructor } of mathOperations) {
        if (string.substring(i - prefix.length, i) === prefix) {
            // Only supports unary and binary ops for now.
            if (arity === 1) {
                const joiner = new ElementConstructor({
                    code: innerString
                });
                isProcessed = true;
                result.length -= prefix.length;
                concatInPlace(result, [joiner]);

            } else if (arity === 2) {
                const commaIndex = innerString.indexOf(',');
                if (commaIndex !== -1) {
                    const joiner = new ElementConstructor({
                        leftCode: innerString.slice(0, commaIndex),
                        rightCode: innerString.slice(commaIndex + 2)
                    });
                    isProcessed = true;
                    result.length -= prefix.length;
                    concatInPlace(result, [joiner]);
                }
            }
        }
    }
    return isProcessed;
}

const EDITOR_IDENTIFIER = 'POLYTOPE$$STRING';
const EDITOR_IDENTIFIER_STRING = `"${EDITOR_IDENTIFIER}"`;
export const processGraph = (innerString, result) => {
    try {
        // Replace inner editors with a simple value so that JSON parse can parse
        // the innerString (hack).
        let massagedInnerString = '';
        let innerEditors = [];
        for (let i = 0; i < innerString.length; i++) {
            const slotOrChar = innerString[i];
            if (typeof slotOrChar !== 'string') {
                innerEditors.unshift(slotOrChar);
                massagedInnerString += EDITOR_IDENTIFIER_STRING;
            } else {
                const char = slotOrChar;
                massagedInnerString += char;
            }
        }
        const innerJSON = JSON.parse(massagedInnerString);

        const isProbablyValid =
            Array.isArray(innerJSON.nodes) &&
            Array.isArray(innerJSON.edges) &&
            Array.isArray(innerJSON.positions);
        if (isProbablyValid) {
            innerJSON.nodes = innerJSON.nodes.map(node => (node === EDITOR_IDENTIFIER) ? innerEditors.pop() : node);
            innerJSON.edges = innerJSON.edges.map(edge => (edge === EDITOR_IDENTIFIER) ? innerEditors.pop() : edge);
            innerJSON.positions = innerJSON.positions.map(pos => (pos === EDITOR_IDENTIFIER) ? innerEditors.pop() : pos);

            const graphEditorElement = new GraphEditorElement(innerJSON)
            concatInPlace(result, [graphEditorElement]);
            return true;
        }
    } catch (e) {
        //console.error('processGraph error', e);
    }

    return false;
};

export const processColoredGraph = (innerString, result) => {
    try {
        // Replace inner editors with a simple value so that JSON parse can parse
        // the innerString (hack).
        let massagedInnerString = '';
        let innerEditors = [];
        for (let i = 0; i < innerString.length; i++) {
            const slotOrChar = innerString[i];
            if (typeof slotOrChar !== 'string') {
                innerEditors.unshift(slotOrChar);
                massagedInnerString += EDITOR_IDENTIFIER_STRING;
            } else {
                const char = slotOrChar;
                massagedInnerString += char;
            }
        }
        const innerJSON = JSON.parse(massagedInnerString);

        const isProbablyValid = innerJSON.isColoredGraph;
        if (isProbablyValid) {
            innerJSON.nodes = innerJSON.nodes.map(node => (node === EDITOR_IDENTIFIER) ? innerEditors.pop() : node);
            innerJSON.edges[0] = innerJSON.edges[0].map(edge => (edge === EDITOR_IDENTIFIER) ? innerEditors.pop() : edge);
            innerJSON.edges[1] = innerJSON.edges[1].map(edge => (edge === EDITOR_IDENTIFIER) ? innerEditors.pop() : edge);
            innerJSON.edges[2] = innerJSON.edges[2].map(edge => (edge === EDITOR_IDENTIFIER) ? innerEditors.pop() : edge);
            innerJSON.edges[3] = innerJSON.edges[3].map(edge => (edge === EDITOR_IDENTIFIER) ? innerEditors.pop() : edge);
            innerJSON.positions = innerJSON.positions.map(pos => (pos === EDITOR_IDENTIFIER) ? innerEditors.pop() : pos);

            const graphEditorElement = new ColoredGraphEditorElement(innerJSON)
            concatInPlace(result, [graphEditorElement]);
            return true;
        }
    } catch (e) {
        //console.error('processColoredGraph error', e);
    }

    return false;
};

export const processForceGraph = (innerString, result) => {
    try {
        // Replace inner editors with a simple value so that JSON parse can parse
        // the innerString (hack).
        let massagedInnerString = '';
        let innerEditors = [];
        for (let i = 0; i < innerString.length; i++) {
            const slotOrChar = innerString[i];
            if (typeof slotOrChar !== 'string') {
                innerEditors.unshift(slotOrChar);
                massagedInnerString += EDITOR_IDENTIFIER_STRING;
            } else {
                const char = slotOrChar;
                massagedInnerString += char;
            }
        }
        const innerJSON = JSON.parse(massagedInnerString);

        const isProbablyValid =
            Array.isArray(innerJSON.nodes) &&
            Array.isArray(innerJSON.edges);

        if (isProbablyValid) {
            innerJSON.nodes = innerJSON.nodes.map(node => (node === EDITOR_IDENTIFIER) ? innerEditors.pop() : node);
            innerJSON.edges = innerJSON.edges.map(edge => (edge === EDITOR_IDENTIFIER) ? innerEditors.pop() : edge);

            const graphEditorElement = new ForceGraphEditorElement(innerJSON)
            concatInPlace(result, [graphEditorElement]);
            return true;
        }
    } catch (e) {
        //console.error('processForceGraph error', e);
    }

    return false;
};

export const stringToEditor = (string, hasOpenParen = false) => {
    let result = [];

    for (let i = 0; i < string.length; i++) {
        const char = string[i];

        if (char === '(') {
            const { consume, output } = stringToEditor(string.substring(i + 1), true);

            let isProcessed = false;
            isProcessed |= processMath(mathOperations, string, i, output, result);
            if (!isProcessed) isProcessed |= processColoredGraph(output, result);
            if (!isProcessed) isProcessed |= processGraph(output, result);
            if (!isProcessed) isProcessed |= processForceGraph(output, result);

            i = i + consume + 1;

            if (!isProcessed) {
                result = [...result, '(', ...output, ')'];
            }

        } else if (hasOpenParen && char === ')') {
            return {
                consume: i,
                output: result
            }
        } else {
            result = [...result, char];
        }
    }
    return {
        consume: string.length,
        output: result
    };
}

function concatInPlace(array, otherArray) {
    for (const entry of otherArray) array.push(entry);
}
