class StateMachine {
constructor({ nodes, edges }) {
    this.nodes = nodes;
    this.edges = edges;
    this.stateIndex = 0;
}

    next() {
        const currentEdges = this.edges[this.stateIndex];
        const randomEdge = Math.floor(
          Math.random() * currentEdges.length
        );
        this.stateIndex = currentEdges[randomEdge];
        return this.nodes[this.stateIndex];
    }
}

const stateMachine = new StateMachine(({
      "nodes": ["a","b","c"],
      "edges": [[1],[2],[0]],
      "positions": [[40, 55],[146, 91],[61, 161]]
  }));

setInterval(() => Polytope.out(stateMachine.next()), 1000);
