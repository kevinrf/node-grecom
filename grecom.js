"use strict";

var constants = require("./lib/constants");
var serialPort = require("serialport");
var Grecom = {constants: constants};
Grecom.Session = require("./lib/session");

Grecom.connect = path => {
  let port = new serialPort.SerialPort(path, {baudrate: 115200});
  return new Grecom.Session(port);
};

module.exports = Grecom;
