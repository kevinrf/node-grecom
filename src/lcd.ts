/**
 * Represents the state of the device display.
 */
export default class Lcd {
  row1: string;
  row2: string;
  row3: string;
  row4: string;
  rssi: number;
  sIcon: boolean;
  battIconOn: boolean;
  battIconBlinking: boolean;
  aIcon: boolean;
  fIcon: boolean;
  gIcon: boolean;
  tIcon: boolean;
  upIcon: boolean;
  downIcon: boolean;
  backlight: boolean;

  /**
   * @param {Buffer} bytes - A buffer formatted as a "Get LCD" response message.
   */
  constructor(bytes: Buffer) {
    this.row1 = bytes.slice(2, 18).toString();
    this.row2 = bytes.slice(18, 34).toString();
    this.row3 = bytes.slice(34, 50).toString();
    this.row4 = bytes.slice(50, 66).toString();
    const icons1 = bytes[66];
    this.rssi = icons1 & 7;
    this.sIcon = (icons1 & 8) > 0;
    this.battIconOn = (icons1 & 16) > 0;
    this.battIconBlinking = (icons1 & 32) > 0;
    var icons2 = bytes[67];
    this.aIcon = (icons2 & 4) > 0;
    this.fIcon = (icons2 & 1) > 0;
    this.gIcon = (icons2 & 2) > 0;
    this.tIcon = (icons2 & 8) > 0;
    this.upIcon = (icons2 & 16) > 0;
    this.downIcon = (icons2 & 32) > 0;
    this.backlight = (icons2 & 64) > 0;
  }
}
