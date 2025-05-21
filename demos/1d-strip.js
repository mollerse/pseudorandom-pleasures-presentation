import { createNoise3D } from "simplex-noise";
import { KNOBS, MESSAGES, TEMPLATES, PADS } from "@mollerse/midi-control/devices/launch-control.js";
import { BLACK } from "./util/colors.js";
import { normalize } from "./util/tools.js";

/** @type {number} */
let WIDTH;
/** @type {number} */
let HEIGHT;

const NAME = "1D strip";

let noise3d = createNoise3D();

/** @type {MidiControl.MidiControl} */
let c;
/** @type {CanvasRenderingContext2D} */
let ctx;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {MidiControl.MidiControl} controls
 */
function init(canvas, controls) {
  WIDTH = canvas.width;
  HEIGHT = canvas.height;
  initControls(controls);

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
      "samplerate",
      { initial: 0.001, min: 0.001, max: 0.1, step: 0.001 },
      {
        keyId: KNOBS[1][1],
        messageType: MESSAGES[TEMPLATES.user].knob,
      },
    )
      .addNumberValue(
        "numBands",
        { initial: 1, min: 1, max: 256, step: 1 },
        {
          keyId: KNOBS[2][1],
          messageType: MESSAGES[TEMPLATES.user].knob,
        },
      )
      .addNumberValue(
        "numCells",
        { initial: 10, min: 10, max: 100, step: 10 },
        {
          keyId: KNOBS[2][2],
          messageType: MESSAGES[TEMPLATES.user].knob,
        },
      )

      .addBooleanValue(
        "regen",
        { initial: false },
        {
          keyId: PADS[1],
          messageType: MESSAGES[TEMPLATES.user].padOff,
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

  let numCellsX = c.getNumberValue("numCells");
  let cellW = WIDTH / numCellsX;
  let cellH = cellW;
  let numCellsY = c.getNumberValue("numBands");

  for (let y = 0; y < numCellsY; y++) {
    let penY = y * cellH;
    for (let x = 0; x < numCellsX; x++) {
      let idx = y * numCellsY + x;
      let penX = x * cellW;

      let n = noise3d(idx * c.getNumberValue("samplerate"), 0, 0);
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
