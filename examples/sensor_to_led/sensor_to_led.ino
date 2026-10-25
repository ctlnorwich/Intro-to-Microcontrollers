/*
  Sensor to LED
  =============
  A template for turning ANY sensor reading into LED behaviour.
  Every physical computing project is the same three steps, over and over:

      INPUT  ->  PROCESS  ->  OUTPUT
      (read the sensor)  (decide what it means)  (do something about it)

  This sketch already does the PROCESS and OUTPUT parts. Your job is the
  INPUT part: find example code online for the sensor you picked and paste
  the important bits into the four places marked  >>> PASTE HERE <<<.

  Out of the box it reads an ANALOG sensor plugged into A0, so it works
  straight away with the light sensor, rotation sensor, sound sensor, etc.

  Wiring (Arduino UNO R4 WiFi):
    LED module     signal -> pin 3,  + -> 5V,    - -> GND
    Your sensor    signal -> A0 (analog), pin 2 (digital) or SDA/SCL (I2C),
                   + -> IOREF (it's another 5V pin), - -> GND

  Open Tools -> Serial Plotter to watch the numbers as a live graph.
*/

// ---------------------------------------------------------------------------
// 1. LIBRARIES
// ---------------------------------------------------------------------------
// Most analog and digital sensors need no library. I2C sensors (colour,
// accelerometer, wattmeter...) usually do. Install it from the Library Manager,
// then copy the #include line(s) from the example you found.
// >>> PASTE HERE: #include lines <<<


// ---------------------------------------------------------------------------
// 2. SETTINGS
// ---------------------------------------------------------------------------
const int SENSOR_PIN = A0;   // A0 for analog sensors, 2 for digital sensors
const int LED_PIN = 3;       // must be a pin with a ~ next to it to dim the LED

// The smallest and biggest numbers your sensor actually gives you.
// Watch the Serial Plotter, cover / shake / turn your sensor, and fill these in.
// Analog sensors give 0 to 1023. Digital sensors give 0 or 1.
const int SENSOR_MIN = 0;
const int SENSOR_MAX = 1023;

// Above this number counts as "triggered" (used by mode 1).
// For a digital sensor (0 or 1) set this to 0.
const int THRESHOLD = 512;

// What should the LED do? Change this number and upload again.
//   1 = ON / OFF:    the LED switches on when the reading is above THRESHOLD
//   2 = DIMMER:      the LED's brightness follows the reading
//   3 = BLINK SPEED: the higher the reading, the faster the LED blinks
const int MODE = 1;

// Global variables / objects from the example code (often a line that
// creates the sensor, like "DFRobot_Something sensor;").
// >>> PASTE HERE: global variables / objects <<<


// ---------------------------------------------------------------------------
// 3. SETUP: runs once
// ---------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  pinMode(SENSOR_PIN, INPUT);

  // Anything from the example's setup() that gets the sensor going
  // (but you don't need its Serial.begin, we've already done that).
  // >>> PASTE HERE: setup code <<<

}

// ---------------------------------------------------------------------------
// 4. INPUT: read the sensor and return ONE number
// ---------------------------------------------------------------------------
int readSensor() {
  // Replace this line with the code from the example's loop() that reads the
  // sensor, and "return" the number you care about.
  // e.g.  return digitalRead(SENSOR_PIN);   for a digital sensor
  //       return sensor.getRed();           for a (made up) colour sensor library
  // >>> PASTE HERE: the code that reads your sensor <<<
  return analogRead(SENSOR_PIN);
}

// ---------------------------------------------------------------------------
// 5. MAIN LOOP: input -> process -> output, forever
// ---------------------------------------------------------------------------
void loop() {
  // INPUT
  int reading = readSensor();

  // PROCESS: turn the reading into a 0-255 "level" that works for every sensor.
  // map() rescales a number from one range to another, constrain() stops it
  // going outside that range.
  int level = map(reading, SENSOR_MIN, SENSOR_MAX, 0, 255);
  level = constrain(level, 0, 255);

  // Send the numbers to the Serial Monitor / Plotter. "name:value" pairs
  // get their own line on the plotter.
  Serial.print("reading:");
  Serial.print(reading);
  Serial.print(" level:");
  Serial.println(level);

  // OUTPUT
  if (MODE == 1) {
    if (reading > THRESHOLD) {
      digitalWrite(LED_PIN, HIGH);
    } else {
      digitalWrite(LED_PIN, LOW);
    }
    delay(20);

  } else if (MODE == 2) {
    // analogWrite() "dims" an LED by flickering it on and off very fast (PWM).
    analogWrite(LED_PIN, level);
    delay(20);

  } else if (MODE == 3) {
    int waitTime = map(level, 0, 255, 500, 30);
    digitalWrite(LED_PIN, HIGH);
    delay(waitTime);
    digitalWrite(LED_PIN, LOW);
    delay(waitTime);
  }
}
