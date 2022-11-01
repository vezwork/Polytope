import { segProj } from "./math/Line2.js";
import { Vec2 } from "./math/Vec2.js";

const c = document.getElementById("c") as HTMLCanvasElement;
const ctx = c.getContext("2d") as CanvasRenderingContext2D;

const mouse: [number, number] = [0, 0];

const seg: [Vec2, Vec2] = [
  [100, 150],
  [150, 200],
];

c.addEventListener("mousemove", (e) => {
  mouse[0] = e.offsetX;
  mouse[1] = e.offsetY;
});

function draw() {
  ctx.clearRect(0, 0, c.width, c.height);

  ctx.fillStyle = "red";
  ctx.fillRect(...mouse, 10, 10);

  ctx.beginPath();
  ctx.moveTo(...seg[0]);
  ctx.lineTo(...seg[1]);
  ctx.stroke();

  ctx.fillStyle = "blue";
  ctx.fillRect(...segProj(seg)(mouse), 10, 10);

  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
