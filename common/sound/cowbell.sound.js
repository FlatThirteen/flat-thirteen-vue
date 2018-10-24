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

  play(time, params = {pitch: 'A5', variation: 'normal'}) {
    switch (params.variation) {
      case 'heavy':
        this.hit.triggerAttackRelease(0.5, time, 1.0);
        this.click.triggerAttackRelease(params.pitch, '16n', time);
        break;
      case 'light':
        this.hit.triggerAttackRelease(0.5, time, 0.50);
        this.click.triggerAttackRelease(params.pitch, '16n', time);
        break;
      default:
        this.hit.triggerAttackRelease(0.5, time, 1.0);
        this.click.triggerAttackRelease(params.pitch, '16n', time, 0.8);
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
