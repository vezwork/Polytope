export const lens = (get, set) => ({ get, set });
export const lensComposeLens = (ab) => (sa) => lens((s) => ab.get(sa.get(s)), (b) => (s) => sa.set(ab.set(b)(sa.get(s)))(s));
const idLens = lens((s) => s, (a) => (s) => s);
const objPropsLens = (propName) => lens((s) => s[propName], (a) => (s) => ((s[propName] = a), s));
// const fLens = <A>(f: (a: A) => A) =>
//   lens<{}, A>(
//     (s) => s,
//     (a) => (s) => (console.log(f(a)), s)
//   );
