import { KNOBS, MESSAGES, TEMPLATES, PADS } from "@mollerse/midi-control/devices/launch-control.js";

import { BLACK, WHITE } from "./util/colors.js";
import { random2 } from "./util/random.js";

/** @type {number} */
let WIDTH;
/** @type {number} */
let HEIGHT;
const NAME = "Random Line";

/** @type {MidiControl.MidiControl} */
let c;
/** @type {CanvasRenderingContext2D} */
let ctx;
/** @type {number[][]} */
let data;

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
      "dots",
      { initial: 5, min: 2, max: 100, step: 1 },
      {
        keyId: KNOBS[1][1],
        messageType: MESSAGES[TEMPLATES.user].knob,
        onChange: initData,
      },
    )
      .addBooleanValue(
        "line",
        { initial: true },
        { keyId: PADS[1], messageType: MESSAGES[TEMPLATES.user].padOff },
      )
      .addBooleanValue(
        "regen",
        { initial: false },
        { keyId: PADS[2], messageType: MESSAGES[TEMPLATES.user].padOff, onChange: initData },
      )
      .addNumberValue(
        "thickness",
        { initial: 1, min: 1, max: 50, step: 1 },
        { keyId: KNOBS[2][1], messageType: MESSAGES[TEMPLATES.user].knob },
      );
  }
}

function initData() {
  let n = c.getNumberValue("dots");
  data = Array(n)
    .fill(1)
    .map((_, i) => [(i + 1) * (WIDTH / n), HEIGHT / 2 + random2(-HEIGHT / 2, HEIGHT / 2)]);
}

/** @type {number} */
let rafID;

function render() {
  rafID = requestAnimationFrame(render);

  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.strokeStyle = WHITE;
  ctx.fillStyle = WHITE;

  ctx.lineWidth = c.getNumberValue("thickness");

  if (c.getBooleanValue("line")) {
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
      ctx.arc(x, y, 10, 0, 2 * Math.PI, true);
      ctx.fill();
    });
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
