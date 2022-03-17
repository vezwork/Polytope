// this solves exercise 4.9 a. in Visual Group Theory by Nathan Carter
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
    nodes: [e,r,r2,r3,r4,h,hr,hr2,hr3,hr4],
    edges: [[1],[2],[3],[4],[0],[6],[7],[8],[9],[5]],
    positions: [[97, 12],[207, 91],[156, 213],[36, 216],[2, 111],[98, 66],[56, 110],[66, 155],[130, 156],[138, 106]]
};

const blue = {
    nodes: [e,r,r2,r3,r4,h,hr,hr2,hr3,hr4],
    edges: [[5],[9],[8],[7],[6],[0],[4],[3],[2],[1]],
    positions: [[100, 10],[198, 106],[156, 219],[58, 216],[4, 116],[104, 61],[60, 115],[68, 160],[129, 159],[129, 112]]
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

// this solves exercise 4.9 b. in Visual Group Theory by Nathan Carter
// The pattern is that the multiplication table is divided into four
// quadrants. The top left and bottom right quadrants are the same
// and so are the the top right and bottom left. The top left/
// bottom right quadrants follow a diagonal pattern e r r2 ... rn.
// The top right/bottom left quadrants are the same but are
// prepended by h.
// EDIT: that was wrong, I realized after looking at https://nathancarter.github.io/group-explorer/GroupExplorer.html
// The actual pattern is that there are four quadrants, the
// top-right quadrant is the same as top-left but the rows are
// shifted in the opposite horizontal direction with h prepended.
// the bottom-left is a copy of the top-left but with h prepended.
// the bottom-right is a copy of the top-right but with h removed.



