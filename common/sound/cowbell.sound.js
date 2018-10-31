import Tone from '../tone';

export class CowbellSound {
  constructor() {
    this.hit = new Tone.MetalSynth({
      frequency: 10,
      envelope: {
        attack: 0.005,
        decay: 0.05,
        sustain: 0
      },
      harmonicity: 1.0,
      modulationIndex: 10,
      volume: -10
    });
    this.hit.chain(Tone.Master);

    this.click = new Tone.MembraneSynth({
      pitchDecay: 0.01,
      octaves: 1,
      oscillator: {type: 'square4'},
      envelope: {
        attack: 0.001,
        decay: 0.05,
        sustain: 0.01
      },
      volume: 0
    });
    this.click.chain(Tone.Master);
  }

  play(time, {pitch = 'A5', variation = 'normal', velocity = 1} = {}) {
    switch (variation) {
      case 'heavy':
        this.hit.triggerAttackRelease(0.5, time, velocity);
        this.click.triggerAttackRelease(pitch, '16n', time, velocity);
        break;
      case 'light':
        this.hit.triggerAttackRelease(0.5, time, .5 * velocity);
        this.click.triggerAttackRelease(pitch, '16n', time, .7 * velocity);
        break;
      default:
        this.hit.triggerAttackRelease(0.5, time, velocity);
        this.click.triggerAttackRelease(pitch, '16n', time, .8 * velocity);
    }
  }

  attack(params = {pitch: 'A4'}) {
    this.hit.triggerAttack(params.time, 0.8);
    this.click.triggerAttack(params.pitch, params.time);
  }

  release() {
    this.hit.triggerRelease();
    this.click.triggerRelease();
  }
}

export default CowbellSound;
