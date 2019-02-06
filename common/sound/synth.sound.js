import Tone from '../tone';

export class SynthSound {
  constructor(oscillator = {type: 'fatsawtooth'}, polyphony = 5, envelope = {
    attack: 0.01, decay: 0.1, sustain: 0.07, release: 0.4, attackCurve: 'exponential'
  }) {
    this.synth = new Tone.PolySynth(polyphony, Tone.Synth, { oscillator, envelope }).toMaster();
  }

  get(...properties) {
    return this.synth.get(...properties);
  }

  set(...properties) {
    return this.synth.set(...properties);
  }

  play(time, {pitch = 'A4', duration = '4n', velocity = .9} = {}) {
    this.synth.triggerAttackRelease(pitch, duration, time, velocity);
  }

  attack({pitch = 'A4', time} = {}) {
    this.synth.triggerAttack(pitch, time);
  }

  release({pitch = 'A4', time} = {}) {
    this.synth.triggerRelease(pitch, time);
  }

  releaseAll(time) {
    this.synth.releaseAll(time);
  }
}

export default SynthSound;
