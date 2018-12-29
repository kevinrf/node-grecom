import * as SerialPort from "serialport";
import RcpMessageParser from "./rcpMessageParser";
import { Transform } from "stream";

export default class SerialPortFacade {
    private port: SerialPort;
    private readStream: Transform;

    constructor(port: SerialPort) {
        this.port = port;
        this.readStream = port.pipe(new RcpMessageParser());
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
        await this.write(request);
        return new Promise((resolve) => this.readStream.on("data", resolve));
    }
}