import { createNoise2D } from "simplex-noise";
import { KNOBS, MESSAGES, TEMPLATES, PADS } from "@mollerse/midi-control/devices/launch-control.js";

import { BLACK, WHITE } from "./util/colors.js";

/** @type {number} */
let WIDTH;
/** @type {number} */
let HEIGHT;
const NAME = "Simplex Octaves";

let noise2d = createNoise2D();

/** @type {MidiControl.MidiControl} */
let c;
/** @type {CanvasRenderingContext2D} */
let ctx;
/** @type {number[][]} */
let data;
/** @type {number[][][]} */
let octaves;

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
    c.addNumberValue(
      "octaves",
      { initial: 1, min: 1, max: 6, step: 1 },
      {
        keyId: KNOBS[1][1],
        messageType: MESSAGES[TEMPLATES.user].knob,
        onChange: initData,
      },
    )
      .addBooleanValue(
        "regen",
        { initial: true },
        {
          keyId: PADS[1],
          messageType: MESSAGES[TEMPLATES.user].padOff,
          onChange: randomize,
        },
      )
      .addNumberValue(
        "ampInit",
        { initial: HEIGHT / 2, min: HEIGHT / 10, max: HEIGHT, step: HEIGHT / 10 },
        {
          keyId: KNOBS[1][2],
          messageType: MESSAGES[TEMPLATES.user].knob,
          onChange: initData,
        },
      )
      .addNumberValue(
        "hzInit",
        { initial: 4, min: 1, max: 8, step: 1 },
        {
          keyId: KNOBS[1][3],
          messageType: MESSAGES[TEMPLATES.user].knob,
          onChange: initData,
        },
      )
      .addNumberValue(
        "ampFalloff",
        { initial: 2, min: 1, max: 6, step: 0.1 },
        {
          keyId: KNOBS[2][2],
          messageType: MESSAGES[TEMPLATES.user].knob,
          onChange: initData,
        },
      )
      .addNumberValue(
        "hzIncrease",
        { initial: 2, min: 1, max: 6, step: 0.1 },
        {
          keyId: KNOBS[2][3],
          messageType: MESSAGES[TEMPLATES.user].knob,
          onChange: initData,
        },
      );
  }
}

function randomize() {
  noise2d = createNoise2D();
  initData();
}

function initData() {
  let num = c.getNumberValue("octaves");
  octaves = Array(num)
    .fill(1)
    .map(() => []);
  data = Array(WIDTH)
    .fill(1)
    .map((_, i) => [i, HEIGHT / 2]);
  let z = 0.0002;
  let hz = c.getNumberValue("hzInit");
  let amp = c.getNumberValue("ampInit");

  for (let j = 1; j < num + 1; j++) {
    for (let i = 0; i < WIDTH; i++) {
      let octaveNoise = noise2d(z * hz * i, 0);
      data[i][1] += octaveNoise * amp;
      octaves[j - 1].push([i, HEIGHT / 2 + octaveNoise * amp]);
    }
    hz = hz * c.getNumberValue("hzIncrease");
    amp = amp / c.getNumberValue("ampFalloff");
  }
}

/**
 * @param {number} m
 */
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

/** @type {number} */
let rafID;

let t0 = 0;
function render(t = 0) {
  // FPS clamp
  let deltaT = t - t0;
  rafID = requestAnimationFrame(render);
  if (t0 && deltaT < 33) {
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
