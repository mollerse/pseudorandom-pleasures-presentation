import { BLACK, WHITE } from "./util/colors";
import { createNoise3D } from "simplex-noise";
import { normalize } from "./util/tools";

let WIDTH, HEIGHT;
const NAME = "Simplex Octaves 2D";

const N = 100;
const M = 100;

let noise3d = createNoise3D();

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
      .addNumberValue("ampInit", [1, 1, 10, 0.01], {
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
  noise3d = createNoise3D();
  initData();
}

function initData() {
  let num = c.getValue("octaves");
  octaves = Array(num)
    .fill(1)
    .map(() => Array(N * M));
  data = Array(N * M).fill(0);
  let z = 0.01;
  let hz = c.getValue("hzInit");
  let amp = c.getValue("ampInit");

  for (let o = 1; o < num + 1; o++) {
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < M; j++) {
        let octaveNoise = noise3d(z * hz * i, z * hz * j, 0);
        data[i * N + j] += octaveNoise * amp;
        octaves[o - 1][i * N + j] = octaveNoise * amp;
      }
    }

    hz = hz * c.getValue("hzIncrease");
    amp = amp / c.getValue("ampFalloff");
  }
}

function drawConstituentSimplex(m) {
  ctx.save();
  ctx.scale(0.15, 0.15);

  if (m > 2) {
    ctx.translate(WIDTH * (m - 3) + (WIDTH / 3) * (m - 3) + WIDTH * 1.5, HEIGHT + HEIGHT / 4);
  } else {
    ctx.translate(WIDTH * m + (WIDTH / 3) * m + WIDTH * 1.5, HEIGHT / 4);
  }

  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.strokeStyle = "hotpink";
  ctx.strokeRect(0, 0, WIDTH, HEIGHT);

  for (let i = 0; i < N; i++) {
    for (let j = 0; j < M; j++) {
      let val = octaves[m][i * N + j];
      let v = normalize(-1, 1, val);
      ctx.fillStyle = `hsl(${v * 360}, 100%, 50%)`;
      ctx.fillRect((i * WIDTH) / N, (j * HEIGHT) / M, WIDTH / N, HEIGHT / M);
    }
  }

  ctx.restore();
}

function drawMainSimplex() {
  ctx.save();
  ctx.scale(0.5, 0.5);
  ctx.translate(WIDTH / 2, 0.75 * HEIGHT);
  ctx.beginPath();
  ctx.moveTo(0, HEIGHT / 2);
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < M; j++) {
      let val = data[i * N + j];
      let v = normalize(-1, 1, val);
      ctx.fillStyle = `hsl(${v * 360}, 100%, 50%)`;
      ctx.fillRect((i * WIDTH) / N, (j * HEIGHT) / M, WIDTH / N, HEIGHT / M);
    }
  }
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
