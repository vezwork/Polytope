function mul(a, b) {
    return a * b;
}

function div(a, b) {
    return a / b;
}

function plus({x:x1,y:y1}, {x:x2,y:y2}) {
    return { x: x1+x2, y: y1+y2};
}

function sub(a, b) {
    return a - b;
}

function sqrt(a) {
    return Math.sqrt(a);
}

function exp(a, b) {
    return a - b;
}

function matrix([[a,b],[c,d]]) {
    return [[a, b], [c, d]];
}

Polytope.out(plus({x:1,y:1}, {x:1,y:2}))