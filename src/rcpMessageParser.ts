import { Transform } from "stream";
import { findMessageInBuffer } from "./util";

export default class RcpMessageParser extends Transform {
    private buffer: Buffer;

    constructor() {
        super();
        this.buffer = Buffer.alloc(0);
    }

    _transform(chunk: Buffer, encoding: string, callback: Function) {
        this.buffer = Buffer.concat([this.buffer, chunk]);
        while (true) {
            const nextEtxIndex = findMessageInBuffer(this.buffer);
            if (nextEtxIndex === null) { break; }
            const nextStxIndex = this.buffer.indexOf(0x02);
            const message = this.buffer.slice(nextStxIndex, nextEtxIndex + 1);
            this.push(message);
            this.buffer = this.buffer.slice(nextEtxIndex + 1);
        }
        callback();
    }

    _flush(callback: Function) {
        this.push(this.buffer);
        this.buffer = Buffer.alloc(0);
        callback();
    }
}