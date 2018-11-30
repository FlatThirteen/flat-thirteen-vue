import Tone from '../tone';

export class SynthSound {
  constructor(oscillator = {type: 'fatsawtooth'}, envelope = {
    attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.4, attackCurve: 'exponential'
  }) {
    this.synth = new Tone.PolySynth(9, Tone.Synth, { oscillator, envelope }).toMaster();
  }

  play(time, {pitch = 'A4', duration = '4n', velocity = 1} = {}) {
    this.synth.triggerAttackRelease(pitch, duration, time, velocity);
  }

  attack({pitch = 'A4', time} = {}) {
    this.synth.triggerAttack(pitch, time);
  }

  release({pitch = 'A4', time} = {}) {
    this.synth.triggerRelease(pitch, time);
  }
}

export default SynthSound;
