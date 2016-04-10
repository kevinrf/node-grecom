"use strict";
const STX = 2;
const ETX = 3;
var serialPort = require("serialport")

class grecom {
  static about() {
    console.log("some cool stuff coming soon");
  }

  static pack(data) {
    data.push(ETX);
    var bytesum = data.reduce((x, y) => x + y);
    data.push(bytesum);
    data.unshift(STX);
    return data;
  }

  constructor(path) {
    this._port = new serialPort.SerialPort(path, { baudrate: 115200 })
    this._port.on("data", data => console.log("Received data from radio:" + data));
  }

  write(command, payload) {
    payload.unshift(command);
    var data = Grecom.pack(payload);
    console.log(`Sending data to radio: ${data}`);
    this._port.write(data);
  }
}

module.exports = grecom;
