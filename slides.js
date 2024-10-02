import Reveal from "reveal.js";
import RevealHighlight from "reveal.js/plugin/highlight/highlight.js";
import { init as initControls } from "./lib/controls.js";
import { CanvasSlide } from "./lib/canvas-slide.js";

let deck = new Reveal({
  controls: false,
  progress: false,
  slideNumber: false,
  hash: true,
  history: true,
  disableLayout: true,
  display: "flex",
  transition: "none",
  plugins: [RevealHighlight],
});

deck.initialize();
await initControls();

customElements.define("canvas-slide", CanvasSlide);

// @ts-ignore Types aren't defined properly in reveal.js
deck.on("slidechanged", function ({ previousSlide, currentSlide }) {
  if (currentSlide.classList.contains("demo")) {
    let canvasSlide = currentSlide.querySelector("canvas-slide");
    canvasSlide.start();
  }

  if (previousSlide && previousSlide.classList.contains("demo")) {
    let canvasSlide = previousSlide.querySelector("canvas-slide");
    canvasSlide.stop();
  }
});
