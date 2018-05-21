let Tone = {};

if (process.browser) {
  // Load Tone only in browser
  Tone = require('Tone');
}

export default Tone;
