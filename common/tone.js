let Tone = { rightNow() {} };

if (process.browser) {
  // Load Tone only in browser
  Tone = require('tone');
  Tone.rightNow = function() {
    return Tone.context.currentTime;
  };
  Tone.pitch = function(rootNote, interval) {
    return _.trim(interval) ? new Tone.Frequency(rootNote).transpose(interval).toNote() : '';
  };
}

export default Tone;
