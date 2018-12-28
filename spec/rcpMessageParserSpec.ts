import RcpMessageParser from "../src/rcpMessageParser";

describe("RcpMessageParser", () => {
    it("splits a message delimited by STX, ETX, and a checksum byte", () => {
        const parser = new RcpMessageParser();
        const messages = [];
        parser.on('data', (chunk) => { messages.push(chunk) });

        parser.write(Buffer.from([0x02, 0x51, 0x20, 0x20, 0x03, 0x94]));

        expect(messages).toEqual([Buffer.from([0x02, 0x51, 0x20, 0x20, 0x03, 0x94])]);
    });

    it("splits multiple messages", () => {
        const parser = new RcpMessageParser();
        const messages = [];
        parser.on('data', (chunk) => { messages.push(chunk) });

        parser.write(Buffer.from(
            [0x02, 0x51, 0x20, 0x20, 0x03, 0x94, 0x02, 0x51, 0x20, 0x20, 0x03, 0x94]
        ));

        expect(messages).toEqual(
            [
                Buffer.from([0x02, 0x51, 0x20, 0x20, 0x03, 0x94]),
                Buffer.from([0x02, 0x51, 0x20, 0x20, 0x03, 0x94])
            ]
        );
    });

    it("handles messages spread across stream chunks", () => {
        const parser = new RcpMessageParser();
        const messages = [];
        parser.on('data', (chunk) => { messages.push(chunk) });

        parser.write(Buffer.from(
            [0x02, 0x51, 0x20]
        ));
        parser.write(Buffer.from(
            [0x20, 0x03, 0x94, 0x02, 0x51]
        ));
        parser.write(Buffer.from(
            [0x20, 0x20, 0x03, 0x94]
        ));

        expect(messages).toEqual(
            [
                Buffer.from([0x02, 0x51, 0x20, 0x20, 0x03, 0x94]),
                Buffer.from([0x02, 0x51, 0x20, 0x20, 0x03, 0x94])
            ]
        );
    });
});