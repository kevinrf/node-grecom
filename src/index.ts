import * as SerialPort from "serialport";
import SerialPortFacade from "./serialPortFacade";
import Session from "./session";

export function connect(path: string): Session {
  const port = new SerialPort(path, {baudRate: 115200});
  const serialPortFacade = new SerialPortFacade(port);
  return new Session(serialPortFacade);
}

export {default as Session} from "./session";
export {default as Constants} from "./constants";
