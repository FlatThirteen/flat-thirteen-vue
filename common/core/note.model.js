import Sound from '~/common/sound/sound';
import Tone from '~/common/tone';

export class Note {
  constructor(soundName, params) {
    this.soundName = soundName;
    this.params = params;
  }

  get frequency() {
    return this.params && this.params.pitch && new Tone.Frequency(this.params.pitch);
  }

  get duration() {
    let time = new Tone.Time(this.params && this.params.duration || '16n');
    return time.toSeconds();
  }

  play(time) {
    Sound[this.soundName].play(time, this.params);
  }

  toString() {
    let pitch = this.params.pitch ? '(' + this.params.pitch + ')' : '';
    let accent = this.params.variation === 'heavy' ? '>' :
      this.params.variation === 'light' ? '*' : '';
    return accent + this.soundName + pitch;
  }

  static from(soundString, duration = '8n') {
    let matches = soundString.match(/([>\*]?)(\w+)(?:\((.+)\))?/);
    if (!matches || !Sound.hasOwnProperty(matches[2])) {
      return null;
    }
    let [whole, accent, soundName, pitch] = matches;
    let params = {};
    if (accent) {
      params.variation = accent === '>' ? 'heavy' : accent === '*' ? 'light' : 'normal';
    }
    if (pitch) {
      params.pitch = pitch;
    }
    params.duration = duration;
    return new Note(soundName, params);
  }

  static pitch(input) {
    try {
      let frequency = new Tone.Frequency(input);
      return frequency.toMidi() >= 12 ? frequency : null;
    } catch(error) {
      return null;
    }
  }
}

export default Note;
