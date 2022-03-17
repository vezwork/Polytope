// this solves exercise 4.9 a) in Visual Group Theory by Nathan Carter
const e = 'e';
const r = 'r';
const r2 = 'r2';
const r3 = 'r3';
const r4 = 'r4';
const r5 = 'r5';
const h = 'h';
const hr = 'hr';
const hr2 = 'hr2';
const hr3 = 'hr3';
const hr4 = 'hr4';
const hr5 = 'hr5'; 

const red = {
    nodes: [e,r,r2,h,hr,hr2],
    edges: [[1],[2],[0],[4],[5],[3]],
    positions: [[43, 60],[80, 139],[12, 168],[156, 62],[134, 142],[193, 171]]
}

const blue = {
    nodes: [e,r,r2,h,hr,hr2],
    edges: [[3],[4],[5],[0],[1],[2]],
    positions: [[44, 69],[84, 152],[2, 189],[171, 68],[134, 153],[193, 191]]
}

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
			paths.set(w, [...paths.get(v), 'r']);
			redParents.set(w, v);
			explored.add(w);
			q.unshift(w);
		} 
	}
	for (const blueEdge of blue.edges[i]) {
		const w = blue.nodes[blueEdge];
		if (!explored.has(w)) {
			paths.set(w, [...paths.get(v), 'h']);
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
			if (arrow === 'r') {
				tracei = red.edges[tracei][0];
			}
			if (arrow === 'h') {
				tracei = blue.edges[tracei][0]
			}
		}
		if (!multiplicationTable[from]) multiplicationTable[from] = {};
		multiplicationTable[from][to] = red.nodes[tracei];	
	}
}
	
console.log(paths);
console.table(multiplicationTable);