import { Group } from "http://localhost:8080/groupTheory.js";

export const z3 = new Group({
    cayleeGraph: ({"nodes":["0","1","2"],"edges":{"0":[[1],[2],[0]],"1":[[],[],[]],"2":[[],[],[]],"3":[[],[],[]]},"positions":[[103,76],[145,148],[55,149]],"isColoredGraph":true})
});

export const a4 = new Group({
    cayleeGraph: ({"nodes":["e","x","c","d","a","b","d2","b2","a2","c2","z","y"],"edges":{"0":[[4],[5],[6],[7],[8],[9],[10],[11],[0],[1],[2],[3]],"1":[[1],[0],[4],[5],[2],[3],[9],[8],[7],[6],[11],[10]],"2":[[],[],[],[],[],[],[],[],[],[],[],[]],"3":[[],[],[],[],[],[],[],[],[],[],[],[]]},"positions":[[25,19],[91,19],[141,17],[211,18],[0,108],[56,108],[112,109],[172,106],[19,197],[85,200],[140,197],[211,198]],"isColoredGraph":true})
});

export const s1 = new Group({
    cayleeGraph: ({"nodes":["0"],"edges":{"0":[[]],"1":[[]],"2":[[]],"3":[[]]},"positions":[[102,111]],"isColoredGraph":true})
});
export const s2 = new Group({
    cayleeGraph: ({"nodes":["0","1"],"edges":{"0":[[1],[0]],"1":[[],[]],"2":[[],[]],"3":[[],[]]},"positions":[[77,116],[140,118]],"isColoredGraph":true})
});
export const s3 = new Group({
    cayleeGraph: ({"nodes":["0","1","2","3","4","5"],"edges":{"0":[[1],[2],[0],[5],[3],[4]],"1":[[3],[4],[5],[0],[1],[2]],"2":[[],[],[],[],[],[]],"3":[[],[],[],[],[],[]]},"positions":[[104,43],[201,192],[19,194],[103,104],[139,162],[70,162]],"isColoredGraph":true})
});

console.log(s3);
