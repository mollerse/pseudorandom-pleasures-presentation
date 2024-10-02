import { createNoise3D } from "simplex-noise";
import { KNOBS, MESSAGES, TEMPLATES, PADS } from "@mollerse/midi-control/devices/launch-control.js";
import { BLACK } from "./util/colors.js";
import { normalize } from "./util/tools.js";

/** @type {number} */
let WIDTH;
/** @type {number} */
let HEIGHT;

const NAME = "2D";

let noise3d = createNoise3D();

/** @type {MidiControl.MidiControl} */
let c;
/** @type {CanvasRenderingContext2D} */
let ctx;
let xoff = 0;
let yoff = 0;

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
      "xoff",
      { initial: 0, min: 0, max: 2500, step: 1 },
      {
        keyId: KNOBS[1][1],
        messageType: MESSAGES[TEMPLATES.user].knob,
      },
    )
      .addNumberValue(
        "yoff",
        { initial: 0, min: 0, max: 2500, step: 1 },
        {
          keyId: KNOBS[1][2],
          messageType: MESSAGES[TEMPLATES.user].knob,
        },
      )
      .addNumberValue(
        "zoff",
        { initial: 0, min: 0, max: 100, step: 1 },
        {
          keyId: KNOBS[1][3],
          messageType: MESSAGES[TEMPLATES.user].knob,
        },
      )
      .addNumberValue(
        "zoom",
        { initial: 0.01, min: 0.01, max: 0.1, step: 0.001 },
        {
          keyId: KNOBS[1][4],
          messageType: MESSAGES[TEMPLATES.user].knob,
        },
      )
      .addNumberValue(
        "deltax",
        { initial: 0, min: -10, max: 10, step: 0.1 },
        {
          keyId: KNOBS[1][5],
          messageType: MESSAGES[TEMPLATES.user].knob,
        },
      )
      .addNumberValue(
        "deltay",
        { initial: 0, min: -10, max: 10, step: 0.1 },
        {
          keyId: KNOBS[1][6],
          messageType: MESSAGES[TEMPLATES.user].knob,
        },
      )

      .addBooleanValue(
        "move",
        { initial: false },
        { keyId: PADS[1], messageType: MESSAGES[TEMPLATES.user].padOff },
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

  ctx.scale(5, 5);
  ctx.translate(WIDTH / 20, HEIGHT / 20);

  for (let i = 0; i < WIDTH / 10; i++) {
    for (let j = 0; j < HEIGHT / 10; j++) {
      let n = noise3d(
        (i + c.getNumberValue("xoff") + xoff) * c.getNumberValue("zoom"),
        (j + c.getNumberValue("yoff") + yoff) * c.getNumberValue("zoom"),
        c.getNumberValue("zoff") * 0.01,
      );
      let v = normalize(-1, 1, n);
      ctx.fillStyle = `hsl(${v * 360}, 100%, 50%)`;
      ctx.fillRect(i, j, 1, 1);
    }
  }

  ctx.restore();
  if (c.getNumberValue("move")) {
    xoff += c.getNumberValue("deltax");
    yoff += c.getNumberValue("deltay");
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
