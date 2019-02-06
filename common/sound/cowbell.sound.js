import Tone from '../tone';

export class CowbellSound {
  constructor() {
    this.bell = new Tone.MembraneSynth({
      pitchDecay: 0.01,
      octaves: 1,
      oscillator: {type: 'square4'},
      envelope: {
        attack: 0.001,
        decay: 0.05,
        sustain: 0.01
      },
      volume: -10
    });
    this.bell.chain(Tone.Master);
  }

  play(time, {pitch = 'A5', variation = 'normal', velocity = 1} = {}) {
    let multiplier = variation === 'heavy' ? .9 : variation === 'light' ? .5 : .7;
    this.bell.triggerAttackRelease(pitch, '16n', time, multiplier * velocity);
  }

  attack({pitch = 'A4', time}) {
    this.bell.triggerAttack(pitch, time);
  }

  release() {
    this.bell.triggerRelease();
  }
}

export default CowbellSound;
