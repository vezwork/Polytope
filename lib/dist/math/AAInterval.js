export const positive = ({ coord, range: [n1, n2] }) => ({
    coord,
    range: [Math.min(n1, n2), Math.max(n1, n2)],
});
export const dist = (a, b) => { };
