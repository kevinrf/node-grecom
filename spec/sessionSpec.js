"use strict";

var Session = require("../lib/session");
var Request = require("../lib/request");
var constants = require("../lib/constants");

describe("Session", () => {
  var session;
  beforeEach(() => {
    session = new Session("/dev/null", {connect: false});
  });

  describe("#write", () => {
    it("sends request data to the serial port", () => {
      let request = new Request([7, 8, 9]);
      spyOn(session._port, 'write');
      session.write(request);
      expect(session._port.write).toHaveBeenCalledWith(request.bytes);
    });
  });

  describe("#sendKey", () => {
    it("writes a request with the send key command byte", () => {
      spyOn(session, 'write');
      session.sendKey(constants.key.LIGHT);
      expect(session.write).toHaveBeenCalled();
      let request = session.write.calls.argsFor(0)[0];
      expect(request.command).toEqual(constants.command.SEND_KEY);
    });

    it("writes a request with the key value as payload", () => {
      spyOn(session, 'write');
      let key = constants.key.LIGHT;
      session.sendKey(key);
      expect(session.write).toHaveBeenCalled();
      let request = session.write.calls.argsFor(0)[0];
      expect(request.messageData).toEqual([key]);
    });
  });

  describe("#getLcd", () => {
    it("sends a get lcd command message", () => {
      spyOn(session, 'write');
      session.getLcd();
      expect(session.write).toHaveBeenCalled();
      let request = session.write.calls.argsFor(0)[0];
      expect(request.command).toEqual(constants.command.GET_LCD);
    });

    it("executes the callback when the lcd state is received", done => {
      spyOn(session, 'write');
      let bytes = new Buffer(70);
      bytes.fill(0x00);
      bytes[0] = 2;
      bytes[1] = constants.command.GET_LCD;
      bytes[68] = 3;
      bytes[69] = constants.command.GET_LCD + 3;
      session.queueForResponse(constants.command.GET_LCD, () => done());
      session.getLcd();
      session._receiveData(bytes);
    });
  });

  describe("#getStatus", () => {
    it("sends a status command message", () => {
      spyOn(session, 'write');
      session.getStatus();
      expect(session.write).toHaveBeenCalled();
      let request = session.write.calls.argsFor(0)[0];
      expect(request.command).toEqual(constants.command.STATUS);
    });

    it("executes the callback when the device status is received", done => {
      spyOn(session, 'write');
      let data = [0x02, 0x41, 0x00, 0x00, 0xf4, 0x01, 0x42, 0x02, 0xb9, 0x01,
        0x70, 0xdd, 0xb1, 0xf8, 0xad, 0xc9, 0x08, 0x01, 0x03, 0xac];
      session.getStatus(() => done());
      session._receiveData(new Buffer(data));
    });
  });

  describe("#queueForResponse", () => {
    it("executes the callback when a matching response is received", done => {
      session.queueForResponse(10, () => done());
      session._handleResponse(new Buffer([2, 10, 5, 5, 3, 23]));
    });
  });

  describe("#tune", () => {
    it("sends a tune command message", () => {
      spyOn(session, 'write');
      session.tune("123.456", 0);
      expect(session.write).toHaveBeenCalled();
      let request = session.write.calls.argsFor(0)[0];
      expect(request.command).toEqual(constants.command.TUNE);
    });

    it("sends the frequency as a 32-bit little-endian integer", () => {
      spyOn(session, 'write');
      session.tune("123.456", 1);
      expect(session.write).toHaveBeenCalled();
      let request = session.write.calls.argsFor(0)[0];
      expect(request.messageData[0]).toEqual(0x00);
      expect(request.messageData[1]).toEqual(0xCA);
      expect(request.messageData[2]).toEqual(0x5B);
      expect(request.messageData[3]).toEqual(0x07);
    });

    it("sends the rxmode", () => {
      spyOn(session, 'write');
      var rxMode = 0;
      session.tune("123.456", rxMode);
      expect(session.write).toHaveBeenCalled();
      let request = session.write.calls.argsFor(0)[0];
      expect(request.messageData[4]).toEqual(rxMode);
    });
  });
});
