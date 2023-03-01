import { rotateQuarter, scalarProj, sub, Vec2 } from "./Vec2.js";

export function isConvexShapesIntersecting(
  shapeVertices1: Vec2[],
  shapeVertices2: Vec2[]
) {
  return (
    !shapeVertices1.some(isSideSeperating) &&
    !shapeVertices2.some(isSideSeperating)
  );

  function isSideSeperating(vertex1: Vec2, i: number, shapeVertices: Vec2[]) {
    const vertex2 = shapeVertices[(i + 1) % shapeVertices.length];
    //axis orthogonal to line between vertex 1 and 2
    const axis = rotateQuarter(sub(vertex1, vertex2));

    let vertices1ProjectionsOntoAxis = shapeVertices1.map(scalarProj(axis));
    let vertices1ProjectionsMin = Math.min(...vertices1ProjectionsOntoAxis);
    let vertices1ProjectionsMax = Math.max(...vertices1ProjectionsOntoAxis);

    let vertices2ProjectionsOntoAxis = shapeVertices2.map(scalarProj(axis));
    let vertices2ProjectionsMin = Math.min(...vertices2ProjectionsOntoAxis);
    let vertices2ProjectionsMax = Math.max(...vertices2ProjectionsOntoAxis);

    return !(
      vertices1ProjectionsMax >= vertices2ProjectionsMin &&
      vertices2ProjectionsMax >= vertices1ProjectionsMin
    );
  }
}

export function isPointInsideConvexShape(shapeVertices: Vec2[], point: Vec2) {
  //TODO
}
