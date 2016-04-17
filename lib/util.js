"use strict";
/**
 * Utility functions.
 * @namespace Util
 */

/**
 * Start-of-transmission byte value
 * @memberof Util
 */
const STX = 2;
/**
 * End-of-transmission byte value
 * @memberof Util
 */
const ETX = 3;

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
function bytesum(bytes) {
  var sum = bytes.slice(1).reduce((x, y) => x + y);
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
function pack(bytes) {
  bytes.unshift(STX);
  bytes.push(ETX);
  var sum = bytesum(bytes);
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
function findMessageInBuffer(bytes) {
  if (bytes[0] === STX) {
    if (bytes.includes(ETX)) {
      let candidateEtx = 0;
      let sum;
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
function parseStatus(bytes) {
  var status = {};
  status.mode = bytes[2];
  var sq = bytes[3];
  status.squelchRf = (sq & 1) > 0;
  status.unmuted = (sq & 2) > 0;
  status.squelchXf = (sq & 4) > 0;
  status.squelchHd2 = (sq & 8) > 0;
  status.squelchHd5 = (sq & 16) > 0;
  status.mobile = (sq & 32) > 0;
  status.backlightDim = (sq & 64) > 0;
  status.batteryLevel = bytes[4] + (bytes[5] << 8);
  status.charging = (bytes[5] & 0x80) > 0;
  status.rssi = bytes[6] + (bytes[7] << 8);
  status.zm = bytes[8] + (bytes[9] << 8);
  status.ledR = bytes[10];
  status.ledG = bytes[11];
  status.ledB = bytes[12];
  status.frequency = (bytes.readInt32LE(13) * 0.000001).toString();
  status.rxmode = bytes[17];
  return status;
}

module.exports = {
  bytesum: bytesum,
  pack: pack,
  findMessageInBuffer: findMessageInBuffer,
  parseStatus: parseStatus
};
