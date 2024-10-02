import midiControl from "@mollerse/midi-control";

/** @type {Awaited<ReturnType<typeof midiControl>>} */
export let controls;

export async function init() {
  if (controls) return;

  controls = await midiControl({
    deviceName: "Launch Control MIDI 1",
    title: "Pseudorandom Pleasures",
  });
}
