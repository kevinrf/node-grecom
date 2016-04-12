"use strict";

var Request = require("../lib/request");

describe ("pack()", () => {
  it("prepends the STX byte", () => {
    expect(Request.pack([7,8,9])[0]).toEqual(0x02);
  });

  it("appends the ETX byte at the penultimate position", () => {
    expect(Request.pack([10,15,23]).slice(-2, -1).pop()).toEqual(0x03);
  });

  it("appends the byte sum at the final position", () => {
    // ETX is included; STX is not.
    expect(Request.pack([15, 30, 40]).slice(-1).pop()).toEqual(88);
    expect(Request.pack([75,32]).slice(-1).pop()).toEqual(110);
  });

  it("uses the lowest order byte of the sum when the actual is > 0xFF", () => {
    expect(Request.pack([0xF0, 100, 20]).slice(-1).pop()).toEqual(107);
  });
});
