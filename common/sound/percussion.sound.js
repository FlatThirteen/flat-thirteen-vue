import Tone from '../tone';

export class KickSound {
  constructor() {
    this.kick = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 8,
      oscillator: {type: 'sine'},
      envelope: {
        attack: 0.001,
        decay: 0.3,
        sustain: 0.1,
        release: 0.1
      },
      volume: 5
    });
    this.kick.chain(Tone.Master);
  }

  play(time) {
    this.kick.triggerAttackRelease('A0', '16n', time, .9);
  }
}

export class SnareSound {
  constructor() {
    this.hit = new Tone.PolySynth(6, Tone.Synth, {
      volume: 0,
      oscillator: {
        partials: [0, 2, 3, 4]
      },
      envelope: {
        attack: 0.003,
        decay: 0.07,
        sustain: 0,
      },
    });
    this.hit.chain(Tone.Master);

    this.rattle = new Tone.NoiseSynth({
      type: 'white',
      envelope: {
        attack: 0.005,
        decay: 0.15,
        sustain: 0
      },
      volume: 0
    });
    const lowPass = new Tone.Filter({ frequency: 9000 });
    this.rattle.chain(lowPass, Tone.Master);
  }

  play(time) {
    this.hit.triggerAttackRelease(['D4', 'F#4', 'E4'], '16n', time);
    this.rattle.triggerAttackRelease('16n', time);
  }
}

export class ClickSound {
  constructor() {
    this.click = new Tone.MembraneSynth({
      pitchDecay: 0.01,
      octaves: 6,
      oscillator: {type: 'square4'},
      envelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0
      },
      volume: -30
    });
    this.click.connect(Tone.Master);
  }

  play(time, params = {variation: 'normal'}) {
    switch (params.variation) {
      case 'heavy':
        this.click.triggerAttackRelease('A6', '16n', time, .7);
        break;
      case 'light':
        this.click.triggerAttackRelease('A5', '16n', time, .5);
        break;
      default:
        this.click.triggerAttackRelease('A5', '16n', time);
    }
  }
}
