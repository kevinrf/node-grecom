"use strict";

var serialPort = require("serialport");
var constants = require("./constants");
var Request = require("./request");

/**
 * The connection to a device.
 */
class Session {
  /**
   * Open a connection to an attached device.
   * @param {string} path - The system path to the PC/IF cable (e.g. COM3 on
   * Windows).
   * @param {Object=} options - Optional settings to include for the session.
   * @param {boolean} [options.connect=true] - When false, a connection will not
   * be opened when this session is instantiated.
   */
  constructor(path, options) {
    this.path = path;
    options = options || {};
    options.connect = options.connect !== false;

    var portOpts = { baudrate: 115200, openImmediately: options.connect };
    this._port = new serialPort.SerialPort(this.path, portOpts);
    this._port.on("data", data => console.log(`Received data from radio: ${data}`));
  }

  /**
   * Send data to the device.
   * @param {Request} request - The request message to send.
   */
  write(request) {
    var bytes = request.bytes;
    console.log(`Sending data to radio: ${bytes}`);
    this._port.write(bytes);
  }

  /**
   * Emulate a key-press on the device.
   * @param {number} key - The key-code of the key to press.
   */
  sendKey(key) {
    var request = new Request(constants.command.SEND_KEY, key);
    this.write(request);
  }
}

module.exports = Session;
