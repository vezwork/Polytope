const e = 'e';
const x = 'x';
const c = 'c';
const d = 'd';
const a = 'a';
const b = 'b';
const d2 = 'd2';
const b2 = 'b2';
const a2 = 'a2';
const c2 = 'c2';
const z = 'z';
const y = 'y';

const red = {
	nodes: [e, a, a2, x, b, c2, c, d2, z, d, b2, y],
	edges: [[1], [2], [0], [4], [5], [3], [7], [8], [6], [10], [11], [9]],
	positions: [[15, 26], [36, 114], [6, 192], [69, 28], [92, 109], [70, 195], [129, 22], [146, 112], [134, 196], [193, 23], [209, 109], [190, 203]]
};

const blue = {
	nodes: [e, a, a2, x, b, c2, c, d2, z, d, b2, y],
	edges: [[3], [6], [10], [0], [9], [7], [1], [5], [11], [4], [2], [8]],
	positions: [[14, 30], [19, 113], [14, 197], [64, 29], [75, 114], [74, 198], [122, 31], [128, 116], [139, 198], [194, 26], [187, 116], [194, 195]]
};

const q = [];
const explored = new Set();
const redParents = new Map();
const blueParents = new Map();
const paths = new Map();
paths.set(e, []);

explored.add(e);
q.unshift(e);

while (q.length > 0) {
	const v = q.pop();
	// this relies on the fact that red.nodes and blue.nodes are the same
	const i = red.nodes.findIndex(va => va === v);
	for (const redEdge of red.edges[i]) {
		const w = red.nodes[redEdge];
		if (!explored.has(w)) {
			paths.set(w, [...paths.get(v), 'a']);
			redParents.set(w, v);
			explored.add(w);
			q.unshift(w);
		}
	}
	for (const blueEdge of blue.edges[i]) {
		const w = blue.nodes[blueEdge];
		if (!explored.has(w)) {
			paths.set(w, [...paths.get(v), 'x']);
			blueParents.set(w, v);
			explored.add(w);
			q.unshift(w);
		}
	}
}

// this relies on the fact that red.nodes and blue.nodes are the same
const multiplicationTable = {};
for (let i = 0; i < red.nodes.length; i++) {
	const from = red.nodes[i];
	for (let j = 0; j < red.nodes.length; j++) {
		const to = red.nodes[j];
		let tracei = i;
		for (const arrow of paths.get(to)) {
			if (arrow === 'a') {
				tracei = red.edges[tracei][0];
			}
			if (arrow === 'x') {
				tracei = blue.edges[tracei][0]
			}
		}
		if (!multiplicationTable[from]) multiplicationTable[from] = {};
		multiplicationTable[from][to] = red.nodes[tracei];
	}
}

console.log(paths);
console.table(multiplicationTable);
