"use strict";

var Session = require("../lib/session");
var Request = require("../lib/request")
var constants = require("../lib/constants");

describe("#write", () => {
  let session = new Session("/dev/tty.test", {connect: false});
  it("sends request data to the serial port", () => {
    let request = new Request([7,8,9]);
    spyOn(session._port, 'write');
    session.write(request);
    expect(session._port.write).toHaveBeenCalledWith(request.bytes);
  });
});

describe ("#keyPress", () => {
  let session = new Session("/dev/tty.test", {connect: false});
  it ("writes a request with the send key command byte", () => {
    spyOn(session, 'write');
    session.sendKey(constants.key.LIGHT);
    expect(session.write).toHaveBeenCalled();
    let request = session.write.calls.argsFor(0)[0];
    expect(request.command).toEqual(constants.command.SEND_KEY);
  });

  it ("writes a request with the key value as payload", () => {
    spyOn(session, 'write');
    let key = constants.key.LIGHT;
    session.sendKey(key);
    expect(session.write).toHaveBeenCalled();
    let request = session.write.calls.argsFor(0)[0];
    expect(request.messageData).toEqual([key]);
  });
});
