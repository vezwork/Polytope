const addOneToNodes = ({ nodes, edges }) => ({
  nodes: nodes.map((node) => Number(node) + 1),
  edges,
});

const graph = ({
      "nodes": ["0","1","3","4","2"],
      "edges": [[1,2,3,4],[0,2,4,3],[0,1,3,4],[0,2,1,4],[2,1,3,0]]
  });

const exampleMusic = ([{"note":"e4","length":1},{"note":"f4","length":1},{"note":"g4","length":1},{"note":"e4","length":1},{"note":"f4","length":1},{"note":"g4","length":1},{"note":"e4","length":1},{"note":"f4","length":1},{"note":"g4","length":1}]);
const modifiedGraph = addOneToNodes(graph);

Polytope.out(modifiedGraph)