import Tone from '../tone';

export class KickSound {
  constructor() {
    this.player = new Tone.Player().toMaster();
    Tone.Offline(() => {
      let kick = new Tone.MembraneSynth({
        pitchDecay: 0.1,
        octaves: 8,
        oscillator: {type: 'sine'},
        envelope: {
          attack: 0.001,
          decay: 0.3,
          sustain: 0.4,
          release: 0.1
        },
        volume: 0
      }).chain(new Tone.Freeverb({roomSize: .2, wet: .2}), Tone.Master);
      let click = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 3,
        oscillator: {type: 'sine'},
        envelope: {
          attack: 0.001,
          decay: 0.1,
          sustain: 0.1,
          release: 0.1
        },
        volume: -5
      }).toMaster();
      let click2 = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 3,
        oscillator: {type: 'sine'},
        envelope: {
          attack: 0.001,
          decay: 0.1,
          sustain: 0.1,
          release: 0.1
        },
        volume: -5
      }).toMaster();
      kick.triggerAttackRelease('C#0', '16n', 0.007, .9);
      click.triggerAttackRelease('A2', '16n', 0, .9);
      click2.triggerAttackRelease('G3', '16n', 0, .9);
    }, .5).then(buffer => {
      this.player.buffer = buffer;
    });
  }

  play(time) {
    this.player.restart(time);
  }
}

export class SnareSound {
  constructor() {
    this.player = new Tone.Player().toMaster();
    Tone.Offline(() => {
      let hit = new Tone.PolySynth(6, Tone.Synth, {
        volume: 0,
        oscillator: {
          partials: [0, 2, 3, 4]
        },
        envelope: {
          attack: 0.003,
          decay: 0.07,
          sustain: 0,
        },
      }).toMaster();
      let rattle = new Tone.NoiseSynth({
        type: 'white',
        envelope: {
          attack: 0.005,
          decay: 0.15,
          sustain: 0
        },
        volume: 0
      }).chain(new Tone.Filter({ frequency: 9000 }), Tone.Master);
      hit.triggerAttackRelease(['D4', 'F#4', 'E4'], '16n', 0);
      rattle.triggerAttackRelease('16n', 0);
    }, .5).then(buffer => {
      this.player.buffer = buffer;
    });
  }

  play(time) {
    this.player.restart(time);
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
