// Serial -> MIDI bridge.
// Arduino --(USB Serial bytes)--> MidiParser --> built-in synth
//                                            \-> Web MIDI output (e.g. IAC Driver -> DAW)

const $ = (id) => document.getElementById(id);

const LOWEST_NOTE = 48; // C3
const HIGHEST_NOTE = 84; // C6
const MAX_LOG_LINES = 200;

// ---------------------------------------------------------------- Synth

class Synth {
  constructor() {
    this.ctx = null;
    this.voices = new Map();
    this.bendCents = 0;
    this.enabled = true;
    this.wave = "sawtooth";
    this.attack = 0.01;
    this.release = 0.3;
  }

  // Browsers only allow sound after a click or key press, so this is called from those.
  ensure() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = "lowpass";
      this.filter.Q.value = 4;
      this.master = this.ctx.createGain();
      const limiter = this.ctx.createDynamicsCompressor();
      this.filter.connect(this.master).connect(limiter).connect(this.ctx.destination);
      this.setVolume(Number($("volume").value));
      this.setCutoff(Number($("cutoff").value));
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
  }

  noteOn(note, velocity) {
    if (!this.ctx || !this.enabled) return;
    this.noteOff(note, 0.01);
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = this.wave;
    osc.frequency.value = 440 * Math.pow(2, (note - 69) / 12);
    osc.detune.value = this.bendCents;
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(0.25 * (velocity / 127), t + this.attack);
    osc.connect(amp).connect(this.filter);
    osc.start(t);
    this.voices.set(note, { osc, amp });
  }

  noteOff(note, release = this.release) {
    const voice = this.voices.get(note);
    if (!voice || !this.ctx) return;
    const t = this.ctx.currentTime;
    voice.amp.gain.cancelScheduledValues(t);
    voice.amp.gain.setValueAtTime(voice.amp.gain.value, t);
    voice.amp.gain.linearRampToValueAtTime(0, t + release);
    voice.osc.stop(t + release + 0.05);
    this.voices.delete(note);
  }

  allNotesOff() {
    for (const note of [...this.voices.keys()]) this.noteOff(note, 0.05);
  }

  // 0-127 -> quiet to loud (squared so the slider feels even)
  setVolume(value) {
    if (this.ctx) this.master.gain.setTargetAtTime(Math.pow(value / 127, 2) * 0.8, this.ctx.currentTime, 0.02);
  }

  // 0-127 -> 80 Hz to 16 kHz, spread evenly across octaves
  setCutoff(value) {
    if (this.ctx) {
      const hz = 80 * Math.pow(2, (value / 127) * Math.log2(16000 / 80));
      this.filter.frequency.setTargetAtTime(hz, this.ctx.currentTime, 0.02);
    }
  }

  // Pitch bend is 0-16383 with 8192 in the middle. We bend up to 2 semitones either way.
  setBend(value) {
    this.bendCents = ((value - 8192) / 8192) * 200;
    for (const { osc } of this.voices.values()) osc.detune.value = this.bendCents;
  }
}

const synth = new Synth();

// ---------------------------------------------------------------- Piano display

const pianoKeys = new Map(); // note -> element

function isBlack(note) {
  return [1, 3, 6, 8, 10].includes(note % 12);
}

function buildPiano() {
  const piano = $("piano");
  const whiteCount = [...Array(HIGHEST_NOTE - LOWEST_NOTE + 1).keys()]
    .filter((i) => !isBlack(LOWEST_NOTE + i)).length;
  const whiteWidth = 100 / whiteCount;
  let whiteIndex = 0;
  for (let note = LOWEST_NOTE; note <= HIGHEST_NOTE; note++) {
    const key = document.createElement("div");
    key.dataset.note = note;
    if (isBlack(note)) {
      key.className = "key black";
      key.style.left = `calc(${whiteIndex * whiteWidth}% - ${whiteWidth * 0.3}%)`;
      key.style.width = `${whiteWidth * 0.6}%`;
    } else {
      key.className = "key white";
      if (note % 12 === 0) key.textContent = noteName(note);
      whiteIndex++;
    }
    pianoKeys.set(note, key);
    piano.appendChild(key);
  }

  let mouseNote = null;
  const release = () => {
    if (mouseNote !== null) playFromThisComputer(mouseNote, false);
    mouseNote = null;
  };
  piano.addEventListener("pointerdown", (e) => {
    const note = Number(e.target.dataset.note);
    if (Number.isNaN(note)) return;
    mouseNote = note;
    playFromThisComputer(note, true);
  });
  window.addEventListener("pointerup", release);
  piano.addEventListener("pointerleave", release);
}

