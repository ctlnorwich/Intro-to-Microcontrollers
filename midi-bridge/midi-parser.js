// Turns a stream of raw bytes from the Arduino into complete MIDI messages.
//
// MIDI messages start with a "status" byte (128-255) that says what kind of
// message it is, followed by one or two "data" bytes (0-127).
// Anything that doesn't fit that pattern (e.g. text from Serial.print) is
// counted as ignored rather than played, so stray debug text can't make noise.
// Running status (leaving out repeated status bytes) is deliberately not
// supported for the same reason.

(function (root) {
  const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  function noteName(note) {
    return NOTE_NAMES[note % 12] + (Math.floor(note / 12) - 1);
  }

  function dataLength(status) {
    const type = status & 0xf0;
    if (type === 0xc0 || type === 0xd0) return 1;
    return 2;
  }

  function describe(bytes) {
    const [status, d1, d2] = bytes;
    const type = status & 0xf0;
    const channel = (status & 0x0f) + 1;
    switch (type) {
      case 0x80:
        return { kind: "noteOff", channel, note: d1, velocity: d2, text: `Note Off   ch ${channel}  ${noteName(d1)} (${d1})  vel ${d2}` };
      case 0x90:
        if (d2 === 0) {
          return { kind: "noteOff", channel, note: d1, velocity: 0, text: `Note Off   ch ${channel}  ${noteName(d1)} (${d1})  vel 0` };
        }
        return { kind: "noteOn", channel, note: d1, velocity: d2, text: `Note On    ch ${channel}  ${noteName(d1)} (${d1})  vel ${d2}` };
      case 0xa0:
        return { kind: "aftertouch", channel, note: d1, value: d2, text: `Aftertouch ch ${channel}  ${noteName(d1)}  ${d2}` };
      case 0xb0:
        return { kind: "cc", channel, controller: d1, value: d2, text: `CC         ch ${channel}  #${d1}  value ${d2}` };
      case 0xc0:
        return { kind: "program", channel, value: d1, text: `Program    ch ${channel}  ${d1}` };
      case 0xd0:
        return { kind: "pressure", channel, value: d1, text: `Pressure   ch ${channel}  ${d1}` };
      case 0xe0: {
        const value = (d2 << 7) | d1;
        return { kind: "pitchBend", channel, value, text: `Pitch Bend ch ${channel}  ${value - 8192}` };
      }
    }
    return { kind: "unknown", text: "Unknown" };
  }

  class MidiParser {
    // onText (optional) receives bytes that aren't MIDI, so text can still be shown.
    constructor(onMessage, onText) {
      this.onMessage = onMessage;
      this.onText = onText || null;
      this.status = null;
      this.data = [];
      this.inSysex = false;
      this.ignored = 0;
    }

    push(byte) {
      // Real-time messages (clock, start, stop...) are one byte and can appear anywhere.
      if (byte >= 0xf8) return;

      if (this.inSysex) {
        if (byte === 0xf7) this.inSysex = false;
        else if (byte >= 0x80) {
          this.inSysex = false;
          this.push(byte);
        }
        return;
      }

      if (byte >= 0x80) {
        if (this.status !== null) this.ignored += 1 + this.data.length;
        this.data = [];
        this.status = null;
        if (byte === 0xf0) {
          this.inSysex = true;
        } else if (byte < 0xf0) {
          this.status = byte;
        } else {
          this.ignored += 1;
        }
        return;
      }

      if (this.status === null) {
        this.ignored += 1;
        if (this.onText) this.onText(byte);
        return;
      }

      this.data.push(byte);
      if (this.data.length === dataLength(this.status)) {
        const bytes = [this.status, ...this.data];
        this.status = null;
        this.data = [];
        this.onMessage(bytes, describe(bytes));
      }
    }

    pushAll(bytes) {
      for (const b of bytes) this.push(b);
    }
  }

  const api = { MidiParser, noteName, describe };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof window !== "undefined" ? window : globalThis);
