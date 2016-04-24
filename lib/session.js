"use strict";

var serialPort = require("serialport");
var constants = require("./constants");
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
    this.port = new serialPort.SerialPort(this.path, portOpts);
    this._bufferHandler = this._remoteControlBufferHandler;
    var session = this;
    this.port.on("data", bytes => {
      session._receiveData(bytes);
    });
  }

  /**
   * Send raw data to the device.
   * @param {Number[]|Buffer} bytes - The bytes to write.
   */
  write(bytes) {
    this.port.write(bytes);
  }

  /**
   * Send a request message in the remote control protocol format.
   * @param {Number} command - The command code.
   * @param {Number|Number[]} [payload] - Optional message data. This is
   * typically used to specify parameters of the issued command.
   */
  writeCommand(command, payload) {
    if (!Array.isArray(payload)) {
      payload = payload ? [payload] : [];
    }
    payload.unshift(command);
    var bytes = Util.pack(payload);
    this.write(bytes);
  }

  /**
   * Download an image of the device memory. Memory images are 67542 bytes long.
   * @param {Session~downloadCallback} callback - Callback to execute when the
   * memory file transfer completes.
   */
  download(callback) {
    this._downloadCallback = callback;
    this._bufferHandler = this._downloadBufferHandler;
    this.writeCommand(0x50, 0x01);
    setTimeout(() => {
      this.write(0x45);
    }, 500);
  }
  /**
   * @callback Session~downloadCallback
   * @param {Buffer} data - The data received.
   */

  _downloadBufferHandler() {
    if (this._inBuffer.length === 67452) {
      var data = this._inBuffer.slice(0, 67452);
      if (this._downloadCallback instanceof Function) {
        this._downloadCallback(data);
      }
      this._downloadCallback = undefined;
      this._inBuffer = this._inBuffer.slice(67452);
      this._bufferHandler = this._remoteControlBufferHandler;
    }
  }

  /**
   * Emulate a key-press on the device.
   * @param {number} key - The key-code of the key to press.
   */
  sendKey(key) {
    this.writeCommand(constants.command.SEND_KEY, key);
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
    this.writeCommand(constants.command.TUNE, payload);
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
    this.writeCommand(cmd);
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
    this.writeCommand(cmd);
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
    this._bufferHandler();
  }

  _remoteControlBufferHandler() {
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
