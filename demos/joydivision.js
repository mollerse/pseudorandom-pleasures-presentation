import { BLACK, WHITE } from "./util/colors";
import { normalize } from "./util/tools";
import { createNoise2D } from "simplex-noise";

let WIDTH, HEIGHT;
const NAME = "Joy Division";

let noise2d = createNoise2D();

let c, ctx, data;
let off = 0;

let fill = BLACK;
let stroke = WHITE;

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
      .addNumberValue("regen", [true], {
        onChange: randomize,
        triggerId: 9,
      })
      .addBooleanValue("move", [false], {
        triggerId: 10,
      })
      .addNumberValue("numLines", [1, 1, 100], {
        onChange: initData,
        triggerId: 21,
      })
      .addNumberValue("lineWidth", [2, 0.5, 10, 0.5], {
        onChange: initData,
        triggerId: 22,
      })
      .addNumberValue("octaves", [1, 1, 6], {
        onChange: initData,
        triggerId: 26,
      })
      .addNumberValue("ampInit", [0, 0, HEIGHT / 5, HEIGHT / 100], {
        onChange: initData,
        triggerId: 27,
      })
      .addNumberValue("hzInit", [4, 1, 16, 0.5], {
        onChange: initData,
        triggerId: 28,
      })
      .addNumberValue("ampFalloff", [2, 1, 6, 0.1], {
        onChange: initData,
        triggerId: 47,
      })
      .addNumberValue("hzIncrease", [2, 1, 6, 0.1], {
        onChange: initData,
        triggerId: 48,
      })
      .addNumberValue("frac", [0.0, 0.0, 0.6, 0.01], {
        onChange: initData,
        triggerId: 41,
      })
      .addBooleanValue("cycleColor", [true], {
        onChange: cycleColor,
        triggerId: 11,
      });
  }
}

let currentPallette = 0;
function cycleColor() {
  let pallette = [
    [BLACK, WHITE],
    [WHITE, BLACK],
    [BLACK, "hotpink"],
    [WHITE, "aquamarine"],
    [BLACK, "cyan"],
  ];

  currentPallette++;

  if (currentPallette === pallette.length) {
    currentPallette = 0;
  }

  fill = pallette[currentPallette][0];

  stroke = pallette[currentPallette][1];
}

function randomize() {
  noise2d = createNoise2D();
  initData();
}

function linearDist(x) {
  let center = WIDTH / 4;
  let dist = Math.abs(center - x);

  let normalizedDist = normalize(0, WIDTH / 4, dist); // [0, 1]
  let inverted = 1 - normalizedDist;

  let frac = c.getValue("frac");

  let clamped = Math.max(frac + 0.1, Math.min(1.0, inverted)) - frac;

  return clamped;
}

function initData() {
  data = [];

  let z = 0.0002;

  for (let n = 0; n < c.getValue("numLines"); n++) {
    let line = Array(Math.floor(WIDTH / 2))
      .fill(1)
      .map((_, i) => [i, HEIGHT]);

    let hz = c.getValue("hzInit");
    let amp = c.getValue("ampInit");
    for (let j = 1; j < c.getValue("octaves") + 1; j++) {
      for (let i = 0; i < line.length; i++) {
        // let deltaC = normalDist(i);
        let deltaC = linearDist(i) ** 2;
        let octaveNoise = normalize(-1, 1, noise2d(z * hz * i + 100 * n + off, 0));
        line[i][1] -= octaveNoise * deltaC * amp;
      }
      hz = hz * c.getValue("hzIncrease");
      amp = amp / c.getValue("ampFalloff");
    }
    data.push(line);
  }
}

function drawLine(m) {
  ctx.save();
  ctx.translate(WIDTH / 4, -HEIGHT / 10 - (HEIGHT / 1.25 / data.length) * m);
  ctx.beginPath();
  data[m].slice(0, -2).forEach(([x, y], i) => {
    let cpx = (x + data[m][i + 1][0]) / 2;
    let cpy = (y + data[m][i + 1][1]) / 2;

    ctx.quadraticCurveTo(x, y, cpx, cpy);
  });
  let n = data[m].length - 2;
  ctx.quadraticCurveTo(data[m][n][0], data[m][n][1], data[m][n + 1][0], data[m][n + 1][1]);
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.fill();
  ctx.restore();
  ctx.stroke();
  ctx.restore();
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

  if (c.getValue("move")) {
    initData();
  }

  ctx.save();

  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.strokeStyle = stroke;
  ctx.lineWidth = c.getValue("lineWidth");

  for (let i = data.length - 1; i > -1; i--) {
    drawLine(i);
  }

  ctx.restore();
  if (c.getValue("move")) {
    off += 0.0075;
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
