import { MidiControl } from "@mollerse/midi-control";

type CanvasDemo = {
  start: (canvas: HTMLCanvasElement, controls: MidiControl) => void;
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
  | "r-vs-sine"
  | "1d-strip";

export { CanvasDemo, AvailableDemo };
