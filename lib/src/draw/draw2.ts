import { Line2 } from "../math/Line2";
import { Vec2 } from "../math/Vec2";

type Input = "click"; // or drag/drop or deleteChild

type BaseDrawable = {
  //transform: [number, number, number, number, number, number];
  //opacity: number;
  //dimensions: Vec2;
  //padding: [number, number, number, number];
};
type Drawable = BaseDrawable &
  (
    | { diagram: Diagram }
    | { line: Line2; stroke: string; fill: string }
    | { beside: Drawable[] }
    | { over: Drawable[] }
  );

type NewOp<T> = T; // if all you can do is change
type ArrayOp<T> =
  | { del: number[] }
  | { add: T; pos: number }
  | { permute: [number, number][] };

type ΔDrawable =
  | NewOp<Drawable>
  | (Partial<{
      //transform: "transformOps";
      //opacity: "numOps";
      //dimensions: "vec2Ops";
      //padding: "paddingOps";
    }> & { diagram: "delete" } & Partial<{
        line: NewOp<Line2>;
        stroke: NewOp<string>;
        fill: NewOp<string>;
      }> & { beside: ArrayOp<NewOp<Drawable>>[] } & {
        over: ArrayOp<NewOp<Drawable>>[];
      });

type Diagram = (input: Input) => (prev: Drawable | "init") => ΔDrawable;
//ΔDrawable is something that records traversals and modifications on the Drawable
//but the modifications cannot be totally arbitrary: they can be any function but somehow identity of items needs to be preserved.
//The reason we want the user to construct a record of what has changed is because it allows us to only
//re-render those things.
// but how does this strategy work with an array? If we permute an array, we shouldn't re-render the entire
// thing right? Or, well, I guess we may have to, depending on how the array will be rendered. But, we may not
// have to.... How do we deal with that?
// oh shit. This entire strategy doesn't work because changes at the bottom of the drawable tree (e.g. size) can
// cause everything to need to be re-rendered.
// rendering bottom up doesnt work either (changes in transform at the top affect everything below).
// deltas only help with
// - changing drawable to new drawable (could just have Drawable -> Drawable)
// - history (could just have Drawable -> Drawable although diffs compose better in multiplayer)
// - if we know which changes require re-renders up the tree (i.e. appends are not allowd to cause siblings to re-render -- Not realistic, imagine appending a tall editor in a line with other editors)

export interface Lens<S, A> {
  readonly get: (s: S) => A;
  readonly set: (a: A) => (s: S) => S;
}
export const lens = <S, A>(
  get: Lens<S, A>["get"],
  set: Lens<S, A>["set"]
): Lens<S, A> => ({ get, set });
export const lensComposeLens =
  <A, B>(ab: Lens<A, B>) =>
  <S>(sa: Lens<S, A>): Lens<S, B> =>
    lens(
      (s) => ab.get(sa.get(s)),
      (b) => (s) => sa.set(ab.set(b)(sa.get(s)))(s)
    );

const idLens = lens(
  (s) => s,
  (a) => (s) => s
);

const objPropsLens = (propName: string | number) =>
  lens<{}, any>(
    (s) => s[propName],
    (a) => (s) => ((s[propName] = a), s)
  );

// const fLens = <A>(f: (a: A) => A) =>
//   lens<{}, A>(
//     (s) => s,
//     (a) => (s) => (console.log(f(a)), s)
//   );
