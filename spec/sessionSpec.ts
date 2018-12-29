import Session from "../src/session";
import constants from "../src/constants";

describe("Session", () => {
  var session;
  beforeEach(() => {
    let port = jasmine.createSpyObj('serialport', ['read']);
    port.write = () => {};
    session = new Session(port);
  });

  describe("#sendKey", () => {
    let facade;
    beforeEach(() => {
      facade = jasmine.createSpyObj('SerialPortFacade', ['write']);
      facade.write = async () => {};
      facade.port = session.port;
    });

    it("writes a formatted message with the send key command and given key", async () => {
      const subject = new Session(facade);
      spyOn(facade, 'write');
      await subject.sendKey(constants.key.LIGHT);
      expect(facade.write).toHaveBeenCalled();
      const expectedMessage = Buffer.from([0x02, 0x4b, 0x20, 0x03, 0x6e])
      expect(facade.write.calls.argsFor(0)[0]).toEqual(expectedMessage);
    });
  });

  describe("#tune", () => {
    let facade;
    beforeEach(() => {
      facade = jasmine.createSpyObj('SerialPortFacade', ['write']);
      facade.write = async () => { };
      facade.port = session.port;
    });

    it("sends a tune command message", async () => {
      const subject = new Session(facade);
      spyOn(facade, 'write');
      const cmd = constants.command.TUNE;
      const rxMode = 0;
      await subject.tune("123.456", rxMode);
      const sentMessage = facade.write.calls.argsFor(0)[0];
      expect(sentMessage[0]).withContext("STX byte").toEqual(0x02);
      expect(sentMessage[1]).withContext("Tune command byte").toEqual(cmd)
      expect(sentMessage.slice(2, 6)).withContext("Frequency as 32-bit little-endian integer")
        .toEqual(Buffer.from([0x00, 0xCA, 0x5B, 0x07]));
      expect(sentMessage[6]).withContext("RX mode").toEqual(rxMode);
      expect(sentMessage[7]).withContext("ETX byte").toEqual(0x03);
      expect(sentMessage[8]).withContext("checksum").toEqual(0x83);
    });
  });

  describe("#getLcd", () => {
    let facade;

    beforeEach(() => {
      facade = jasmine.createSpyObj('SerialPortFacade', ['query']);
      facade.query = async () => {};
      facade.port = session.port;
      let responseBytes = Buffer.alloc(70);
      responseBytes.fill(0x00);
      responseBytes[0] = 2;
      responseBytes[1] = constants.command.GET_LCD;
      responseBytes.write("Hello, world!   ", 2);
      responseBytes[68] = 3;
      responseBytes[69] = constants.command.GET_LCD + 3;
      spyOn(facade, 'query').and.returnValue(Promise.resolve(responseBytes));
    });

    it("sends a get lcd command message", async () => {
      const subject = new Session(facade);
      const cmd = constants.command.GET_LCD;
      await subject.getLcd();
      expect(facade.query).toHaveBeenCalled();
      expect(facade.query.calls.argsFor(0)[0]).toEqual(Buffer.from([0x02, cmd, 0x03, 0x4f]));
    });

    it("returns an Lcd instance created from the response message", async () => {
      const subject = new Session(facade);
      const lcd = await subject.getLcd();
      expect(lcd.row1).toEqual("Hello, world!   ");
    });
  });

  describe("#getStatus", () => {
    let facade;

    beforeEach(() => {
      facade = jasmine.createSpyObj('SerialPortFacade', ['query']);
      facade.query = async () => {};
      facade.port = session.port;
      let responseBytes = Buffer.alloc(20);
      responseBytes.fill(0x00);
      responseBytes[0] = 2;
      responseBytes.writeInt32LE(162400000, 13);
      responseBytes[1] = constants.command.STATUS;
      responseBytes[18] = 3;
      responseBytes[19] = constants.command.GET_LCD + 3;
      spyOn(facade, 'query').and.returnValue(Promise.resolve(responseBytes));
    });

    it("sends a status command message", async () => {
      const subject = new Session(facade);
      let cmd = constants.command.STATUS;
      await subject.getStatus();
      expect(facade.query).toHaveBeenCalled();
      expect(facade.query.calls.argsFor(0)[0]).toEqual(Buffer.from([0x02, cmd, 0x03, 0x44]));
    });

    it("returns a Status object created from the response message", async () => {
      const subject = new Session(facade);
      const status = await subject.getStatus();
      expect(status.frequency).toEqual("162.400");
    });
  });

  describe("#download", () => {
    let facade;
    const responseBytes = Buffer.alloc(67452);

    beforeEach(() => {
      facade = jasmine.createSpyObj('SerialPortFacade', {
        "writeAndWaitForBytes": Promise.resolve(responseBytes),
        "write": Promise.resolve()
      });
      facade.port = session.port;
    });

    it("sends the download command sequence and resolves with a Buffer containing the memory file", async () => {
      const subject = new Session(facade);
      const response = await subject.download();
      expect(facade.write.calls.argsFor(0)[0]).withContext("first handshake sequence message")
        .toEqual(Buffer.from([0x02, 0x43, 0x00, 0x03, 0x46]));
      expect(facade.write.calls.argsFor(1)[0]).withContext("second handshake sequence message")
        .toEqual(Buffer.from([0x02, 0x50, 0x01, 0x03, 0x54]));
      expect(facade.writeAndWaitForBytes.calls.argsFor(0)[0]).withContext("initiate transfer signal")
        .toEqual(Buffer.from([0x02, 0x45, 0x03, 0x48]));
      expect(response).withContext("received file data").toEqual(responseBytes);
    });
  });

  describe("#upload", () => {
    let facade;
    const memoryFileBytes = Buffer.alloc(67452);

    beforeEach(() => {
      facade = jasmine.createSpyObj('SerialPortFacade', {
        "write": Promise.resolve(),
        "writeAndWaitForDelimiter": Promise.resolve(Buffer.from([0x45]))
      });
      facade.port = session.port;
    });

    it("performs the upload handshake and sends the file data to the port", async () => {
      const subject = new Session(facade);
      await subject.upload(memoryFileBytes);
      expect(facade.writeAndWaitForDelimiter.calls.argsFor(0)).withContext("handshake")
        .toEqual([Buffer.from([0x02, 0x50, 0x03, 0x03, 0x56]), [0x45]]);
      expect(facade.write.calls.argsFor(0)[0]).withContext("memory file transfer")
        .toEqual(memoryFileBytes);
    });
  });
});
