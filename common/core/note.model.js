import Sound from '~/common/sound/sound';
import Tone from '~/common/tone';

export class Note {
  constructor(soundName, params) {
    this.soundName = soundName;
    this.type = params && params.type || soundName;
    this.params = params;
  }

  get frequency() {
    return this.params && this.params.pitch && new Tone.Frequency(this.params.pitch);
  }

  get duration() {
    let time = new Tone.Time(this.params && this.params.duration || '16n');
    return time.toSeconds();
  }

  extendDuration(duration) {
    this.params.duration = new Tone.Time(new Tone.TimeBase(this.params.duration) +
        new Tone.TimeBase(duration)).toNotation();
  }

  play(time) {
    Sound[this.soundName].play(time, this.params);
  }

  toString() {
    return Note.toString(this.soundName, this.params);
  }

  static from(noteString, duration = '8n') {
    let matches = noteString.match(/([>\*]?)(\w+)(?:\((.+)\))?/);
    if (!matches || !Sound.hasOwnProperty(matches[2])) {
      return null;
    }
    let [, accent, soundName, pitch] = matches;
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

  static toString(soundName, {pitch, variation} = {}) {
    pitch = pitch ? '(' + pitch + ')' : '';
    let accent = variation === 'heavy' ? '>' : variation === 'light' ? '*' : '';
    return accent + soundName + pitch;
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
