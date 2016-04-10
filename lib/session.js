"use strict";

var serialPort = require("serialport");

class Session {
  constructor(path) {
    this._port = new serialPort.SerialPort(path, { baudrate: 115200 })
    this._port.on("data", data => console.log("Received data from radio:" + data));
  }
  write(request) {
    var data = request.getData();
    console.log(`Sending data to radio: ${data}`);
    this._port.write(data);
  }
}

module.exports = Session;
