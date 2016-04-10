"use strict";

const STX = 2;
const ETX = 3;

class Request {
  static pack(data) {
    data.push(ETX);
    var bytesum = data.reduce((x, y) => x + y);
    data.push(bytesum);
    data.unshift(STX);
    return data;
  }

  constructor(command, payload) {
    var command = command;
    if (!Array.isArray(payload)) {
      payload = payload ? [payload] : [];
    }
    payload.unshift(command);
    this._bytes = Request.pack(payload);
  }

  get bytes() {
    return this._bytes;
  }

  get command() {
    return this._bytes[1];
  }

  get messageData() {
    return this._bytes.slice(2, -2);
  }
}

module.exports = Request;
