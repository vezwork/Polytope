
export function generatorPaths({
    nodes,
    edges
}) {
    const q = [];
    const explored = new Set();
    const pathParent = [];
    for (const generatorIndex of Object.keys(edges)) {
        pathParent[generatorIndex] = new Map();
    }
    const paths = new Map();
    paths.set(nodes[0], []);

    explored.add(0);
    q.unshift(0);

    // breadth first search to find shortest path from e to each node via the generators (edges)
    while (q.length > 0) {
        const fromNodeIndex = q.pop();

        for (const [generatorIndex, generatorEdges] of Object.entries(edges)) {
            for (const toNodeIndex of generatorEdges[fromNodeIndex]) {

                if (!explored.has(toNodeIndex)) {
                    paths.set(nodes[toNodeIndex], [...paths.get(nodes[fromNodeIndex]), generatorIndex]);
                    pathParent[generatorIndex].set(toNodeIndex, fromNodeIndex);
                    explored.add(fromNodeIndex);
                    q.unshift(toNodeIndex);
                }
            }
        }
    }
    return paths;
}



export function multiplicationTable({ nodes, edges }, paths) {
    const multiplicationTable = {};

    for (let i = 0; i < nodes.length; i++) {
        const from = nodes[i];
        for (let j = 0; j < nodes.length; j++) {
            const to = nodes[j];
            let tracei = i;
            for (const generator of paths.get(to)) {
                tracei = edges[generator][tracei][0];
            }
            if (!multiplicationTable[from]) multiplicationTable[from] = {};
            multiplicationTable[from][to] = nodes[tracei];
        }
    }
    return multiplicationTable;
}

export function cycleGraph(multiplicationTable) {
    const nodes = Object.keys(multiplicationTable);
    const id = nodes[0];
    const edges = nodes.map(v => []);

    for (let i = 0; i < nodes.length; i++) {
        const el = nodes[i];

        edges[0].push(i);
        let cur = el;
        while (cur !== id) {
            const next = multiplicationTable[cur][el];

            const curIndex = nodes.findIndex((v) => v === cur)
            const nextIndex = nodes.findIndex((v) => v === next)
            edges[curIndex].push(nextIndex);

            cur = next;
        }
    }

    return {
        nodes,
        edges
    }
}

export class Group {

    identityElement;
    elements = [];
    mulTable = {};

    constructor({ cayleeGraph, mulTable }) {
        if (!Boolean(cayleeGraph) && !Boolean(mulTable)) {
            throw 'Group constructor: expecting a cayleeGraph or multiplicationTable!'
        }
        if (Boolean(cayleeGraph) && !Boolean(mulTable)) {
            this.mulTable = multiplicationTable(cayleeGraph, generatorPaths(cayleeGraph));
        }
        if (!Boolean(cayleeGraph) && Boolean(mulTable)) {
            this.mulTable = mulTable;
        }
        this.elements = Object.keys(this.mulTable);
        // This class assumes that the first element in the multiplication table is the identity
        this.identityElement = this.elements[0];

    }

    action(elementA, elementB) {
        return this.mulTable[elementA][elementB];
    }

    exponentiate(element, integer) {
        if (integer === 0) return this.identityElement;
        let currentElement = element;
        for (let i = 1; i < integer; i++) {
            currentElement = this.mulTable[currentElement][element];
        }
        return currentElement;
    }
}
