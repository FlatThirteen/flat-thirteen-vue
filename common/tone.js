let Tone = { rightNow() {} };

if (process.browser) {
  // Load Tone only in browser
  Tone = require('tone');
  Tone.rightNow = function() {
    return Tone.context.currentTime;
  }
}

export default Tone;
