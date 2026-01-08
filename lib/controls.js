import midiControl from "@mollerse/midi-control";

/** @import {MidiControl} from '@mollerse/midi-control' */

/** @type {MidiControl} */
export let controls;

export async function init() {
  if (controls) return;

  controls = await midiControl({
    deviceName: "nanoKONTROL2",
    title: "Pseudorandom Pleasures",
  });
}
