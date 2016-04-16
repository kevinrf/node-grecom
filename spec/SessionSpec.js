"use strict";

var Session = require("../lib/session");
var Request = require("../lib/request")
var constants = require("../lib/constants");

describe("Session", () => {
  var session;
  beforeEach(() => {
    session = new Session("/dev/tty.test", {connect: false});
  });

  describe("#write", () => {
    it("sends request data to the serial port", () => {
      let request = new Request([7,8,9]);
      spyOn(session._port, 'write');
      session.write(request);
      expect(session._port.write).toHaveBeenCalledWith(request.bytes);
    });
  });

  describe ("#sendKey", () => {
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

  describe ("#getLcd", () => {
    let session
    beforeEach(() => {
      session = new Session("/dev/null", {connect: false});
    });

    it("sends a get lcd command message", () => {
      spyOn(session, 'write');
      session.getLcd();
      expect(session.write).toHaveBeenCalled();
      let request = session.write.calls.argsFor(0)[0];
      expect(request.command).toEqual(constants.command.GET_LCD);
    });

    it("executes the callback when the lcd state is received", (done) => {
      spyOn(session, 'write');
      let bytes = new Buffer(70);
      bytes[0] = 2;
      bytes[1] = constants.command.GET_LCD;
      bytes[68] = 3;
      session.queueForResponse(constants.command.GET_LCD, (bytes) => { done() });
      session.getLcd();
      session._receiveData(bytes);
    });
  });

  describe ("#queueForResponse", () => {
    it ("executes the callback when a matching response is received", (done) => {
      session.queueForResponse(10, (bytes) => { done() });
      session._handleResponse(new Buffer([2, 10, 5, 5, 3, 23]));
    });
  });
});
