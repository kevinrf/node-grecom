grecom = require("../grecom");
describe ("pack()", function() {
  it("prepends the STX byte", function() {
    expect(grecom.pack([7,8,9])[0]).toEqual(0x02);
  });

  it("appends the ETX byte at the penultimate position", function() {
    expect(grecom.pack([10,15,23]).slice(-2, -1).pop()).toEqual(0x03);
  });

  it("appends the byte sum at the final position", function() {
    // ETX is included; STX is not.
    expect(grecom.pack([15, 30, 40]).slice(-1).pop()).toEqual(88);
    expect(grecom.pack([75,32]).slice(-1).pop()).toEqual(110);
  });
});
