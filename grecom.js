"use strict";
const STX = 2;
const ETX = 3;

class grecom {
  static about() {
    console.log("some cool stuff coming soon");
  }

  static pack(data) {
    data.push(ETX);
    var bytesum = data.reduce((x, y) => x + y);
    data.push(bytesum);
    data.unshift(STX);
    return data;
  }
}

module.exports = grecom;