function setKeyActive(note, on) {
  const key = pianoKeys.get(note);
  if (key) key.classList.toggle("on", on);
}

function clearKeys() {
  for (const key of pianoKeys.values()) key.classList.remove("on");
}

// ---------------------------------------------------------------- CC meters

const ccValues = new Map();

function renderMeters() {
  const box = $("cc-meters");
  box.innerHTML = "";
  for (const [cc, value] of [...ccValues].slice(-8)) {
    const meter = document.createElement("div");
    meter.className = "meter";
    meter.innerHTML = `CC ${cc}: ${value}<div class="bar"><div class="fill" style="width:${(value / 127) * 100}%"></div></div>`;
    box.appendChild(meter);
  }
}

// ---------------------------------------------------------------- Logs (batched so fast streams don't freeze the page)

const logLines = [];
const textLines = [];
let textBuffer = "";
let renderQueued = false;

function queueRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    $("log").textContent = logLines.join("\n");
    $("text-log").textContent = textLines.join("\n");
    $("text-count").textContent = textLines.length;
    $("ignored").textContent = parser.ignored;
    renderMeters();
  });
}

function addLine(list, line) {
  list.unshift(line);
  if (list.length > MAX_LOG_LINES) list.pop();
  queueRender();
}

function handleText(byte) {
  if (byte === 10) {
    addLine(textLines, textBuffer);
    textBuffer = "";
  } else if (byte >= 32 || byte === 9) {
    textBuffer += String.fromCharCode(byte);
  }
  queueRender();
}

// ---------------------------------------------------------------- MIDI out

let midiAccess = null;
let midiOut = null;

async function setupMidiOut() {
  if (!navigator.requestMIDIAccess) {
    $("midi-status").textContent = "Web MIDI isn't supported in this browser (use Chrome or Edge).";
    return;
  }
  try {
    midiAccess = await navigator.requestMIDIAccess();
    midiAccess.onstatechange = listOutputs;
    listOutputs();
  } catch (err) {
    $("midi-status").textContent = `Permission denied (${err.message}). Built-in synth still works.`;
  }
}

function listOutputs() {
  const select = $("midi-out");
  const current = select.value;
  select.length = 1;
  for (const output of midiAccess.outputs.values()) {
    select.add(new Option(output.name, output.id));
  }
  select.value = [...select.options].some((o) => o.value === current) ? current : "";
  chooseOutput();
}

function chooseOutput() {
  const id = $("midi-out").value;
  midiOut = id && midiAccess ? midiAccess.outputs.get(id) : null;
  const count = midiAccess ? midiAccess.outputs.size : 0;
  $("midi-status").textContent = midiOut
    ? `Sending to "${midiOut.name}"`
    : count === 0
      ? "No MIDI outputs found. Is the IAC Driver switched on?"
      : "Not sending anywhere";
}

// ---------------------------------------------------------------- The important bit: what to do with each message

function handleMessage(bytes, info) {
  if (midiOut) {
    try {
      midiOut.send(bytes);
    } catch (err) {
      $("midi-status").textContent = `Send failed: ${err.message}`;
    }
  }

  switch (info.kind) {
    case "noteOn":
      synth.noteOn(info.note, info.velocity);
      setKeyActive(info.note, true);
      break;
    case "noteOff":
      synth.noteOff(info.note);
      setKeyActive(info.note, false);
      break;
    case "cc":
      ccValues.delete(info.controller);
      ccValues.set(info.controller, info.value);
      if (info.controller === 7) {
        $("volume").value = info.value;
        synth.setVolume(info.value);
      } else if (info.controller === 120 || info.controller === 123) {
        synth.allNotesOff();
        clearKeys();
      } else {
        $("cutoff").value = info.value;
        synth.setCutoff(info.value);
      }
      break;
    case "pitchBend":
      synth.setBend(info.value);
      break;
  }

  addLine(logLines, info.text);
}

const parser = new MidiParser(handleMessage, handleText);

function playFromThisComputer(note, on) {
  synth.ensure();
  const bytes = on ? [0x90, note, 100] : [0x80, note, 0];
  handleMessage(bytes, describe(bytes));
}

// ---------------------------------------------------------------- Serial in

let port = null;
let reader = null;
let keepReading = false;

function setSerialStatus(text, connected) {
  $("serial-status").textContent = text;
  $("connect").hidden = connected;
  $("disconnect").hidden = !connected;
  $("baud").disabled = connected;
}

async function connect() {
  synth.ensure();
  try {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: Number($("baud").value) });
  } catch (err) {
    setSerialStatus(err.name === "NotFoundError" ? "No port chosen" : `Couldn't open port: ${err.message}`, false);
    port = null;
    return;
  }
  setSerialStatus(`Connected at ${$("baud").value} baud. Waiting for MIDI...`, true);
  keepReading = true;
  readLoop();
}

