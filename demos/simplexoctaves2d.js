import { createNoise3D } from "simplex-noise";
import { KNOBS, MESSAGES, TEMPLATES, PADS } from "@mollerse/midi-control/devices/launch-control.js";

import { BLACK, WHITE } from "./util/colors.js";
import { normalize } from "./util/tools.js";

/** @type {number} */
let WIDTH;
/** @type {number} */
let HEIGHT;
const NAME = "Simplex Octaves 2D";

const N = 100;
const M = 100;

let noise3d = createNoise3D();

/** @type {MidiControl.MidiControl} */
let c;
/** @type {CanvasRenderingContext2D} */
let ctx;
/** @type {number[]} */
let data;
/** @type {number[][]} */
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
        { initial: 1, min: 1, max: 10, step: 0.01 },
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
  noise3d = createNoise3D();
  initData();
}

function initData() {
  let num = c.getNumberValue("octaves");
  octaves = Array(num)
    .fill(1)
    .map(() => Array(N * M));
  data = Array(N * M).fill(0);
  let z = 0.01;
  let hz = c.getNumberValue("hzInit");
  let amp = c.getNumberValue("ampInit");

  for (let o = 1; o < num + 1; o++) {
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < M; j++) {
        let octaveNoise = noise3d(z * hz * i, z * hz * j, 0);
        data[i * N + j] += octaveNoise * amp;
        octaves[o - 1][i * N + j] = octaveNoise * amp;
      }
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
