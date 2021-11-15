const { generatorPaths, multiplicationTable } = await import("./group_theory.js");

const group = ({
    "isColoredGraph": true,
    "nodes": ["e", "x", "c", "d", "a", "b", "d2", "b2", "a2", "c2", "z", "y"],
    "edges": {
        "0": [[4], [5], [6], [7], [8], [9], [10], [11], [0], [1], [2], [3]],
        "1": [[1], [0], [4], [5], [2], [3], [9], [8], [7], [6], [11], [10]],
        "2": [[], [], [], [], [], [], [], [], [], [], [], []],
        "3": [[], [], [], [], [], [], [], [], [], [], [], []]
    },
    "positions": [[13, 13], [67, 17], [121, 17], [195, 15], [0, 108], [56, 108], [112, 109], [172, 106], [11, 197], [72, 195], [141, 192], [199, 194]]
});

const groupPaths = generatorPaths(group);

console.log(groupPaths)
console.table(
    multiplicationTable(group, groupPaths)
);
