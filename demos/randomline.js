import { BLACK, WHITE } from "./util/colors.js";
import { random2 } from "./util/random.js";
import { shuffle } from "./util/shuffle.js";

/** @import {MidiControl} from '@mollerse/midi-control' */

/** @type {number} */
let WIDTH;
/** @type {number} */
let HEIGHT;
const NAME = "Random Line";

/** @type {MidiControl} */
let c;
/** @type {CanvasRenderingContext2D} */
let ctx;
/** @type {number[][]} */
let data;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {MidiControl} controls
 */
function init(canvas, controls) {
  WIDTH = canvas.width;
  HEIGHT = canvas.height;
  initControls(controls);
  initData();

  ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext("2d"));
}

/**
 * @param {MidiControl} controls
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
        keyId: 0x10,
        messageType: 0xb0,
        // onChange: initData,
      },
    )
      .addBooleanValue("line", { initial: false }, { keyId: 0x20, messageType: 0xb0, value: 0 })
      .addBooleanValue(
        "regen",
        { initial: false },
        { keyId: 0x40, messageType: 0xb0, value: 0, onChange: initData },
      )
      .addNumberValue(
        "thickness",
        { initial: 1, min: 1, max: 50, step: 1 },
        { keyId: 0x0, messageType: 0xb0 },
      );
  }
}

function initData() {
  let n = 100;
  data = Array(n)
    .fill(1)
    .map((_, i) => [(i + 1) * (WIDTH / n), HEIGHT / 2 + random2(-HEIGHT / 2, HEIGHT / 2)]);

  data = shuffle(data);
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

  let n = c.getNumberValue("dots") | 0;
  let subset = data.slice(0, n);

  if (c.getBooleanValue("line")) {
    subset.sort((a, b) => a[0] - b[0]);
    ctx.beginPath();
    ctx.moveTo(0, HEIGHT / 2);
    subset.slice(0, -2).forEach(([x, y], i) => {
      let cpx = (x + subset[i + 1][0]) / 2;
      let cpy = (y + subset[i + 1][1]) / 2;

      ctx.quadraticCurveTo(x, y, cpx, cpy);
    });
    let n = subset.length - 2;
    ctx.quadraticCurveTo(subset[n][0], subset[n][1], subset[n + 1][0], subset[n + 1][1]);

    ctx.stroke();
  } else {
    subset.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, 2 * Math.PI, true);
      ctx.fill();
    });
  }
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {MidiControl} controls
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
