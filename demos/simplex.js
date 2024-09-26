import { BLACK, WHITE } from "./util/colors";
import { createNoise2D } from "simplex-noise";

let WIDTH, HEIGHT;
const NAME = "Simplex";

let noise2d = createNoise2D();

let c, ctx, data;
let off = 0;

function init(canvas, controls) {
  WIDTH = canvas.width;
  HEIGHT = canvas.height;
  initControls(controls);
  initData();

  ctx = canvas.getContext("2d");
}

function initControls(controls) {
  c = controls;
  try {
    c.loadScheme(NAME);
  } catch (e) {
    c.addScheme(NAME)
      .addNumberValue("numDots", [35, 5, 250], {
        onChange: initData,
        triggerId: 21,
      })
      .addNumberValue("samplerate", [0.002, 0.001, 0.01, 0.0001], {
        onChange: initData,
        triggerId: 22,
      })
      .addNumberValue("xoff", [0, 0, 2500, 10], {
        onChange: initData,
        triggerId: 23,
      })
      .addNumberValue("yoff", [0, 0, 1, 0.001], { triggerId: 42, onChange: initData })
      .addNumberValue("thickness", [5, 0.5, 50, 0.5], { triggerId: 41 })
      .addBooleanValue("line", [true], { triggerId: 9 })
      .addBooleanValue("regen", [false], { triggerId: 10, onChange: randomize })
      .addBooleanValue("move", [false], { triggerId: 11 });
  }
}

function randomize() {
  noise2d = createNoise2D();
  initData();
}

function initData() {
  let n = c.getValue("numDots");
  let z = c.getValue("samplerate");
  let xoff = c.getValue("xoff");
  data = [];

  if (c.getValue("move")) {
    xoff += off;
  }

  for (let i = 0; i < WIDTH; i++) {
    let noise = noise2d(z * (i + xoff), c.getValue("yoff"));
    if (i % Math.floor(WIDTH / n) === 0) {
      data.push([i, HEIGHT / 2 + noise * (HEIGHT / 4)]);
    }
  }
}

let rafID = null;
let t0 = 0;
function render(t) {
  // FPS clamp
  let deltaT = t - t0;
  rafID = requestAnimationFrame(render);
  if (t0 && delta < 33) {
    return;
  }

  if (c.getValue("move")) {
    initData();
  }

  ctx.save();

  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.strokeStyle = WHITE;
  ctx.fillStyle = WHITE;

  let w = c.getValue("thickness");

  ctx.lineWidth = w;

  if (c.getValue("line")) {
    ctx.beginPath();
    ctx.moveTo(0, HEIGHT / 2);
    data.slice(0, -2).forEach(([x, y], i) => {
      let cpx = (x + data[i + 1][0]) / 2;
      let cpy = (y + data[i + 1][1]) / 2;

      ctx.quadraticCurveTo(x, y, cpx, cpy);
    });
    let n = data.length - 2;
    ctx.quadraticCurveTo(data[n][0], data[n][1], data[n + 1][0], data[n + 1][1]);

    ctx.stroke();
  } else {
    data.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, w, 0, 2 * Math.PI, true);
      ctx.fill();
    });
  }

  ctx.restore();
  if (c.getValue("move")) {
    off += 10;
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
