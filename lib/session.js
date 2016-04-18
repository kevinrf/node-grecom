"use strict";

var serialPort = require("serialport");
var constants = require("./constants");
var Request = require("./request");
var Lcd = require("./lcd");
var Util = require("./Util");

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
    this._callbackQueues = new Map();
    this.path = path;
    options = options || {};
    options.connect = options.connect !== false;

    this._inBuffer = new Buffer(0);
    var portOpts = {baudrate: 115200, openImmediately: options.connect};
    this._port = new serialPort.SerialPort(this.path, portOpts);
    var session = this;
    this._port.on("data", bytes => {
      session._receiveData(bytes);
    });
  }

  /**
   * Send data to the device.
   * @param {Request} request - The request message to send.
   */
  write(request) {
    var bytes = request.bytes;
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

  /**
   * Tune the radio to the specified channel.
   * @param {string} frequency - The frequency of the channel (e.g. "123.456").
   * @param {number} [rxMode=2] - Modulation of the channel. 0=AM, 1=FM, 2=Auto.
   */
  tune(frequency, rxMode) {
    if (rxMode !== 0 && !rxMode) {
      rxMode = 2;
    }
    var intFrq = this._frequencyAsInt(frequency);
    var payload = this._writeIntToByteArray(intFrq);
    payload.push(rxMode);
    var request = new Request(constants.command.TUNE, payload);
    this.write(request);
  }

  _frequencyAsInt(strFrq) {
    return parseInt(parseFloat(strFrq).toPrecision(9).replace(".", ""), 10);
  }

  _writeIntToByteArray(int) {
    var buffer = new Buffer(4);
    buffer.writeInt32LE(int);
    var array = [];
    for (let byte of buffer) {
      array.push(byte);
    }
    return array;
  }

  /**
   * Get the state of the device LCD.
   * @param {Session~lcdCallback} callback - Callback to execute when the LCD state is
   * received.
   */
  getLcd(callback) {
    var cmd = constants.command.GET_LCD;
    this.queueForResponse(cmd, bytes => {
      var lcd = new Lcd(bytes);
      callback(lcd);
    });
    this.write(new Request(cmd));
  }
  /**
   * @callback Session~lcdCallback
   * @param {Lcd} lcd
   */

  /**
   * Get the status of the device.
   * @param {Session~statusCallback} callback - Callback to execute when the
   * status is received.
   */
  getStatus(callback) {
    var cmd = constants.command.STATUS;
    this.queueForResponse(cmd, bytes => {
      var status = Util.parseStatus(bytes);
      callback(status);
    });
    this.write(new Request(cmd));
  }
  /**
   * @callback Session~statusCallback
   * @param {Object} status - The returned status.
   */

  /**
   * Register a callback to execute when the next response message is read with
   * matching message code. The callback will be queued in order behind any
   * other calls for the same message code. For example, if one other call has
   * been made to listen for a "GET STATUS" response which has not yet been
   * received, a subsequent call would register a callback to execute upon the
   * second "GET STATUS" response received from the device.
   * @param {Number} msgCode - The message code of the response to listen for.
   * @param {Session~responseCallback} callback - The callback to register.
   */
  queueForResponse(msgCode, callback) {
    if (!Array.isArray(this._callbackQueues.get(msgCode))) {
      this._callbackQueues.set(msgCode, []);
    }
    this._callbackQueues.get(msgCode).push(callback);
  }
  /**
   * @callback Session~responseCallback
   * @param {Buffer} bytes - Full response message received from the device,
   * starting with the start-of-text byte and ending with the checksum.
   */

  _receiveData(bytes) {
    this._inBuffer = Buffer.concat([this._inBuffer, bytes]);
    var stxIdx = this._inBuffer.indexOf(0x02);
    if (stxIdx > -1) {
      var messageIdx = Util.findMessageInBuffer(this._inBuffer.slice(stxIdx));
      if (messageIdx) {
        var message = this._inBuffer.slice(stxIdx, messageIdx + 1);
        this._inBuffer = this._inBuffer.slice(messageIdx + 1);
        this._handleResponse(message);
      }
    }
  }

  _handleResponse(bytes) {
    var msgCode = bytes[1];
    var cbQueue = this._callbackQueues.get(msgCode);
    var cb = (cbQueue || []).shift();
    if (cb) {
      cb(bytes);
    }
  }
}

module.exports = Session;
