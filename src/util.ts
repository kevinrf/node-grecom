"use strict";
/**
 * Utility functions.
 * @namespace Util
 */

/**
 * Start-of-transmission byte value
 * @memberof Util
 */
const STX = 0x02;
/**
 * End-of-transmission byte value
 * @memberof Util
 */
const ETX = 0x03;

/**
 * Calculate the sum of bytes in a message. This is used as a checksum in the
 * remote control protocol, and in combination with the ETX character signals
 * the end of a transmission. The first byte (assumed to be the STX character)
 * is ignored for the calculation. The transmitted sum value is expected to
 * always be a single byte. If the sum is greater than 255 (0xFF) it will roll
 * over and only the lowest order byte will be returned.
 * @memberof Util
 * @param {(number[]|Buffer)} bytes - The message.
 * @return {number} The byte sum value.
 */
export function bytesum(bytes: Buffer): number {
  let sum = bytes.slice(1).reduce((x, y) => x + y, 0);
  sum &= 0xFF;
  return sum;
}

/**
 * Enclose the payload of a request (command code and any message data), with
 * start-of-text and end-of-text bytes, and the bytesum. The result is a
 * complete message ready for transmission to the device.
 * @memberof Util
 * @param {number[]} bytes - Payload to enclose. Command code in the 0th
 * position. Message data in the 1..(data.length-1) positions.
 * @return {number[]} The enclosed bytes ready for transmission.
 */
export function pack(bytes: number[]): number[] {
  bytes.unshift(STX);
  bytes.push(ETX);
  let sum = bytesum(Buffer.from(bytes));
  bytes.push(sum);
  return bytes;
}

/**
 * Search a buffer for a complete remote control protocol message response. The
 * expected format is <STX><msgCode><msgData><ETX><sum>. The length in bytes of
 * the "msgData" component varies. The buffer is searched from the beginning
 * always, with the first element as the first byte of a potential response
 * message. Intermediate subsections are not considered.
 * @memberof Util
 * @param {(number[]|Buffer)} bytes - The buffer to search.
 * @return {number} The index of the end of the message (the checksum byte) if a
 * message is found.
 */
export function findMessageInBuffer(bytes: Buffer): number | null {
  if (bytes[0] === STX) {
    if (bytes.includes(ETX)) {
      let candidateEtx = 0;
      let sum = 0;
      do {
        candidateEtx = bytes.indexOf(ETX, candidateEtx + 1);
        sum = bytesum(bytes.slice(0, candidateEtx + 1));
      } while (candidateEtx > 0 && (sum !== bytes[candidateEtx + 1]));
      if (candidateEtx > 0) {
        return candidateEtx + 1;
      }
    }
  }
  return null;
}

/**
 * Parse the response of a 'status' command into an object with the data
 * presented in sensible formats.
 * @memberof Util
 * @param {Buffer} bytes - The status response received from the device.
 * @return {Object} status - An object with the status values parsed.
 */
export function parseStatus(bytes: Buffer): Status {
  const sq = bytes[3];
  const status: Status = {
    mode: bytes[2],
    squelchRf: (sq & 1) > 0,
    unmuted: (sq & 2) > 0,
    squelchXf: (sq & 4) > 0,
    squelchHd2: (sq & 8) > 0,
    squelchHd5: (sq & 16) > 0,
    mobile: (sq & 32) > 0,
    backlightDim: (sq & 64) > 0,
    batteryLevel: bytes[4] + (bytes[5] << 8),
    charging: (bytes[5] & 0x80) > 0,
    rssi: bytes[6] + (bytes[7] << 8),
    zm: bytes[8] + (bytes[9] << 8),
    ledR: bytes[10],
    ledG: bytes[11],
    ledB: bytes[12],
    frequency: (bytes.readInt32LE(13) * 0.000001).toString(),
    rxmode: bytes[17],
  };
  return status;
}

interface Status {
  mode: number;
  squelchRf: boolean;
  unmuted: boolean;
  squelchXf: boolean;
  squelchHd2: boolean;
  squelchHd5: boolean;
  mobile: boolean;
  backlightDim: boolean;
  batteryLevel: number;
  charging: boolean;
  rssi: number;
  zm: number;
  ledR: number;
  ledG: number;
  ledB: number;
  frequency: string;
  rxmode: number;
}