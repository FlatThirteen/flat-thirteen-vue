import Tone from '../tone';
import { KickSound, SnareSound, ClickSound } from './percussion.sound';
import CowbellSound from './cowbell.sound';
import SynthSound from './synth.sound';

let firstUserAction = false;
let Sound = {
  FX: {
    next: 'cowbell:16t:A6,E7,A7',
    auto: 'cowbell:32n:C#6,E6,E6,A6',
    layout: 'cowbell:32n:D6,F#6,Eb6,G6,E6,G#6,F6,A6',
    notes: 'cowbell:32n:F#6,G6,G#6,A6',
    backing: 'cowbell:16t:B5,A6,G#6,E6,G#6,E6,G#6,A6',
    tempo: 'cowbell:16t:A5,D6,F#6,D6,E6,A6',
    exceeded: 'cowbell:32n:,,E5,F4',
    penalty: 'cowbell:32n:F4,D4',
    wrong: 'cowbell:32n:D4,D4'
  },
  resume() {
    // New versions of Chrome don't allow Audio until user takes action.
    if (!firstUserAction) {
      // @ts-ignore: TypeScript is being stupid and not recognizing context
      return Tone.context.resume().then(() => {
        firstUserAction = true;
        console.log('Resumed AudioContext')
      });
    } else {
      return Promise.resolve();
    }
  },
  playSequence(soundName, pitches, duration, velocity) {
    let sound = Sound[soundName];
    _.forEach(pitches, (pitch, index) => {
      if (pitch) {
        let time = new Tone.Time(duration) * index;
        sound.play('+' + time, { pitch, duration, velocity });
      }
    });
  },
  effect(name) {
    if (Sound.FX[name]) {
      let [soundName, duration, notes] = Sound.FX[name].split(':');
      Sound.playSequence(soundName, notes.split(','), duration, .4);
    } else {
      console.warn('No effect named', name);
    }
  }
};

if (process.browser) {
  Sound.kick = new KickSound();
  Sound.snare = new SnareSound();
  Sound.click = new ClickSound();
  Sound.cowbell = new CowbellSound();
  Sound.synth = new SynthSound();
}
export default Sound;
