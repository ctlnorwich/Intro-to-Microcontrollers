# Workshop Setup

For technicians and facilitators only. This is everything that needs doing before students arrive, so the session can start straight away without anyone waiting on downloads.

## Kit per student (or pair)

| Item | Notes |
| --- | --- |
| Arduino UNO R4 WiFi | Any revision. |
| USB-C data cable | Must be a *data* cable, not a charge-only one. USB-C to USB-C or USB-A to USB-C to suit the computers. |
| [DFRobot Gravity 37 PCS Sensor Set](https://www.dfrobot.com/product-1912.html) | One kit per table is fine if students share sensors. Each student needs **two** Gravity LED modules (any colours) and **one** sensor at a time. |
| Gravity 3-pin cables | One per module. These come in the kit. |
| Male-to-male jumper wires | About 12 per student. They push into the black plug on the end of each Gravity cable at one end and into the Uno's headers at the other. |

> [!NOTE]
> The UNO R4 WiFi only has one 5V pin, one 3.3V pin and three GND pins on its headers, so the workshop is designed around **one sensor and two LED modules at a time**. If you get [Gravity IO Expansion Shields](https://www.dfrobot.com/product-1009.html) in the future, every module plugs straight in and this limit goes away.

## Computers

The workshop assumes macOS, but everything used also runs on Windows and Linux.

### 1. Arduino IDE 2

1. Install the latest [Arduino IDE 2](https://www.arduino.cc/en/software).
2. Open it once and let it finish its first-run setup. It installs a set of built-in libraries (including `Keyboard`, used in the extension activity).
3. **Tools → Board → Boards Manager**, search for **Arduino UNO R4 Boards** and install it. The workshop was tested with version 1.6.0.

### 2. Libraries

Students are encouraged to find and install libraries themselves (that's part of the workshop), but on a busy network it helps to preinstall the ones the kit's I2C modules need. In **Tools → Manage Libraries...** search for and install:

| Library Manager name | For |
| --- | --- |
| `DFRobot_TCS34725` | SEN0212 colour sensor |
| `DFRobot_LIS` | SEN0224 accelerometer (it includes the `LIS2DH12` examples) |
| `DFRobot_INA219` | SEN0291 wattmeter |
| `DFRobot_RGBLCD1602` | DFR0464 LCD display |
| `Adafruit NeoPixel` | DFR0605 RGB LED |

Every other module in the kit only needs `digitalRead()` / `analogRead()`. See [SENSORS.md](../SENSORS.md) for the full list.

### 3. Google Chrome (or Microsoft Edge)

The [Serial → MIDI Bridge](../midi-bridge/index.html) page uses the Web Serial and Web MIDI APIs, which only Chromium-based browsers support. Safari and Firefox won't work.

The page works when opened straight from the folder (double-click `midi-bridge/index.html`, then make sure it opened in Chrome). You can also host it with GitHub Pages so students can use a link: in the repository go to **Settings → Pages**, set **Source** to *Deploy from a branch*, pick `main` and `/ (root)`, and it will be available at `https://ctlnorwich.github.io/Intro-to-Microcontrollers/midi-bridge/`.

The first time the page is used Chrome will ask for permission to use MIDI devices. Allow it.

### 4. IAC Driver (optional, for sending MIDI to music software)

The bridge page has its own synth, so this is only needed if students want to play software like GarageBand, Logic, Ableton Live or VCV Rack.

1. Open **Audio MIDI Setup** (<kbd>Cmd</kbd> + <kbd>Space</kbd>, type *Audio MIDI Setup*).
2. **Window → Show MIDI Studio**.
3. Double-click **IAC Driver**, tick **Device is online**, and click **Apply**.

On Windows there is no built-in equivalent; install [loopMIDI](https://www.tobias-erichsen.de/software/loopmidi.html) and create a port.

## Before the session

1. Plug in each board and upload [examples/blink](../examples/blink/blink.ino) to it, to check the board, cable and computer all work together.
2. On recent versions of macOS the first time a new USB device is plugged in you may be asked to **Allow accessory to connect**. Click Allow.
3. Check each kit has its two LED modules, cables and jumpers.

## After the session

**Upload [examples/blink](../examples/blink/blink.ino) to every board before putting them away.** If a student finished on the keyboard extension, their board is still pretending to be a keyboard and will start "typing" the next time anyone plugs it in.

If a board won't accept an upload (its port has disappeared, or it's busy typing), plug it in and quickly **double-press the RESET button**. The onboard LED will fade in and out, which means it's waiting for a new sketch. Upload straight away.

## Testing the bridge without an Arduino

Open the bridge page and play the on-screen keyboard with the mouse, or the <kbd>A</kbd> <kbd>W</kbd> <kbd>S</kbd> <kbd>E</kbd> <kbd>D</kbd>... keys on the computer keyboard. If you hear sound, the synth works. If the IAC Driver is selected under *MIDI out*, the notes will also appear in any music software listening to it.
