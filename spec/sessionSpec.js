"use strict";

var Session = require("../lib/session");
var constants = require("../lib/constants");

describe("Session", () => {
  var session;
  beforeEach(() => {
    session = new Session("/dev/null", {connect: false});
  });

  describe("#writeCommand", () => {
    it("sends a request message for a command", () => {
      spyOn(session.port, 'write');
      session.writeCommand(0x41);
      expect(session.port.write).toHaveBeenCalledWith([0x02, 0x41, 0x03, 0x44]);
    });

    it("sends a request message for a command with message data", () => {
      spyOn(session.port, 'write');
      session.writeCommand(0x4B, 0x20);
      expect(session.port.write).toHaveBeenCalledWith([0x02, 0x4B, 0x20, 0x03,
        0x6E]);
    });
  });

  describe("#sendKey", () => {
    it("writes a request with the send key command byte", () => {
      spyOn(session, 'writeCommand');
      let cmd = constants.command.SEND_KEY;
      session.sendKey(constants.key.LIGHT);
      expect(session.writeCommand).toHaveBeenCalled();
      expect(session.writeCommand.calls.argsFor(0)[0]).toEqual(cmd);
    });

    it("writes a request with the key value as payload", () => {
      spyOn(session, 'writeCommand');
      let key = constants.key.LIGHT;
      session.sendKey(key);
      expect(session.writeCommand).toHaveBeenCalled();
      expect(session.writeCommand.calls.argsFor(0)[1]).toEqual(key);
    });
  });

  describe("#getLcd", () => {
    it("sends a get lcd command message", () => {
      spyOn(session, 'writeCommand');
      let cmd = constants.command.GET_LCD;
      session.getLcd();
      expect(session.writeCommand).toHaveBeenCalled();
      expect(session.writeCommand.calls.argsFor(0)[0]).toEqual(cmd);
    });

    it("executes the callback when the lcd state is received", done => {
      spyOn(session, 'writeCommand');
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
      spyOn(session, 'writeCommand');
      let cmd = constants.command.STATUS;
      session.getStatus();
      expect(session.writeCommand).toHaveBeenCalled();
      expect(session.writeCommand.calls.argsFor(0)[0]).toEqual(cmd);
    });

    it("executes the callback when the device status is received", done => {
      spyOn(session, 'writeCommand');
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
      spyOn(session, 'writeCommand');
      let cmd = constants.command.TUNE;
      session.tune("123.456", 0);
      expect(session.writeCommand).toHaveBeenCalled();
      expect(session.writeCommand.calls.argsFor(0)[0]).toEqual(cmd);
    });

    it("sends the frequency as a 32-bit little-endian integer", () => {
      spyOn(session, 'writeCommand');
      session.tune("123.456", 1);
      expect(session.writeCommand).toHaveBeenCalled();
      let payload = session.writeCommand.calls.argsFor(0)[1];
      expect(payload[0]).toEqual(0x00);
      expect(payload[1]).toEqual(0xCA);
      expect(payload[2]).toEqual(0x5B);
      expect(payload[3]).toEqual(0x07);
    });

    it("sends the rxmode", () => {
      spyOn(session, 'writeCommand');
      var rxMode = 0;
      session.tune("123.456", rxMode);
      expect(session.writeCommand).toHaveBeenCalled();
      expect(session.writeCommand.calls.argsFor(0)[1][4]).toEqual(rxMode);
    });
  });
});
