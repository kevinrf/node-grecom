"use strict";

const STX = 2;
const ETX = 3;

/**
 * Calculate the sum of bytes in a message. This is used as a checksum in the
 * remote control protocol, and in combination with the ETX character signals
 * the end of a transmission. The first byte (assumed to be the STX character)
 * is ignored for the calculation. The transmitted sum value is expected to
 * always be a single byte. If the sum is greater than 255 (0xFF) it will roll
 * over and only the lowest order byte will be returned.
 * @param {(number[]|Buffer)} bytes
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
 * @param {number[]} data - Bytes to enclose. Command code in the 0th position.
 * Message data in the 1..(data.length-1) positions.
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
 * @param {(number[]|Buffer)} bytes - The buffer to search.
 * @return {number} The index of the end of the message (the checksum byte) if a
 * message is found.
 */
function findMessageInBuffer(bytes) {
  if (bytes[0] === STX) {
    if (bytes.includes(ETX)) {
      var candidateEtx = 0;
      do {
        candidateEtx = bytes.indexOf(ETX, candidateEtx + 1);
        var sum = bytesum(bytes.slice(0, candidateEtx + 1));
      } while (candidateEtx > 0 && (sum !== bytes[candidateEtx + 1]));
      if (candidateEtx > 0) {
        return candidateEtx + 1;
      } else {
        return null;
      }
    }
  }
}

module.exports = {
  bytesum: bytesum,
  pack: pack,
  findMessageInBuffer: findMessageInBuffer
}