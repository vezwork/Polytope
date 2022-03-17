class Superposition<T> {
    static from(x: any): any { }
}

function superposition(x: any): any { }
function outerProduct(x: any, y: any): any { }
function identity(x: any): any { }
function measure(x: any): any { }
function reflectionAboutSuperposition(x: any): any { }
function makeQuantumOracle(x: any): any { }
const π = Math.PI;


function groverSearch<A>(arr: Array<A>, predicate: (arrEl: A) => Boolean): A {
    let allArrIndices = Array.from(arr.keys());

    const init = Superposition.from(allArrIndices);

    const diffuse: (s: Superposition<Number>) => Superposition<Number>
        = reflectionAboutSuperposition(init);

    let indexSuperposition = init;
    const iterCount = Math.ceil(π * Math.sqrt(arr.length) / 4);
    for (let i = 0; i < iterCount; i++) {
        for (const index of indexSuperposition) {
            if (predicate(arr[index])) {
                indexSuperposition[index] *= -1;
            }
        }
        indexSuperposition = diffuse(indexSuperposition);
    }

    return measure(indexSuperposition);
}

// Returns 4 with high probability!
groverSearch([0, 1, 2, 3, 4], (a) => a > 3);
