import midiControl from "./midiControl.js";

export let controls;

export async function init() {
  if (controls) return;

  controls = midiControl("Launch Control MIDI 1");
}
