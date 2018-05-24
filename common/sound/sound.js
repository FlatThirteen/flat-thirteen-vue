import Tone from '../tone';
import { KickSound, SnareSound, ClickSound } from './percussion.sound';
import CowbellSound from './cowbell.sound';
import SynthSound from './synth.sound';

let firstUserAction = false;
let Sound = {
  resume: function() {
    // New versions of Chrome don't allow Audio until user takes action.
    if (!firstUserAction) {
      // @ts-ignore: TypeScript is being stupid and not recognizing context
      return Tone.context.resume().then(() => {
        firstUserAction = true;
        console.log('Resumed AudioContext')
      });
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
