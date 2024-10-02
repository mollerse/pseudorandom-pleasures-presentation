import { createNoise2D } from "simplex-noise";
import { KNOBS, MESSAGES, TEMPLATES, PADS } from "@mollerse/midi-control/devices/launch-control.js";

import { BLACK, WHITE } from "./util/colors.js";
import { normalize } from "./util/tools.js";

/** @type {number} */
let WIDTH;
/** @type {number} */
let HEIGHT;
const NAME = "Joy Division";

let noise2d = createNoise2D();

/** @type {MidiControl.MidiControl} */
let c;
/** @type {CanvasRenderingContext2D} */
let ctx;
/** @type {number[][][]} */
let data;
let off = 0;

let fill = BLACK;
let stroke = WHITE;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {MidiControl.MidiControl} controls
 */
function init(canvas, controls) {
  WIDTH = canvas.width;
  HEIGHT = canvas.height;
  initControls(controls);
  initData();

  ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext("2d"));
}

/**
 * @param {MidiControl.MidiControl} controls
 */
function initControls(controls) {
  c = controls;
  try {
    c.activateBinding(NAME);
  } catch {
    c.createBinding(NAME);

    c.addBooleanValue(
      "regen",
      { initial: true },
      {
        onChange: randomize,
        keyId: PADS[1],
        messageType: MESSAGES[TEMPLATES.user].padOff,
      },
    )
      .addBooleanValue(
        "move",
        { initial: false },
        {
          keyId: PADS[2],
          messageType: MESSAGES[TEMPLATES.user].padOff,
        },
      )
      .addNumberValue(
        "numLines",
        { initial: 1, min: 1, max: 100, step: 1 },
        {
          keyId: KNOBS[1][1],
          messageType: MESSAGES[TEMPLATES.user].knob,
          onChange: initData,
        },
      )
      .addNumberValue(
        "lineWidth",
        { initial: 2, min: 0.5, max: 10, step: 0.5 },
        {
          keyId: KNOBS[1][2],
          messageType: MESSAGES[TEMPLATES.user].knob,
          onChange: initData,
        },
      )
      .addNumberValue(
        "octaves",
        { initial: 1, min: 1, max: 6, step: 1 },
        {
          keyId: KNOBS[1][6],
          messageType: MESSAGES[TEMPLATES.user].knob,
          onChange: initData,
        },
      )
      .addNumberValue(
        "ampInit",
        { initial: 0, min: 0, max: HEIGHT / 5, step: HEIGHT / 100 },
        {
          keyId: KNOBS[1][7],
          messageType: MESSAGES[TEMPLATES.user].knob,
          onChange: initData,
        },
      )
      .addNumberValue(
        "hzInit",
        { initial: 4, min: 1, max: 16, step: 0.5 },
        {
          keyId: KNOBS[1][8],
          messageType: MESSAGES[TEMPLATES.user].knob,
          onChange: initData,
        },
      )
      .addNumberValue(
        "ampFalloff",
        { initial: 2, min: 1, max: 6, step: 0.1 },
        {
          keyId: KNOBS[2][7],
          messageType: MESSAGES[TEMPLATES.user].knob,
          onChange: initData,
        },
      )
      .addNumberValue(
        "hzIncrease",
        { initial: 2, min: 1, max: 6, step: 0.1 },
        {
          keyId: KNOBS[2][8],
          messageType: MESSAGES[TEMPLATES.user].knob,
          onChange: initData,
        },
      )
      .addNumberValue(
        "frac",
        { initial: 0.0, min: 0.0, max: 0.6, step: 0.01 },
        {
          keyId: KNOBS[2][1],
          messageType: MESSAGES[TEMPLATES.user].knob,
          onChange: initData,
        },
      )
      .addBooleanValue(
        "cycleColor",
        { initial: true },
        {
          keyId: PADS[3],
          messageType: MESSAGES[TEMPLATES.user].padOff,
          onChange: cycleColor,
        },
      );
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

/**
 * @param {number} x
 * @returns {number}
 */
function linearDist(x) {
  let center = WIDTH / 4;
  let dist = Math.abs(center - x);

  let normalizedDist = normalize(0, WIDTH / 4, dist); // [0, 1]
  let inverted = 1 - normalizedDist;

  let frac = c.getNumberValue("frac");

  let clamped = Math.max(frac + 0.1, Math.min(1.0, inverted)) - frac;

  return clamped;
}

function initData() {
  data = [];

  let z = 0.0002;

  for (let n = 0; n < c.getNumberValue("numLines"); n++) {
    let line = Array(Math.floor(WIDTH / 2))
      .fill(1)
      .map((_, i) => [i, HEIGHT]);

    let hz = c.getNumberValue("hzInit");
    let amp = c.getNumberValue("ampInit");
    for (let j = 1; j < c.getNumberValue("octaves") + 1; j++) {
      for (let i = 0; i < line.length; i++) {
        // let deltaC = normalDist(i);
        let deltaC = linearDist(i) ** 2;
        let octaveNoise = normalize(-1, 1, noise2d(z * hz * i + 100 * n + off, 0));
        line[i][1] -= octaveNoise * deltaC * amp;
      }
      hz = hz * c.getNumberValue("hzIncrease");
      amp = amp / c.getNumberValue("ampFalloff");
    }
    data.push(line);
  }
}

/**
 * @param {number} m
 * @returns {void}
 */
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

/** @type {number} */
let rafID;
/** @type {number} */
let t0 = 0;

function render(t = 0) {
  // FPS clamp
  let deltaT = t - t0;
  rafID = requestAnimationFrame(render);
  if (t0 && deltaT < 66) {
    return;
  }

  if (c.getBooleanValue("move")) {
    initData();
  }

  ctx.save();

  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.strokeStyle = stroke;
  ctx.lineWidth = c.getNumberValue("lineWidth");

  for (let i = data.length - 1; i > -1; i--) {
    drawLine(i);
  }

  ctx.restore();
  if (c.getNumberValue("move")) {
    off += 0.0075;
  }
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {MidiControl.MidiControl} controls
 */
function start(canvas, controls) {
  init(canvas, controls);
  render();
}

function stop() {
  cancelAnimationFrame(rafID);
  c.deactivateBinding(NAME);
}

export default { start, stop };
