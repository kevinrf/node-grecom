"use strict";
var Util = require("../lib/util");

describe("bytesum()", () => {
  it("calculates the sum of a buffer or array of bytes", () => {
    // ETX is included; STX is not.
    expect(Util.bytesum(new Buffer([2, 15, 30, 40, 3]))).toEqual(88);
    expect(Util.bytesum([2, 75, 32, 3])).toEqual(110);
  });

  it("returns only the lowest order byte when greater than 0xFF", () => {
    expect(Util.bytesum([2, 0xF0, 100, 20, 3])).toEqual(107);
  });

  it("returns zero for an empty buffer", ()=> {
    expect(Util.bytesum([])).toEqual(0);
  });
});

describe("pack()", () => {
  it("prepends the STX byte", () => {
    expect(Util.pack([7, 8, 9])[0]).toEqual(0x02);
  });

  it("appends the ETX byte at the penultimate position", () => {
    expect(Util.pack([10, 15, 23]).slice(-2, -1).pop()).toEqual(0x03);
  });

  it("appends the byte sum at the final position", () => {
    expect(Util.pack([15, 30, 40]).slice(-1).pop()).toEqual(88);
  });
});

describe("findMessageInBuffer()", () => {
  it("finds a message and returns the index of the checksum", () => {
    let bytes = [0x02, 0x51, 0x20, 0x20, 0x03, 0x94, 0x02, 0x55, 0x25];
    expect(Util.findMessageInBuffer(new Buffer(bytes))).toEqual(5);
  });

  it("distinguishes between a data byte of 0x03 and the actual ETX", () => {
    let bytes = [0x02, 0x55, 0x25, 0x03, 0x20, 0x03, 0xA0, 0x02, 0x51, 0x20];
    expect(Util.findMessageInBuffer(new Buffer(bytes))).toEqual(6);
  });
});
