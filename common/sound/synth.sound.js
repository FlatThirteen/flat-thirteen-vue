import Tone from '../tone';

export class SynthSound {
  constructor() {
    this.synth = new Tone.PolySynth(9, Tone.Synth, {
      oscillator: {
        type: 'fatsawtooth',
        count: 3,
        spread: 30
      },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.5,
        release: 0.4,
        attackCurve: 'exponential'
      }
    }).toMaster();
  }

  play(time, params = {pitch: 'A4', duration: '4n'}) {
    this.synth.triggerAttackRelease(params.pitch, params.duration, time);
  }

  attack(params = {pitch: 'A4'}) {
    this.synth.triggerAttack(params.pitch, params.time);
  }

  release(params = {pitch: 'A4'}) {
    this.synth.triggerRelease(params.pitch, params.time);
  }
}

export default SynthSound;
