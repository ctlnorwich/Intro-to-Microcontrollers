/*
  Blink
  =====
  The "Hello, World!" of physical computing: switch an LED on, wait, switch it
  off, wait, and repeat forever.

  Wiring (Gravity LED module -> Arduino UNO R4 WiFi):
    Green (signal) -> pin 3
    Red   (+)      -> 5V
    Black (-)      -> GND

  Anything after two slashes, or between slash-star and star-slash like this
  block, is a "comment". It's a note for humans; the Arduino ignores it.
*/

// Give pin 3 a name, so the code says what it means and is easy to change later.
// "const" means it never changes, "int" means it's a whole number.
const int LED_PIN = 3;

// How long to stay on and off, in milliseconds (1000 ms = 1 second).
const int ON_TIME = 500;
const int OFF_TIME = 500;

// setup() runs ONCE, as soon as the board powers up or is reset.
void setup() {
  // Pins can be inputs (listening) or outputs (doing). This one is an output.
  pinMode(LED_PIN, OUTPUT);

  // Start talking to the computer over USB at 115200 bits per second,
  // so we can see messages in the Serial Monitor.
  Serial.begin(115200);
  Serial.println("Hello from the Arduino!");
}

// loop() runs over and over again, forever, as fast as it can.
void loop() {
  // Set the pin to HIGH (5 volts): the LED switches on.
  digitalWrite(LED_PIN, HIGH);
  Serial.println("on");
  // Do nothing for ON_TIME milliseconds.
  delay(ON_TIME);

  // Set the pin to LOW (0 volts): the LED switches off.
  digitalWrite(LED_PIN, LOW);
  Serial.println("off");
  delay(OFF_TIME);
}
