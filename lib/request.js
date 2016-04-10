"use strict"

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
    this.command = command;
    payload = payload || [];
    this.payload = payload;
    payload.unshift(command);
    this.data = Request.pack(payload);
  }

  getData() {
    return this.data;
  }
}

module.exports = Request;
