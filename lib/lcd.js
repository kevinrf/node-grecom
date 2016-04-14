"use strict";

/**
 * Represents the state of the device display.
 */
class Lcd {
  /**
   * @param {Buffer} bytes - A buffer formatted as a "Get LCD" response message.
   */
   constructor(bytes) {
     this.row1 = bytes.slice(2, 18);
     this.row2 = bytes.slice(18, 34);
     this.row3 = bytes.slice(34, 50);
     this.row4 = bytes.slice(50, 66);
     var icons1 = bytes[66];
     this.rssi1 = (icons1 & 1) > 0;
     this.rssi2 = (icons1 & 2) > 0;
     this.rssi3 = (icons1 & 4) > 0;
     this.s_icon = (icons1 & 8) > 0;
     this.batt_icon_on = (icons1 & 16) > 0;
     this.batt_icon_blinking = (icons1 & 32) > 0;
     var icons2 = bytes[67];
     this.f_icon = (icons2 & 1) > 0;
     this.g_icon = (icons2 & 2) > 0;
     this.a_icon = (icons2 & 4) > 0;
     this.t_icon = (icons2 & 8) > 0;
     this.up_icon = (icons2 & 16) > 0;
     this.down_icon = (icons2 & 32) > 0;
     this.backlight = (icons2 & 64) > 0;
   }
}

module.exports = Lcd;
