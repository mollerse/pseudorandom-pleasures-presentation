import { BLACK, WHITE } from "./util/colors.js";
import { random2 } from "./util/random.js";
import { createNoise2D } from "simplex-noise";

/** @type {number} */
let WIDTH;
/** @type {number} */
let HEIGHT;
const NAME = "Random vs Pseudorandom";

/** @type {MidiControl.MidiControl} */
let c;
/** @type {CanvasRenderingContext2D} */
let ctx;
/** @type {number[][]} */
let dataRandom;
/** @type {number[][]} */
let dataPseudorandom;

let noise2d = createNoise2D();
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
        keyId: 0x10,
        messageType: 0xb0,
        onChange: initData,
      },
    )
      .addBooleanValue("line", { initial: true }, { keyId: 0x20, messageType: 0xb0, value: 0 })
      .addBooleanValue(
        "regen",
        { initial: false },
        { keyId: 0x40, messageType: 0xb0, value: 0, onChange: randomize },
      )
      .addNumberValue(
        "thickness",
        { initial: 1, min: 1, max: 50, step: 1 },
        { keyId: 0x0, messageType: 0xb0 },
      )
      .addNumberValue(
        "radius",
        { initial: 1, min: 1, max: 50, step: 1 },
        { keyId: 0x1, messageType: 0xb0 },
      );
  }
}

function randomize() {
  noise2d = createNoise2D();
  initData();
}

function initData() {
  let n = c.getNumberValue("dots") | 0;
  dataRandom = Array(n)
    .fill(1)
    .map((_, i) => [(i + 1) * (WIDTH / n), random2(0, HEIGHT / 2)]);

  dataPseudorandom = Array(n)
    .fill(1)
    .map((_, i) => [(i + 1) * (WIDTH / n), 3 * (HEIGHT / 4) + (HEIGHT / 4) * noise2d(0.05 * i, 0)]);
}

/** @type {number} */
let rafID;

function renderRandomLine() {
  ctx.beginPath();
  ctx.moveTo(0, HEIGHT / 4);
  dataRandom.slice(0, -2).forEach(([x, y], i) => {
    let cpx = (x + dataRandom[i + 1][0]) / 2;
    let cpy = (y + dataRandom[i + 1][1]) / 2;

    ctx.quadraticCurveTo(x, y, cpx, cpy);
  });
  let n = dataRandom.length - 2;
  ctx.quadraticCurveTo(
    dataRandom[n][0],
    dataRandom[n][1],
    dataRandom[n + 1][0],
    dataRandom[n + 1][1],
  );

  ctx.stroke();
}

function renderRandomDots() {
  dataRandom.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, c.getNumberValue("radius"), 0, 2 * Math.PI, true);
    ctx.fill();
  });
}

function renderPseudorandomLine() {
  ctx.beginPath();
  ctx.moveTo(0, 3 * (HEIGHT / 4));
  dataPseudorandom.slice(0, -2).forEach(([x, y], i) => {
    let cpx = (x + dataPseudorandom[i + 1][0]) / 2;
    let cpy = (y + dataPseudorandom[i + 1][1]) / 2;

    ctx.quadraticCurveTo(x, y, cpx, cpy);
  });
  let n = dataPseudorandom.length - 2;
  ctx.quadraticCurveTo(
    dataPseudorandom[n][0],
    dataPseudorandom[n][1],
    dataPseudorandom[n + 1][0],
    dataPseudorandom[n + 1][1],
  );

  ctx.stroke();
}

function renderPseudorandomDots() {
  dataPseudorandom.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, c.getNumberValue("radius"), 0, 2 * Math.PI, true);
    ctx.fill();
  });
}

function render() {
  rafID = requestAnimationFrame(render);

  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.strokeStyle = WHITE;
  ctx.fillStyle = WHITE;

  ctx.lineWidth = c.getNumberValue("thickness");

  ctx.beginPath();
  ctx.moveTo(0, HEIGHT / 2);
  ctx.lineTo(WIDTH, HEIGHT / 2);
  ctx.stroke();

  ctx.font = '30px "DejaVu Sans"';

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("Random", WIDTH / 2, 0);

  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("Pseudorandom", WIDTH / 2, HEIGHT);

  if (c.getBooleanValue("line")) {
    renderRandomLine();
    renderPseudorandomLine();
  } else {
    renderRandomDots();
    renderPseudorandomDots();
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