async function readLoop() {
  while (port && port.readable && keepReading) {
    reader = port.readable.getReader();
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) parser.pushAll(value);
      }
    } catch (err) {
      if (keepReading) setSerialStatus(`Read error: ${err.message}`, true);
    } finally {
      reader.releaseLock();
      reader = null;
    }
  }
  if (port) {
    try {
      await port.close();
    } catch {
      // Already closed, e.g. the cable was pulled out.
    }
  }
  port = null;
  synth.allNotesOff();
  clearKeys();
  setSerialStatus("Not connected", false);
}

async function disconnect() {
  keepReading = false;
  if (reader) await reader.cancel();
}

// ---------------------------------------------------------------- Computer keyboard (same layout as GarageBand's Musical Typing)

const KEY_TO_SEMITONE = {
  KeyA: 0, KeyW: 1, KeyS: 2, KeyE: 3, KeyD: 4, KeyF: 5, KeyT: 6, KeyG: 7,
  KeyY: 8, KeyH: 9, KeyU: 10, KeyJ: 11, KeyK: 12, KeyO: 13, KeyL: 14, KeyP: 15,
  Semicolon: 16, Quote: 17,
};
let baseNote = 60;
const heldKeys = new Map(); // key code -> note it started

function showOctave() {
  $("octave").textContent = noteName(baseNote);
}

function isTyping(target) {
  return target.tagName === "INPUT" && target.type !== "range" && target.type !== "checkbox";
}

window.addEventListener("keydown", (e) => {
  if (e.repeat || e.metaKey || e.ctrlKey || isTyping(e.target)) return;
  if (e.code === "KeyZ" && baseNote > 24) { baseNote -= 12; showOctave(); return; }
  if (e.code === "KeyX" && baseNote < 96) { baseNote += 12; showOctave(); return; }
  if (!(e.code in KEY_TO_SEMITONE) || heldKeys.has(e.code)) return;
  const note = baseNote + KEY_TO_SEMITONE[e.code];
  heldKeys.set(e.code, note);
  playFromThisComputer(note, true);
});

window.addEventListener("keyup", (e) => {
  const note = heldKeys.get(e.code);
  if (note === undefined) return;
  heldKeys.delete(e.code);
  playFromThisComputer(note, false);
});

window.addEventListener("blur", () => {
  for (const [code, note] of heldKeys) {
    heldKeys.delete(code);
    playFromThisComputer(note, false);
  }
});

// ---------------------------------------------------------------- Wiring up the page

function panic() {
  synth.allNotesOff();
  clearKeys();
  if (midiOut) {
    try {
      for (let ch = 0; ch < 16; ch++) midiOut.send([0xb0 | ch, 123, 0]);
    } catch {
      // The output has gone away; nothing to silence.
    }
  }
  addLine(logLines, "Panic: all notes off");
}

function init() {
  const missing = [];
  if (!("serial" in navigator)) missing.push("Web Serial");
  if (!navigator.requestMIDIAccess) missing.push("Web MIDI");
  if (missing.length) {
    $("support").hidden = false;
    $("support").textContent = `This browser doesn't support ${missing.join(" or ")}. Please open this page in Google Chrome or Microsoft Edge.`;
  }
  if (!("serial" in navigator)) $("connect").disabled = true;

  buildPiano();
  showOctave();
  setupMidiOut();

  $("connect").addEventListener("click", connect);
  $("disconnect").addEventListener("click", disconnect);
  $("midi-out").addEventListener("change", chooseOutput);
  $("panic").addEventListener("click", panic);
  $("synth-on").addEventListener("change", (e) => {
    synth.enabled = e.target.checked;
    if (!synth.enabled) synth.allNotesOff();
  });
  $("wave").addEventListener("change", (e) => { synth.wave = e.target.value; });
  $("volume").addEventListener("input", (e) => { synth.ensure(); synth.setVolume(Number(e.target.value)); });
  $("cutoff").addEventListener("input", (e) => { synth.ensure(); synth.setCutoff(Number(e.target.value)); });
  $("attack").addEventListener("input", (e) => { synth.attack = 0.002 + Math.pow(e.target.value / 127, 2); });
  $("release").addEventListener("input", (e) => { synth.release = 0.02 + Math.pow(e.target.value / 127, 2) * 3; });

  $("attack").dispatchEvent(new Event("input"));
  $("release").dispatchEvent(new Event("input"));

  if ("serial" in navigator) {
    navigator.serial.addEventListener("disconnect", (e) => {
      if (e.target === port) disconnect();
    });
  }
}

init();
