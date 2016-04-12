"use strict";

const STX = 2;
const ETX = 3;

class Request {
  /**
   * Enclose the payload of a request (command code and any message data), with
   * start-of-text and end-of-text bytes, and the bytesum. The result is a
   * complete message ready for transmission to the device.
   * @param {number[]} data - Bytes to enclose. Command code in the 0th position.
   * Message data in the 1..(data.length-1) positions.
   * @return The enclosed bytes ready for transmission.
   */
  static pack(data) {
    data.push(ETX);
    var bytesum = data.reduce((x, y) => x + y);
    data.push(bytesum);
    data.unshift(STX);
    return data;
  }

  /**
   * Create a remote control protocol request.
   * @param {number} command - The command code.
   * @param {number|number[]} [payload] - Optional message data. This is
   * typically used to specify parameters of the issued command.
   */
  constructor(command, payload) {
    var command = command;
    if (!Array.isArray(payload)) {
      payload = payload ? [payload] : [];
    }
    payload.unshift(command);
    this._bytes = Request.pack(payload);
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
