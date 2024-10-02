import { createNoise2D } from "simplex-noise";
import { KNOBS, MESSAGES, TEMPLATES, PADS } from "@mollerse/midi-control/devices/launch-control.js";

import { BLACK, WHITE } from "./util/colors.js";

/** @type {number} */
let WIDTH;
/** @type {number} */
let HEIGHT;
const NAME = "Simplex";

let noise2d = createNoise2D();

/** @type {MidiControl.MidiControl} */
let c;
/** @type {CanvasRenderingContext2D} */
let ctx;
/** @type {number[][]} */
let data;
let off = 0;

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
  } catch (e) {
    c.createBinding(NAME);

    c.addNumberValue(
      "numDots",
      { initial: 35, min: 5, max: 250, step: 1 },
      {
        keyId: KNOBS[1][1],
        messageType: MESSAGES[TEMPLATES.user].knob,
        onChange: initData,
      },
    )
      .addNumberValue(
        "samplerate",
        { initial: 0.002, min: 0.001, max: 0.01, step: 0.0001 },
        {
          keyId: KNOBS[1][2],
          messageType: MESSAGES[TEMPLATES.user].knob,
          onChange: initData,
        },
      )
      .addNumberValue(
        "xoff",
        { initial: 0, min: 0, max: 2500, step: 10 },
        {
          keyId: KNOBS[1][3],
          messageType: MESSAGES[TEMPLATES.user].knob,
          onChange: initData,
        },
      )
      .addNumberValue(
        "thickness",
        { initial: 5, min: 0.5, max: 50, step: 0.5 },
        {
          keyId: KNOBS[2][1],
          messageType: MESSAGES[TEMPLATES.user].knob,
        },
      )
      .addNumberValue(
        "yoff",
        { initial: 0, min: 0, max: 1, step: 0.001 },
        {
          keyId: KNOBS[2][2],
          messageType: MESSAGES[TEMPLATES.user].knob,
          onChange: initData,
        },
      )
      .addBooleanValue(
        "line",
        { initial: true },
        {
          keyId: PADS[1],
          messageType: MESSAGES[TEMPLATES.user].padOff,
        },
      )
      .addBooleanValue(
        "regen",
        { initial: false },
        {
          keyId: PADS[2],
          messageType: MESSAGES[TEMPLATES.user].padOff,
          onChange: randomize,
        },
      )
      .addBooleanValue(
        "move",
        { initial: false },
        {
          keyId: PADS[3],
          messageType: MESSAGES[TEMPLATES.user].padOff,
        },
      );
  }
}

function randomize() {
  noise2d = createNoise2D();
  initData();
}

function initData() {
  let n = c.getNumberValue("numDots");
  let z = c.getNumberValue("samplerate");
  let xoff = c.getNumberValue("xoff");
  data = [];

  if (c.getBooleanValue("move")) {
    xoff += off;
  }

  for (let i = 0; i < WIDTH; i++) {
    let noise = noise2d(z * (i + xoff), c.getNumberValue("yoff"));
    if (i % Math.floor(WIDTH / n) === 0) {
      data.push([i, HEIGHT / 2 + noise * (HEIGHT / 4)]);
    }
  }
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

  if (c.getBooleanValue("move")) {
    initData();
  }

  ctx.save();

  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.strokeStyle = WHITE;
  ctx.fillStyle = WHITE;

  let w = c.getNumberValue("thickness");

  ctx.lineWidth = w;

  if (c.getNumberValue("line")) {
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
  if (c.getBooleanValue("move")) {
    off += 10;
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
