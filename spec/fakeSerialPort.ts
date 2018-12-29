import * as SerialPort from "serialport/test";
const MockBinding = SerialPort.Binding;

export default async function fakeSerialPort(): Promise<SerialPort> {
    const portpath = "/dev/fakeport";
    MockBinding.reset();
    MockBinding.createPort(portpath, {echo: false, record: true});
    SerialPort.Binding = MockBinding;
    const port = new SerialPort(portpath);
    return new Promise((resolve) => port.on("open", () => resolve(port)));
}