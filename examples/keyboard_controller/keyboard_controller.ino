/*
  Keyboard Controller (extension)
  ===============================
  The UNO R4's main chip has its own USB controller, so instead of sending
  Serial data it can pretend to BE a USB keyboard (a "HID": Human Interface
  Device). The computer can't tell the difference from a real keyboard, so
  it works with any app, no bridge needed.

  Here the sensor "types" the keys that play notes in GarageBand's Musical
  Typing and in the Serial -> MIDI Bridge page:
      A  S  D  F  G  H  J  K   =   C  D  E  F  G  A  B  C

  !!! CAREFUL !!!
  A keyboard that types by itself can be hard to stop. This sketch waits
  5 seconds before it starts typing, and only types when the reading CHANGES.
  If it goes wild, unplug the USB cable. To upload a new sketch afterwards,
  plug it back in and quickly DOUBLE-PRESS the RESET button, then upload.

  Wiring is the same as sensor_to_led.
*/

#include <Keyboard.h>

const int SENSOR_PIN = A0;
const int LED_PIN = 3;

const int SENSOR_MIN = 0;
const int SENSOR_MAX = 1023;
const int THRESHOLD = 512;   // for a digital sensor (0 or 1) set this to 0

//   1 = TRIGGER: hold down KEY while the reading is above THRESHOLD
//   2 = SCALE:   the reading picks which key in KEYS to hold down
const int MODE = 1;

const char KEY = 'a';
const char KEYS[] = "asdfghjk";
const int KEY_COUNT = sizeof(KEYS) - 1;   // minus 1 for the hidden "end of text" character

char keyHeld = 0;   // 0 means "no key held down"

int readSensor() {
  return analogRead(SENSOR_PIN);
}

void setup() {
  pinMode(LED_PIN, OUTPUT);
  pinMode(SENSOR_PIN, INPUT);

  // Safety delay, with the LED on so you know it's waiting.
  digitalWrite(LED_PIN, HIGH);
  delay(5000);
  digitalWrite(LED_PIN, LOW);

  Keyboard.begin();
}

void loop() {
  int reading = readSensor();
  char wanted = 0;

  if (MODE == 1) {
    if (reading > THRESHOLD) wanted = KEY;
  } else if (MODE == 2) {
    int index = map(reading, SENSOR_MIN, SENSOR_MAX, 0, KEY_COUNT - 1);
    wanted = KEYS[constrain(index, 0, KEY_COUNT - 1)];
  }

  // Only press or release when something changes.
  if (wanted != keyHeld) {
    if (keyHeld) Keyboard.release(keyHeld);
    if (wanted) Keyboard.press(wanted);
    keyHeld = wanted;
  }

  digitalWrite(LED_PIN, keyHeld != 0);
  delay(20);
}
