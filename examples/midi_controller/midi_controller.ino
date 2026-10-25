/*
  MIDI Controller
  ===============
  Turns your sensor into a MIDI controller. The Arduino sends MIDI messages
  down the USB cable as Serial data, and the Serial -> MIDI Bridge web page
  (midi-bridge/index.html) turns them into sound, or passes them on to any
  music app on the computer.

      sensor  ->  Arduino  ->  USB Serial  ->  bridge page  ->  synth / DAW
      INPUT       PROCESS      (a wire)        (translator)     OUTPUT

  A MIDI message is just three numbers:
      1. what kind of message + which channel   e.g. 144 = "Note On, channel 1"
      2. which note / which knob                e.g. 60  = middle C
      3. how hard / how far                     e.g. 100 = fairly loud

  Wiring is the same as sensor_to_led:
    LED module     signal -> pin 3   (shows what the Arduino is sending)
    Your sensor    signal -> A0 (analog) or pin 2 (digital), + -> IOREF

  IMPORTANT: close the Serial Monitor and Serial Plotter before connecting
  the bridge page. Only one program can use the USB port at a time.
*/

// ---------------------------------------------------------------------------
// SETTINGS
// ---------------------------------------------------------------------------
const int SENSOR_PIN = A0;
const int LED_PIN = 3;

// Copy these from your sensor_to_led sketch.
// Digital sensors give 0 or 1, so use SENSOR_MAX = 1 and THRESHOLD = 0.
const int SENSOR_MIN = 0;
const int SENSOR_MAX = 1023;
const int THRESHOLD = 512;

// What kind of controller is it? Change this number and upload again.
//   1 = TRIGGER: plays NOTE when the reading goes above THRESHOLD, stops when it drops
//                (great for buttons, touch, tilt, shake, magnet, PIR, sound...)
//   2 = KNOB:    sends the reading as a Control Change (CC) message, like turning a knob
//                (great for light, rotation, distance, temperature...). Moves the filter.
//   3 = THEREMIN: the reading picks a note from a scale, so moving plays a melody
const int MODE = 1;

const int MIDI_CHANNEL = 1;   // 1 to 16
const int NOTE = 60;          // 60 = middle C. 61 = C#, 62 = D... 72 = the next C up
const int VELOCITY = 100;     // 1 to 127, how hard the note is "hit"
const int CC_NUMBER = 74;     // which "knob" we are. 74 is often a filter, 1 is the mod wheel

// Notes for THEREMIN mode: a C minor pentatonic scale over two octaves.
// Change them to anything you like!
const int SCALE[] = {48, 51, 53, 55, 58, 60, 63, 65, 67, 70, 72};
const int SCALE_LENGTH = sizeof(SCALE) / sizeof(SCALE[0]);

// Set to true to print readings as text too. The bridge page shows text
// separately under "Text from the Arduino", so it won't make any noise.
const bool DEBUG = false;

// ---------------------------------------------------------------------------
// MIDI HELPERS: each one sends the three numbers of a MIDI message
// ---------------------------------------------------------------------------
void sendMidi(int command, int data1, int data2) {
  // The first number is the command plus the channel (channels count from 0 inside MIDI).
  Serial.write(command + (MIDI_CHANNEL - 1));
  Serial.write(data1);
  Serial.write(data2);
}

void noteOn(int note, int velocity) {
  sendMidi(144, note, velocity);       // 144 = Note On
}

void noteOff(int note) {
  sendMidi(128, note, 0);              // 128 = Note Off
}

void controlChange(int number, int value) {
  sendMidi(176, number, value);        // 176 = Control Change
}

// ---------------------------------------------------------------------------
// INPUT: same as in sensor_to_led. Paste your sensor code here (and any
// #include lines / setup code at the top / in setup()).
// ---------------------------------------------------------------------------
int readSensor() {
  return analogRead(SENSOR_PIN);
}

// Remember what we did last time round the loop, so we only send a message
// when something CHANGES. Otherwise we'd flood the computer with thousands
// of identical messages a second.
bool notePlaying = false;
int lastValue = -1;
int lastNote = -1;
float smoothed = 0;

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  pinMode(SENSOR_PIN, INPUT);
  smoothed = readSensor();
}

void loop() {
  // INPUT, smoothed out a little so the wobble in analog readings doesn't
  // send a stream of tiny changes.
  int reading = readSensor();
  smoothed = smoothed + (reading - smoothed) * 0.2;

  // PROCESS: rescale to MIDI's 0-127 range.
  int value = map((int)smoothed, SENSOR_MIN, SENSOR_MAX, 0, 127);
  value = constrain(value, 0, 127);

  // OUTPUT 1: MIDI
  if (MODE == 1) {
    bool triggered = reading > THRESHOLD;
    if (triggered && !notePlaying) {
      noteOn(NOTE, VELOCITY);
      notePlaying = true;
    } else if (!triggered && notePlaying) {
      noteOff(NOTE);
      notePlaying = false;
    }

  } else if (MODE == 2) {
    if (value != lastValue) {
      controlChange(CC_NUMBER, value);
      lastValue = value;
    }

  } else if (MODE == 3) {
    int index = map(value, 0, 127, 0, SCALE_LENGTH - 1);
    int note = SCALE[index];
    if (note != lastNote) {
      if (lastNote >= 0) noteOff(lastNote);
      noteOn(note, VELOCITY);
      lastNote = note;
    }
    notePlaying = true;
  }

  // OUTPUT 2: feedback on the LED, so you can see what the Arduino "thinks".
  // In KNOB mode its brightness follows the value; otherwise it's on while a note plays.
  if (MODE == 2) {
    analogWrite(LED_PIN, value * 2);
  } else {
    digitalWrite(LED_PIN, notePlaying);
  }

  if (DEBUG) {
    Serial.print("reading: ");
    Serial.print(reading);
    Serial.print("  midi value: ");
    Serial.println(value);
  }

  delay(10);
}
