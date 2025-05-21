import type midiControl from "@mollerse/midi-control";

type CanvasDemo = {
  start: (canvas: HTMLCanvasElement, controls: Awaited<ReturnType<typeof midiControl>>) => void;
  stop: () => void;
};

type AvailableDemo =
  | "2d"
  | "joydivision"
  | "randomline"
  | "simplex"
  | "simplexoctaves"
  | "simplexoctaves2d"
  | "r-vs-pr"
  | "1d-strip";

export { CanvasDemo, AvailableDemo };
