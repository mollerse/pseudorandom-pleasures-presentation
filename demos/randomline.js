import { BLACK, WHITE } from "./util/colors";
import { random2 } from "./util/random";

let WIDTH, HEIGHT;
const NAME = "Random Line";

let ctx, data, c;

function init(canvas, controls) {
  WIDTH = canvas.width;
  HEIGHT = canvas.height;
  initControls(controls);
  initData();

  ctx = canvas.getContext("2d");
}

function initControls(controls) {
  c = controls;
  try {
    c.loadScheme(NAME);
  } catch (e) {
    c.addScheme(NAME)
      .addNumberValue("dots", [5, 2, 100], {
        onChange: initData,
        triggerId: 21,
      })
      .addBooleanValue("line", [true], { triggerId: 9 })
      .addBooleanValue("regen", [false], { triggerId: 10, onChange: initData })
      .addNumberValue("thickness", [1, 1, 50, 1], { triggerId: 41 });
  }
}

function initData() {
  let n = c.getValue("dots");
  data = Array(n)
    .fill(1)
    .map((_, i) => [(i + 1) * (WIDTH / n), HEIGHT / 2 + random2(-HEIGHT / 2, HEIGHT / 2)]);
}

let rafID = null;
function render() {
  rafID = requestAnimationFrame(render);

  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.strokeStyle = WHITE;
  ctx.fillStyle = WHITE;

  ctx.lineWidth = c.getValue("thickness");

  if (c.getValue("line")) {
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

function start(canvas, controls) {
  init(canvas, controls);
  render();
}

function stop() {
  cancelAnimationFrame(rafID);
  c.unloadScheme(NAME);
}

export default { start, stop };
