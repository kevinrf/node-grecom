"use strict";

import Session from "../src/session";
import constants from "../src/constants";

describe("Session", () => {
  var session;
  beforeEach(() => {
    let port = jasmine.createSpyObj('serialport', ['read']);
    port.write = () => {};
    session = new Session(port);
  });

  describe("#writeCommand", () => {
    it("sends a request message for a command", () => {
      spyOn(session.port, 'write');
      session.writeCommand(0x41);
      expect(session.port.write).toHaveBeenCalled();
      expect(session.port.write.calls.argsFor(0)[0]).toEqual([0x02, 0x41, 0x03,
        0x44]);
    });

    it("sends a request message for a command with message data", () => {
      spyOn(session.port, 'write');
      session.writeCommand(0x4B, 0x20);
      expect(session.port.write.calls.argsFor(0)[0]).toEqual([0x02, 0x4B, 0x20,
        0x03, 0x6E]);
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

  describe("#download", () => {
    beforeEach(() => {
      jasmine.clock().install();
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it("sends the download command", () => {
      spyOn(session, 'writeCommand');
      session.download();
      expect(session.writeCommand).toHaveBeenCalled();
      expect(session.writeCommand.calls.argsFor(0)).toEqual([0x43, 0x00]);
    });

    it("sends the transfer initiation byte after the download command", () => {
      spyOn(session, 'writeCommand');
      session.download();
      let callCount = session.writeCommand.calls.count();
      jasmine.clock().tick(501);
      expect(session.writeCommand.calls.count()).toEqual(callCount + 1);
      expect(session.writeCommand.calls.argsFor(2)).toEqual([0x45]);
    });

    it("calls the callback function after receiving 67452 bytes", done => {
      spyOn(session, 'write');
      session.download(data => {
        expect(data.length).toEqual(67452);
        done();
      });
      jasmine.clock().tick(501);
      session._receiveData(new Buffer(67451));
      session._receiveData(new Buffer(1));
    });

    it("resumes usual parsing of received data after the transfer", done => {
      spyOn(session, 'write');
      session.download();
      jasmine.clock().tick(501);
      session._receiveData(new Buffer(67451));
      session._receiveData(new Buffer(1));
      spyOn(session, 'writeCommand');
      let nextData = [0x02, 0x41, 0x00, 0x00, 0xf4, 0x01, 0x42, 0x02, 0xb9,
        0x01, 0x70, 0xdd, 0xb1, 0xf8, 0xad, 0xc9, 0x08, 0x01, 0x03, 0xac];
      session.getStatus(() => done());
      session._receiveData(new Buffer(nextData));
    });
  });

  describe("#upload", () => {
    beforeEach(() => {
      jasmine.clock().install();
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it("sends the upload command", () => {
      spyOn(session, 'writeCommand');
      session.upload();
      expect(session.writeCommand).toHaveBeenCalled();
      expect(session.writeCommand.calls.argsFor(0)).toEqual([0x50, 0x03]);
    });

    it("waits for the transfer initiation byte before sending data", done => {
      let requestReceived = false;
      let transferInitiated = false;
      let txInitiateStub = () => {
        expect(session.write.calls.count()).toEqual(1);
        transferInitiated = true;
        session._receiveData(new Buffer([0x45]));
      };
      spyOn(session, 'write').and.callFake(() => {
        if (!requestReceived) {
          requestReceived = true;
          setTimeout(txInitiateStub, 100);
          jasmine.clock().tick(101);
        } else if (transferInitiated) {
          done();
        }
      });
      session.upload();
    });

    it("calls the callback function when the transfer is over", done => {
      session.port = jasmine.createSpyObj('port', ["write"]);
      session.port.drain = jasmine.createSpy('drain').and.callFake(cb => {
        if (cb) {
          cb(null, 1);
        }
      });
      session.port.write = jasmine.createSpy('write').and.callFake((b, cb) => {
        cb(null, b.length);
      });
      session.upload(new Buffer(67452), () => done());
      session._receiveData(new Buffer([0x45]));
    });
  });
});
