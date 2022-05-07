const g = ({"nodes":["0","1","2","3","4","5","6"],"edges":{"0":[[1],[2],[3],[4],[5],[6],[0]],"1":[[],[],[],[],[],[],[]],"2":[[],[],[],[],[],[],[]],"3":[[],[],[],[],[],[],[]]},"positions":[[86,65],[173,95],[140,177],[79,192],[30,157],[30,98],[39,53]],"isColoredGraph":true});
const gPaths = generatorPaths(g);
const gMul = multiplicationTable(g, gPaths);

const gSq = gMap(g, e => gMul[e][e]);
Polytope.out(gSq);
