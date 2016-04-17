"use strict";
var Request = require("../lib/request");

describe("#constructor", () => {
  it("prepares a request message for a command with no message data", () => {
    let request = new Request(0x41);
    expect(request.bytes).toEqual([0x02, 0x41, 0x03, 0x44]);
  });

  it ("prepares a request message for a command with message data", () => {
    let request = new Request(0x4B, [0x20]);
    expect(request.bytes).toEqual([0x02, 0x4B, 0x20, 0x03, 0x6E]);
  });
})
