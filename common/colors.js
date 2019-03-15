import Color from 'color';

export const primaryBlue = 0x1CA0FF;
export const primaryGreen = 0x50FFA0;
export const primaryRed = 0xFF6e56;

export const intensityColors = [ 'white', 0xffff40, 0xffc46d, 0xff7272, 0xff77ff];

export function fgIntensity(intensity) {
  return Color(intensityColors[intensity]).string()
}

export function bgIntensity(intensity) {
  return Color(intensityColors[intensity]).lighten(.25).string()
}

export function hexString(hexNumber) {
  return '#' + hexNumber.toString(16).padStart(6, '0');
}

export function alpha(hexNumber, amount) {
  let r = hexNumber >> 16;
  let g = hexNumber >> 8 & 0xFF;
  let b = hexNumber & 0xFF;
  return 'rgba(' + r + ',' + g + ',' + b + ',' + amount + ')';
}
