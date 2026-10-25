# Sensor Cheat Sheet

Every module in the [DFRobot Gravity 37 PCS Sensor Set](https://www.dfrobot.com/product-1912.html), and what you need to know to plug it into the Arduino UNO R4 WiFi.

- **SKU** is the code printed on the module. Search for it (e.g. `DFR0026 Arduino`) to find more code and projects.
- **Wiki** is DFRobot's official page for the module, with a wiring diagram and example code. It's the best place to start.
- **Library** is what to search for in the Arduino IDE's Library Manager. "None" means you only need `digitalRead()` or `analogRead()`.
- The wiring in the "Signal to" column matches the [workshop wiring](README.md#wiring-your-sensor). Power (**red**, +) always goes to **IOREF** and ground (**black**, −) to **GND**.

## Digital inputs

These give `0` or `1` with `digitalRead()`. Connect the signal (**green**) wire to **pin 2**.

| SKU | Module | Senses | Reading | Library | Wiki | Watch out for |
| --- | --- | --- | --- | --- | --- | --- |
| DFR0029 | Push button (white, red, yellow) | Being pressed | `1` while pressed | None | [wiki](https://wiki.dfrobot.com/dfr0029-r/) | Buttons "bounce": one press can look like several very fast presses. |
| DFR0030 | Capacitive touch | A finger touching the pad | `1` while touched | None | [wiki](https://wiki.dfrobot.com/dfr0030/) | Works through thin paper or plastic. Can be set off by nearby cables. |
| DFR0028 | Tilt | Being tipped over | Changes between `0` and `1` | None | [wiki](https://wiki.dfrobot.com/dfr0028/) | Just on or off, it can't tell you the angle. |
| DFR0033 | Magnetic | A magnet nearby | **`0` when a magnet is near**, `1` otherwise | None | [wiki](https://wiki.dfrobot.com/dfr0033/) | Backwards from what you'd expect! Try both ends of the magnet. |
| SEN0289 | Shake | Being shaken | `0` for a moment when shaken | None | [wiki](https://wiki.dfrobot.com/sen0289/) | Only works when shaken in one direction. Try a few. |
| DFR0027 | Vibration | Knocks and vibration | Flickers when knocked | None | [wiki](https://wiki.dfrobot.com/dfr0027/) | Gives quick, messy pulses rather than a steady signal. |
| SEN0171 | PIR motion | People moving nearby (up to ~7 m) | `1` when motion is seen, and stays `1` for a few seconds | None | [wiki](https://wiki.dfrobot.com/sen0171/) | Needs 30 to 60 seconds after power-up to settle down. |
| SEN0223 | Conductivity switch | Something conductive bridging its two probes: metal, skin, fruit... | Changes when the probes are connected | None | [wiki](https://wiki.dfrobot.com/sen0223/) | Very sensitive, so it can be twitchy. Great for touching fruit! |

## Analogue inputs

These give `0` to `1023` with `analogRead()`. Connect the signal (**blue**) wire to **A0**.

| SKU | Module | Senses | Reading | Library | Wiki | Watch out for |
| --- | --- | --- | --- | --- | --- | --- |
| DFR0026 | Ambient light | Brightness | Higher = brighter | None | [wiki](https://wiki.dfrobot.com/dfr0026/) | Good for "lighter or darker", not exact measurements. |
| DFR0058 | Rotation (knob) | How far it's turned | `0` to `1023` across its full turn | None | [wiki](https://wiki.dfrobot.com/dfr0058/) | It turns many times, not just once, before reaching the end. Don't force it past the end. |
| DFR0034 | Sound | Sound picked up by a microphone | Wobbles around the middle; bigger wobbles = louder | None | [wiki](https://wiki.dfrobot.com/dfr0034/) | One reading tells you very little. Take lots of readings and look at the difference between the highest and lowest to get "loudness". |
| SEN0307 | URM09 ultrasonic distance | Distance to an object (2 to 500 cm) | Higher = further away. `reading * 520 / 1023` ≈ cm | None | [wiki](https://wiki.dfrobot.com/sen0307/) | Bounces sound off things, so soft or angled objects are hard for it to see. |
| DFR0023 | LM35 temperature | Temperature | `reading * 500.0 / 1023` ≈ °C | None | [wiki](https://wiki.dfrobot.com/dfr0023/) | Changes slowly. Hold it between your fingers to warm it up. |
| DFR0076 | Flame | Infrared light from flames | Changes when it sees infrared light. Watch the Serial Plotter to see which way | None | [wiki](https://wiki.dfrobot.com/dfr0076/) | Sunlight, old-fashioned bulbs and TV remotes set it off too. No real flames in the workshop, please! |
| DFR0022 | Greyscale | How light or dark a surface is, close up | Changes with how reflective the surface is | None | [wiki](https://wiki.dfrobot.com/dfr0022/) | Hold it a few mm from the surface. Room lighting affects it. |
| DFR0052 | Piezo disk vibration | Taps and knocks | A spike, bigger for harder knocks | None | [wiki](https://wiki.dfrobot.com/dfr0052/) | Called "digital" but it's **analogue**: plug it into A0. Great as a drum pad. |
| SEN0114 | Soil moisture | Water between its two prongs | **Higher = wetter** | None | [wiki](https://wiki.dfrobot.com/sen0114/) | Try a damp tissue or a cup of water. Keep the electronics at the top dry. |
| SEN0121 | Steam | Water and steam on its sensing strip | Higher = wetter | None | [wiki](https://wiki.dfrobot.com/sen0121/) | Breathe on it! Only the striped part should get wet. |
| SEN0203 | Heart rate | Your pulse through a fingertip | Analogue: a wavy pulse shape. Digital: a blip per beat | None | [wiki](https://wiki.dfrobot.com/sen0203/) | Has a tiny **A / D switch**. Set it to **D** and use pin 2 with `digitalRead()` for the easy version. Keep your finger still and gentle. |
| DFR0061 | Joystick | Two directions and a button | X and Y: `0` to `1023`, about `512` in the middle. Button: `0` when pressed | None | [wiki](https://wiki.dfrobot.com/dfr0061/) | Has **5 wires**: X to **A0**, Y to **A1**, button to **pin 2**. |
| DFR0051 | Voltage divider | Voltages up to 25 V | Multiply the voltage it reads by 5 | None | [wiki](https://wiki.dfrobot.com/dfr0051/) | For measuring other circuits. Not much use on its own today. |
| SEN0132 | Carbon monoxide (MQ7) | CO gas | Higher = more gas | None | [wiki](https://wiki.dfrobot.com/sen0132/) | **Not recommended today.** It gets hot and needs minutes to warm up. |

## I2C inputs

These use 4 wires and need a library. Connect **green (SDA)** to **SDA** and **blue (SCL)** to **SCL**: the two pins at the top left of the board, next to AREF.

| SKU | Module | Senses | Reading | Library | Wiki | Watch out for |
| --- | --- | --- | --- | --- | --- | --- |
| SEN0212 | TCS34725 colour | The colour of something held right up to it | Separate red, green, blue and brightness numbers | `DFRobot_TCS34725` | [wiki](https://wiki.dfrobot.com/sen0212/) | Hold objects 3 to 10 mm away. Room lighting changes the readings. |
| SEN0224 | LIS2DH accelerometer | Movement and tilt in 3 directions | X, Y and Z acceleration | `DFRobot_LIS` (use the `LIS2DH12` examples) | [wiki](https://wiki.dfrobot.com/sen0224/) | If it says it can't be found, its address might be `0x18` or `0x19`. Try the other one. |
| SEN0291 | Wattmeter | Voltage, current and power flowing through it | Volts, milliamps, milliwatts | `DFRobot_INA219` | [wiki](https://wiki.dfrobot.com/sen0291/) | For measuring other circuits. Not much use on its own today. |

## Outputs

Swap one of your LED modules for one of these to get a richer output.

| SKU | Module | Does | How to control it | Library | Wiki | Watch out for |
| --- | --- | --- | --- | --- | --- | --- |
| DFR0021 | LED (white, red, green, blue) | Lights up | `digitalWrite(pin, HIGH)` for on, `analogWrite(pin, 0-255)` to dim on a **~** pin | None | [wiki](https://wiki.dfrobot.com/dfr0021-w/) | Needs power (red) connected, not just the signal. |
| DFR0605 | RGB LED | Lights up in any colour | Send it a colour with a library. **Not** `digitalWrite`! | `Adafruit NeoPixel` | [wiki](https://wiki.dfrobot.com/dfr0605/) | It's a "NeoPixel" (WS2812): search for NeoPixel examples. It has 1 pixel. |
| DFR0464 | LCD display, RGB backlight | Shows 2 lines of 16 characters, backlight any colour | `lcd.print("Hello")`, `lcd.setRGB(255, 0, 0)` | `DFRobot_RGBLCD1602` | [wiki](https://wiki.dfrobot.com/dfr0464/) | Uses I2C, so wire it like the I2C sensors above. Very bright: turn the backlight down. |
| DFR0440 | Vibration motor | Buzzes (haptics) | `digitalWrite` on/off, or `analogWrite` on a **~** pin for strength | None | [wiki](https://wiki.dfrobot.com/dfr0440/) | Needs power (red) connected. |
| FIT0449 | Speaker | Beeps and tones | `tone(pin, frequency)` and `noTone(pin)` | None | [wiki](https://wiki.dfrobot.com/fit0449/) | Volume is set by the tiny knob on the board. Turn it up if you hear nothing (and down for your neighbours!). |
| DFR0411 | DC motor with fan | Spins | `digitalWrite` on/off, or `analogWrite` on a **~** pin for speed | None | [wiki](https://wiki.dfrobot.com/dfr0411/) | Only spins one way. Don't hold the fan still while it's on. |
| DFR0473 | Relay | Switches another circuit on and off | `digitalWrite` | None | [wiki](https://wiki.dfrobot.com/dfr0473/) | **Leave this one in the box today.** It's for switching other, bigger circuits. |

## Gravity cable colours

| Cable | Red | Black | Green | Blue |
| --- | --- | --- | --- | --- |
| 3-wire, digital module | **+** power (VCC) | **−** ground (GND) | Signal | |
| 3-wire, analogue module | **+** power (VCC) | **−** ground (GND) | | Signal |
| 4-wire, I2C module | **+** power (VCC) | **−** ground (GND) | SDA (data) | SCL (clock) |

Cable colours can vary between batches. If in doubt, follow the wire back to the module, where each pin is labelled.
