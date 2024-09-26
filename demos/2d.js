import { createNoise3D } from "simplex-noise";
import { BLACK } from "./util/colors.js";
import { normalize } from "./util/tools.js";

let WIDTH, HEIGHT;
const NAME = "2D";

let noise3d = createNoise3D();

let c, ctx;
let xoff = 0;
let yoff = 0;

function init(canvas, controls) {
  WIDTH = canvas.width;
  HEIGHT = canvas.height;
  initControls(controls);

  ctx = canvas.getContext("2d");
}

function initControls(controls) {
  c = controls;
  try {
    c.loadScheme(NAME);
  } catch (e) {
    c.addScheme(NAME)
      .addNumberValue("xoff", [0, 0, 2500, 1], {
        triggerId: 21,
      })
      .addNumberValue("yoff", [0, 0, 2500, 1], {
        triggerId: 22,
      })
      .addNumberValue("zoff", [0, 0, 100, 1], {
        triggerId: 23,
      })
      .addNumberValue("zoom", [0.01, 0.01, 0.1, 0.001], {
        triggerId: 24,
      })
      .addNumberValue("deltax", [0, -10, 10, 0.1], {
        triggerId: 41,
      })
      .addNumberValue("deltay", [0, -10, 10, 0.1], {
        triggerId: 42,
      })

      .addBooleanValue("move", [false], { triggerId: 9 })
      .addBooleanValue("regen", [false], {
        triggerId: 10,
        onChange: randomize,
      });
  }
}

function randomize() {
  noise3d = createNoise3D();
}

let rafID = null;
let t0 = 0;
function render(t) {
  // FPS clamp
  let deltaT = t - t0;
  rafID = requestAnimationFrame(render);
  if (t0 && delta < 66) {
    return;
  }

  ctx.save();

  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.scale(5, 5);
  ctx.translate(WIDTH / 20, HEIGHT / 20);

  for (let i = 0; i < WIDTH / 10; i++) {
    for (let j = 0; j < HEIGHT / 10; j++) {
      let n = noise3d(
        (i + c.getValue("xoff") + xoff) * c.getValue("zoom"),
        (j + c.getValue("yoff") + yoff) * c.getValue("zoom"),
        c.getValue("zoff") * 0.01,
      );
      let v = normalize(-1, 1, n);
      ctx.fillStyle = `hsl(${v * 360}, 100%, 50%)`;
      ctx.fillRect(i, j, 1, 1);
    }
  }

  ctx.restore();
  if (c.getValue("move")) {
    xoff += c.getValue("deltax");
    yoff += c.getValue("deltay");
  }
}

function start(canvas, controls) {
  init(canvas, controls);
  render();
}

function stop() {
  cancelAnimationFrame(rafID);
  c.unloadScheme(NAME);
}

export default { start, stop };
