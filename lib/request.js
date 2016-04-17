"use strict";
var Util = require("../lib/util");

class Request {
  /**
   * Create a remote control protocol request.
   * @param {number} command - The command code.
   * @param {number|number[]} [payload] - Optional message data. This is
   * typically used to specify parameters of the issued command.
   */
  constructor(command, payload) {
    if (!Array.isArray(payload)) {
      payload = payload ? [payload] : [];
    }
    payload.unshift(command);
    this._bytes = Util.pack(payload);
  }

  /**
   * The raw bytes of the request to be transmitted to the device.
   * @type {number[]}
   */
  get bytes() {
    return this._bytes;
  }

  /**
   * The command code of the request.
   * @type {number}
   */
  get command() {
    return this._bytes[1];
  }

  /**
   * The bytes of the message data included with the request, if any.
   * @type {number[]}
   */
  get messageData() {
    return this._bytes.slice(2, -2);
  }
}

module.exports = Request;
