import simplex from "../demos/simplex.js";
import { default as twoD } from "../demos/2d.js";
import joydivision from "../demos/joydivision.js";
import randomline from "../demos/randomline.js";
import simplexoctaves from "../demos/simplexoctaves.js";
import simplexoctaves2d from "../demos/simplexoctaves2d.js";

import { controls } from "./controls.js";

/** @type {Record.<AvailableDemo, CanvasDemo>} */
let availableDemos = {
  simplex,
  simplexoctaves,
  simplexoctaves2d,
  "2d": twoD,
  joydivision,
  randomline,
};

export class CanvasSlide extends HTMLElement {
  #demo;
  #canvas;

  constructor() {
    super();
  }

  connectedCallback() {
    let demoType = /** @type {AvailableDemo} */ (this.dataset.demo);
    this.#demo = availableDemos[demoType];

    this.#canvas = document.createElement("canvas");
    this.appendChild(this.#canvas);

    let width = 1600;

    this.#canvas.height = (9 / 16) * width;
    this.#canvas.width = width;
  }

  start() {
    this.#demo.start(this.#canvas, controls);
  }

  stop() {
    this.#demo.stop();
  }
}
