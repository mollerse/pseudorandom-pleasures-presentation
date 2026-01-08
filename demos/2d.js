import { createNoise3D } from "simplex-noise";
import { BLACK } from "./util/colors.js";
import { normalize } from "./util/tools.js";

/** @import {MidiControl} from '@mollerse/midi-control' */

/** @type {number} */
let WIDTH;
/** @type {number} */
let HEIGHT;

const NAME = "2D";

let noise3d = createNoise3D();

/** @type {MidiControl} */
let c;
/** @type {CanvasRenderingContext2D} */
let ctx;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {MidiControl} controls
 */
function init(canvas, controls) {
  WIDTH = canvas.width;
  HEIGHT = canvas.height;
  initControls(controls);

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
      "samplerate",
      { initial: 0.001, min: 0.001, max: 0.1, step: 0.001 },
      {
        keyId: 0x0,
        messageType: 0xb0,
      },
    )
      .addNumberValue(
        "xoff",
        { initial: 0, min: 0, max: 200, step: 1 },
        {
          keyId: 0x10,
          messageType: 0xb0,
        },
      )
      .addNumberValue(
        "yoff",
        { initial: 0, min: 0, max: 200, step: 1 },
        {
          keyId: 0x11,
          messageType: 0xb0,
        },
      )
      .addNumberValue(
        "zoff",
        { initial: 0, min: 0, max: 100, step: 1 },
        {
          keyId: 0x12,
          messageType: 0xb0,
        },
      )
      // .addNumberValue(
      //   "deltax",
      //   { initial: 0, min: -10, max: 10, step: 0.1 },
      //   {
      //     keyId: KNOBS[1][5],
      //     messageType: MESSAGES[TEMPLATES.user].knob,
      //   },
      // )
      // .addNumberValue(
      //   "deltay",
      //   { initial: 0, min: -10, max: 10, step: 0.1 },
      //   {
      //     keyId: KNOBS[1][6],
      //     messageType: MESSAGES[TEMPLATES.user].knob,
      //   },
      // )
      // .addNumberValue(
      //   "deltaz",
      //   { initial: 0, min: -10, max: 10, step: 0.1 },
      //   {
      //     keyId: KNOBS[1][6],
      //     messageType: MESSAGES[TEMPLATES.user].knob,
      //   },
      // )

      .addBooleanValue(
        "regen",
        { initial: false },
        {
          keyId: 0x40,
          messageType: 0xb0,
          value: 0,
          onChange: randomize,
        },
      );
  }
}

function randomize() {
  noise3d = createNoise3D();
}

/** @type {number} */
let rafID;
let t0 = 0;
/**
 * @param {number} t
 * @returns {void}
 */
function render(t = 0) {
  // FPS clamp
  let deltaT = t - t0;
  rafID = requestAnimationFrame(render);
  if (t0 && deltaT < 66) {
    return;
  }

  ctx.save();

  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  let numCellsX = 64 * 2;
  let cellW = WIDTH / numCellsX;
  let cellH = cellW;
  let numCellsY = Math.floor(HEIGHT / cellH);

  for (let y = 0; y < numCellsY; y++) {
    let penY = y * cellH;
    for (let x = 0; x < numCellsX; x++) {
      let penX = x * cellW;

      let n = noise3d(
        (x + c.getNumberValue("xoff")) * c.getNumberValue("samplerate"),
        (y + c.getNumberValue("yoff")) * c.getNumberValue("samplerate"),
        (0 + c.getNumberValue("zoff")) * c.getNumberValue("samplerate"),
      );
      let v = normalize(-1, 1, n);
      ctx.fillStyle = `hsl(${v * 360}, 100%, 50%)`;
      ctx.fillRect(penX, penY, cellW, cellH);
      ctx.strokeStyle = BLACK;
      ctx.strokeRect(penX, penY, cellW, cellH);
    }
  }

  ctx.restore();
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
