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
});

describe("pack()", () => {
  it("prepends the STX byte", () => {
    expect(Util.pack([7,8,9])[0]).toEqual(0x02);
  });

  it("appends the ETX byte at the penultimate position", () => {
    expect(Util.pack([10,15,23]).slice(-2, -1).pop()).toEqual(0x03);
  });

  it("appends the byte sum at the final position", () => {
    expect(Util.pack([15, 30, 40]).slice(-1).pop()).toEqual(88);
  });
});
