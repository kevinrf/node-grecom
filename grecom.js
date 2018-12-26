"use strict";

var constants = require("./src/constants");
var serialPort = require("serialport");
var Grecom = {constants: constants};
Grecom.Session = require("./src/session");

Grecom.connect = path => {
  let port = new serialPort.SerialPort(path, {baudrate: 115200});
  return new Grecom.Session(port);
};

module.exports = Grecom;
