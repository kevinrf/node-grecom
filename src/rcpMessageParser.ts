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
            const nextStxIndex = this.buffer.indexOf(0x02);
            if (nextStxIndex === -1) { break; }
            const nextChecksumIndex = this.nextMessageInBuffer();
            if (nextChecksumIndex === -1) { break; }
            const message = this.buffer.slice(nextStxIndex, nextChecksumIndex);
            this.push(message);
            this.buffer = this.buffer.slice(nextChecksumIndex);
        }
        callback();
    }

    _flush(callback: Function) {
        this.push(this.buffer);
        this.buffer = Buffer.alloc(0);
        callback();
    }

    private nextMessageInBuffer(): number {
        const nextEtxIndex = findMessageInBuffer(this.buffer);
        return nextEtxIndex ? nextEtxIndex + 1 : -1;
    }
}