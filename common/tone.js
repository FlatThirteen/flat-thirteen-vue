let Tone = {};

if (process.browser) {
  // Load Tone only in browser
  Tone = require('Tone');
  Tone.rightNow = function() {
    return Tone.context.currentTime;
  }
}

export default Tone;
