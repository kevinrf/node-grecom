import * as SerialPort from "serialport";
import RcpMessageParser from "./rcpMessageParser";
import { Transform } from "stream";

export default class SerialPortFacade {
  port: SerialPort;

  constructor(port: SerialPort) {
    this.port = port;
  }

  async write(data: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      this.port.write(data, (error) => {
        if (error) { reject(error); }
        else { resolve(); }
      });
    });
  }

  async query(request: Buffer): Promise<Buffer> {
    return this.writeAndParseResponse(request, new RcpMessageParser());
  }

  async writeAndWaitForBytes(data: Buffer, bytesToRead: number): Promise<Buffer> {
    return this.writeAndParseResponse(data, new SerialPort.parsers.ByteLength({length: bytesToRead}));
  }

  async writeAndWaitForDelimiter(data: Buffer, delimiter: string | Buffer | number[]): Promise<Buffer> {
    return this.writeAndParseResponse(data, new SerialPort.parsers.Delimiter({delimiter: delimiter, includeDelimiter: true}));
  }

  private async writeAndParseResponse(data: Buffer, parser: Transform): Promise<Buffer> {
    const readStream = this.port.pipe(parser);
    await this.write(data);
    const response: Buffer = await new Promise((resolve) => readStream.on("data", resolve));
    this.port.unpipe(readStream);
    return response;
  }
}