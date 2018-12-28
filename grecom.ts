var constants = require("./src/constants");
var serialPort = require("serialport");
var Grecom = {constants: constants};

export default {
  Session: require("./src/session"),
  connect: (path: string) => {
    let port = new serialPort.SerialPort(path, { baudrate: 115200 });
    return new this.Session(port);
  }
}
