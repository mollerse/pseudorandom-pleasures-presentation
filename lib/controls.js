import midiControl from "@mollerse/midi-control";

/** @type {Awaited<ReturnType<typeof midiControl>>} */
export let controls;

export async function init() {
  if (controls) return;

  controls = await midiControl({
    deviceName: "nanoKONTROL2",
    title: "Pseudorandom Pleasures",
  });
}
