import SerialPortFacade from "../src/serialPortFacade";
import fakeSerialPort from "./fakeSerialPort";

describe("SerialPortFacade", () => {
    describe("#write", () => {
        it("writes the data to the port", async () => {
            const port = await fakeSerialPort();
            const data = Buffer.from("test message");
        
            const facade = new SerialPortFacade(port);
            await facade.write(data);
            expect(port.binding.lastWrite).toEqual(data);
        });
    });

    describe("#query", () => {
        it("writes the request message to the port", async () => {
            const port = await fakeSerialPort();
            const facade = new SerialPortFacade(port);
            const response = Buffer.from([
                0x02, 0x41, 0x00, 0x00, 0xf4, 0x01, 0x42, 0x02, 0xb9, 0x01,
                0x70, 0xdd, 0xb1, 0xf8, 0xad, 0xc9, 0x08, 0x01, 0x03, 0xac
            ]);
            const request = Buffer.from([0x02, 0x41, 0x03, 0x44]);
            port.binding.emitData(response);
            await facade.query(request);
            expect(port.binding.lastWrite).toEqual(request);
        });

        it("resolves with the response message from the device", async () => {
            const port = await fakeSerialPort();
            const facade = new SerialPortFacade(port);
            const expectedResponse = Buffer.from([
                0x02, 0x41, 0x00, 0x00, 0xf4, 0x01, 0x42, 0x02, 0xb9, 0x01,
                0x70, 0xdd, 0xb1, 0xf8, 0xad, 0xc9, 0x08, 0x01, 0x03, 0xac
            ]);
            const request = Buffer.from([0x02, 0x41, 0x03, 0x44]);
            port.binding.emitData(expectedResponse);
            const response = await facade.query(Buffer.from(request));
            expect(response).toEqual(expectedResponse);
        });
    });
});