import dat from "dat.gui";

function normalize(min, max, v) {
  return (v - min) / (max - min);
}

class MidiControl {
  constructor(name) {
    this.gui = new dat.GUI({ closed: false });
    if (window.navigator.requestMIDIAccess) {
      navigator
        .requestMIDIAccess()
        .then((access) => {
          let entries = access.inputs.entries();
          let entry = entries.next();
          let device = null;
          while (!entry.done) {
            let [_, d] = entry.value;
            if (d.name.includes(name)) {
              device = d;
              break;
            }
            entry = entries.next();
          }
          if (device) {
            device.onmidimessage = ({ data }) => {
              let [eventId, keyId, value] = data;
              if (eventId === 144 || eventId === 176 || eventId === 184 || eventId === 152) {
                this.trigger(keyId, normalize(0, 127, value));
              }
            };
          } else {
            console.warn(`No MIDI Device named ${name} found.`);
          }
        })
        .catch((e) => {
          console.warn(e);
        });
    } else {
      console.warn("Midi not available, not enabling midi controls.");
    }
    this.schemes = {};
    this.activeScheme = null;
  }

  // Builder methods

  addScheme(name) {
    if (this.getSchemes().indexOf(name) > -1) {
      throw new Error(`Scheme ${name} already exists. Remove existing before adding.`);
    }
    this.schemes[name] = {
      values: {},
      triggers: {},
      gui: this.gui.addFolder(name),
    };
    this.activeScheme = name;

    return this;
  }

  addNumberValue(key, [value, min = 0, max = value, step = 1], { onChange, triggerId }) {
    let scheme = this.getScheme();
    scheme.values[key] = value;

    let control = scheme.gui.add(scheme.values, key, min, max, step);

    if (typeof onChange === "function") {
      control.onChange(onChange);
    }

    if (typeof triggerId === "string" || typeof triggerId === "number") {
      scheme.triggers[triggerId] = (v) => control.setValue(min + v * (max - min));
    }

    return this;
  }

  addBooleanValue(key, [value], { onChange, triggerId }) {
    let scheme = this.getScheme();
    scheme.values[key] = value;

    let control = scheme.gui.add(scheme.values, key);

    if (typeof onChange === "function") {
      control.onChange(onChange);
    }

    if (typeof triggerId === "string" || typeof triggerId === "number") {
      scheme.triggers[triggerId] = () => control.setValue(!control.getValue());
    }

    return this;
  }

  // Runtime methods

  loadScheme(name) {
    if (this.getSchemes().indexOf(name) < 0) {
      throw new Error(`Scheme ${name} not found. Please initialize.`);
    }

    if (this.activeScheme === name) {
      console.warn(`Scheme ${name} already active. Skipping.`);
    } else if (this.activeScheme != null) {
      console.warn(`Unloading active scheme ${name}.`);
      this.unloadScheme(this.activeScheme);
    }

    this.activeScheme = name;
  }

  unloadScheme(name) {
    if (this.getSchemes().indexOf(name) < 0) {
      console.warn(`Scheme ${name} not found. Skipping.`);
    }

    if (this.activeScheme === name) {
      this.activeScheme = null;
    }
  }

  removeScheme(name) {
    if (this.getSchemes().indexOf(name) < 0) {
      console.warn(`Scheme ${name} not found. Skipping.`);
    } else {
      this.unloadScheme(name);
      delete this.schemes[name];
    }
  }

  getValue(key) {
    let scheme = this.getScheme();

    return scheme.values[key];
  }

  // Internal stuff
  getScheme(name = this.activeScheme) {
    return this.schemes[name];
  }

  trigger(triggerId, v) {
    let scheme = this.getScheme();
    let trigger = scheme.triggers[triggerId];

    trigger && trigger(v);
  }

  // Debug-stuff

  getSchemes() {
    return Object.keys(this.schemes);
  }
}

export default function midiControlFactory(name) {
  return new MidiControl(name);
}
