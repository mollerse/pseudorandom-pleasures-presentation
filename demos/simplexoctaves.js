import { BLACK, WHITE } from "./util/colors";
import { random2 } from "./util/random";
import { createNoise2D } from "simplex-noise";

let WIDTH, HEIGHT;
const NAME = "Simplex Octaves";

let noise2d = createNoise2D();

let c, ctx, data, octaves;
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
      .addNumberValue("octaves", [1, 1, 6], {
        onChange: initData,
        triggerId: 21,
      })
      .addNumberValue("regen", [true], {
        onChange: randomize,
        triggerId: 9,
      })
      .addNumberValue("ampInit", [HEIGHT / 2, HEIGHT / 10, HEIGHT, HEIGHT / 10], {
        onChange: initData,
        triggerId: 22,
      })
      .addNumberValue("hzInit", [4, 1, 8, 1], {
        onChange: initData,
        triggerId: 23,
      })
      .addNumberValue("ampFalloff", [2, 1, 6, 0.1], {
        onChange: initData,
        triggerId: 42,
      })
      .addNumberValue("hzIncrease", [2, 1, 6, 0.1], {
        onChange: initData,
        triggerId: 43,
      });
  }
}

function randomize() {
  noise2d = createNoise2D();
  initData();
}

function initData() {
  let num = c.getValue("octaves");
  octaves = Array(num)
    .fill(1)
    .map(() => []);
  data = Array(WIDTH)
    .fill(1)
    .map((_, i) => [i, HEIGHT / 2]);
  let z = 0.0002;
  let hz = c.getValue("hzInit");
  let amp = c.getValue("ampInit");

  for (let j = 1; j < num + 1; j++) {
    for (let i = 0; i < WIDTH; i++) {
      let octaveNoise = noise2d(z * hz * i, 0);
      data[i][1] += octaveNoise * amp;
      octaves[j - 1].push([i, HEIGHT / 2 + octaveNoise * amp]);
    }
    hz = hz * c.getValue("hzIncrease");
    amp = amp / c.getValue("ampFalloff");
  }
}

function drawConstituentSimplex(m) {
  ctx.save();
  ctx.scale(0.15, 0.15);
  ctx.lineWidth = 2 / 0.15;

  if (m > 2) {
    ctx.translate(WIDTH * (m - 3) + (WIDTH / 3) * (m - 3) + WIDTH * 1.5, HEIGHT + HEIGHT / 4);
  } else {
    ctx.translate(WIDTH * m + (WIDTH / 3) * m + WIDTH * 1.5, HEIGHT / 4);
  }
  ctx.beginPath();
  ctx.moveTo(0, HEIGHT / 2);
  octaves[m].slice(0, -2).forEach(([x, y], i) => {
    let cpx = (x + octaves[m][i + 1][0]) / 2;
    let cpy = (y + octaves[m][i + 1][1]) / 2;

    ctx.quadraticCurveTo(x, y, cpx, cpy);
  });
  let n = octaves[m].length - 2;
  ctx.quadraticCurveTo(
    octaves[m][n][0],
    octaves[m][n][1],
    octaves[m][n + 1][0],
    octaves[m][n + 1][1],
  );
  ctx.stroke();
  ctx.restore();
}

function drawMainSimplex() {
  ctx.save();
  ctx.scale(0.5, 0.5);
  ctx.translate(WIDTH / 2, 0.75 * HEIGHT);
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
  ctx.restore();
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

  ctx.save();

  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.strokeStyle = WHITE;
  ctx.fillStyle = WHITE;

  let w = 3;

  ctx.lineWidth = w;

  ctx.lineJoin = "round";

  drawMainSimplex();
  for (let i = 0; i < octaves.length; i++) {
    drawConstituentSimplex(i);
  }

  ctx.restore();
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
