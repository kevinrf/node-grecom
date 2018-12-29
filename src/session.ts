import constants from "./constants";
import SerialPortFacade from "./serialPortFacade";
import { pack, Status, parseStatus } from "./util";
import Lcd from "./lcd";

/**
 * An attached radio. Wraps a serial port connection with a specialized
 * interface for the PC/IF protocol.
 */
export default class Session {
  private facade: SerialPortFacade;

  constructor(facade: SerialPortFacade) {
    this.facade = facade;
  }

  /**
   * Download an image of the device memory. Memory images are 67542 bytes long.
   */
  async download(): Promise<Buffer> {
    this.facade.write(Buffer.from(pack([0x43, 0x00])));
    this.facade.write(Buffer.from(pack([0x50, 0x01])));
    // give the device a moment to get ready
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.facade.writeAndWaitForBytes(Buffer.from(pack([0x45])), 67452);
  }

  /**
   * Write a memory image to the device.
   * @param data - The data to write to memory. Memory images are 67542 bytes in length.
   */
  async upload(data: Buffer): Promise<void> {
    await this.facade.writeAndWaitForDelimiter(Buffer.from(pack([0x50, 0x03])), [0x45]);
    return this.facade.write(data)
  }

  /**
   * Emulate a key-press on the device.
   * @param key - The key-code of the key to press.
   */
  async sendKey(key: number): Promise<void> {
    const bytes = [constants.command.SEND_KEY, key];
    return this.facade.write(Buffer.from(pack(bytes)));
  }

  /**
   * Tune the radio to the specified channel.
   * @param frequency - The frequency of the channel (e.g. "123.456").
   * @param rxMode - Modulation of the channel. 0=AM, 1=FM, 2=Auto.
   */
  async tune(frequency: string, rxMode: number = 2): Promise<void> {
    const bytes = [constants.command.TUNE].concat(this.frequencyToBytes(frequency));
    bytes.push(rxMode);
    return this.facade.write(Buffer.from(pack(bytes)));
  }

  private frequencyToBytes(frequency: string): number[] {
    const intValue = parseInt(parseFloat(frequency).toPrecision(9).replace(".", ""), 10);
    const buffer = Buffer.alloc(4);
    buffer.writeInt32LE(intValue, 0);
    const array = new Array(4);
    buffer.forEach((byte, index) => array[index] = byte);
    return array;
  }

  /**
   * Get the state of the device LCD.
   */
  async getLcd(): Promise<Lcd> {
    const cmd = constants.command.GET_LCD;
    const response = await this.facade.query(Buffer.from(pack([cmd])));
    return new Lcd(response);
  }

  /**
   * Get the status of the device.
   */
  async getStatus(): Promise<Status> {
    const cmd = constants.command.STATUS;
    const response = await this.facade.query(Buffer.from(pack([cmd])));
    return parseStatus(response);
  }
}
