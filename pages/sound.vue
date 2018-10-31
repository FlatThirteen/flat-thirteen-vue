<template lang="pug">
  .content(@keyup="key(event)")
    .sounds
      .sound(v-for="soundName in soundNames")
        .button(@mousedown="onSound(soundName)", v-html="soundButtonLabels[soundName]")
        .name {{ soundName }}
      .active(v-if="active.length") {{ active.join(',') }}
    .sequences
      .sequence(v-for="(name, i) in fx")
        .button(@click="onEffect(name)") {{ percussionMode ? i : '&nbsp;' }}
        .name {{ name }}
</template>

<script>
  import Sound from '~/common/sound/sound';

  export default {
    head: {
      title: 'Flat Thirteen | Sound'
    },
    layout: 'debug',
    constants: {
      soundNames: ['kick', 'snare', 'click', 'cowbell', 'synth']
    },
    data() {
      return {
        lastSound: null,
        lastSoundName: null,
        activeSounds: {},
        active: [],
        octaveShift: 0
      };
    },
    mounted() {
      window.addEventListener('keydown', this.onKeyDown);
      window.addEventListener('keyup', this.onKeyUp);
    },
    destroyed() {
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('keyup', this.onKeyUp);
    },
    methods: {
      onKeyDown(event) {
        if (this.percussionMode) {
          this.lastSoundName = {
            q: 'kick',
            a: 'snare',
            z: 'click'
          }[event.key];
          this.lastSound = Sound[this.lastSoundName];
          if (this.lastSound) {
            this.lastSound.play();
          } else if (this.fx[event.key]) {
            this.onEffect(this.fx[event.key]);
          }
          if (event.key === 'ArrowDown') {
            this.onSound('cowbell', false);
          }
        } else {
          let pitch = getPitch(event.key, this.octaveShift);
          if (pitch && !this.activeSounds[pitch]) {
            this.activeSounds[pitch] = true;
            this.active = _.keys(this.activeSounds);
            this.lastSound.attack({pitch});
          } else if (event.key === 'Shift') {
            if (event.location === 1 && this.octaveShift > -3) {
              this.releaseAll(-1);
              this.octaveShift--;
            } else if (event.location === 2 && this.octaveShift < 3) {
              this.releaseAll(1);
              this.octaveShift++;
            }
          }
          if (event.key === 'ArrowDown' && this.lastSoundName === 'cowbell') {
            this.onSound('synth', false);
          } else if (event.key === 'ArrowUp') {
            if (this.lastSoundName === 'synth') {
              this.onSound('cowbell', false);
            } else {
              this.onSound('snare', false);
            }
          }
        }
      },
      onKeyUp(event) {
        let pitch = getPitch(event.key, this.octaveShift);
        if (this.lastSound && this.lastSound.release && pitch) {
          delete this.activeSounds[pitch];
          this.active = _.keys(this.activeSounds);
          this.lastSound.release({ pitch });
        }
      },
      onSound(soundName, play = true) {
        Sound.resume().then(() => {
          this.lastSoundName = soundName;
          if (this.lastSound) {
            this.releaseAll();
            this.octaveShift = 0;
          }
          this.lastSound = Sound[soundName];
          if (play) {
            if (this.lastSound) {
              this.lastSound.play();
            } else {
              console.log('Play ' + soundName + ' not supported');
            }
          }
        });
      },
      releaseAll(shift) {
        let activeSounds = {};
        if (this.lastSound) {
          _.forEach(this.active, (pitch) => {
            this.lastSound.release({pitch});
            if (shift) {
              let shiftedPitch = shiftPitch(pitch, shift);
              activeSounds[shiftedPitch] = true;
              this.lastSound.attack({ pitch: shiftedPitch });
            }
          });
        }
        this.activeSounds = activeSounds;
        this.active = _.keys(this.activeSounds);
      },
      onEffect(name) {
        Sound.effect(name);
        this.lastSound = null;
        this.lastSoundName = null;
      }
    },
    computed: {
      fx() {
        return _.keys(Sound.FX);
      },
      percussionMode() {
        return !this.lastSound || !this.lastSound.attack;
      },
      soundButtonLabels() {
        return {
          kick: this.percussionMode ? 'q' : '&nbsp;',
          snare: this.percussionMode ? 'a' : '&nbsp;',
          click: this.percussionMode ? 'z' : '&nbsp;',
          cowbell: this.lastSoundName === 'cowbell' ? this.octaveShift : '&nbsp;',
          synth: this.lastSoundName === 'synth' ? this.octaveShift : '&nbsp;'
        }
      }
    }
  }

  const keymap = {
    'q': 'C3',
    '2': 'C#3',
    'w': 'D3',
    '3': 'D#3',
    'e': 'E3',
    'r': 'F3',
    '5': 'F#3',
    't': 'G3',
    '6': 'G#3',
    'y': 'A3',
    '7': 'A#3',
    'u': 'B3',
    'i': 'C4',
    '9': 'C#4',
    'o': 'D4',
    '0': 'D#4',
    'p': 'E4',
    '[': 'F4',
    '=': 'F#4',
    ']': 'G4',
    'a': 'G#4',
    'z': 'A4',
    's': 'A#4',
    'x': 'B4',
    'c': 'C5',
    'f': 'C#5',
    'v': 'D5',
    'g': 'D#5',
    'b': 'E5',
    'n': 'F5',
    'j': 'F#5',
    'm': 'G5',
    'k': 'G#5',
    ',': 'A5',
    'l': 'A#5',
    '.': 'B5',
    '/': 'C6'
  };

  function getPitch(key, octaveShift) {
    return shiftPitch(keymap[key], octaveShift);
  }

  function shiftPitch(pitch, octaveShift) {
    if (!pitch) {
      return;
    }
    return pitch.replace(/[0-9]/, (match) => {
      return _.toNumber(match) + octaveShift;
    });
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  size = 1.5vh;

  h3
    line-height: 7 * size;
    margin: 10px 0;

  .content
    display: grid;
    grid-template-columns: auto auto;
    margin: 100px content-side-margin 50px;
    font-size: 20px;

  .name
    display: inline-block;
    font-size: 4 * size;

  .button
    background-color: main-blue;
    vertical-align: baseline;

  .sound .button
    border-radius: 50%;
    padding: size;
    height: 5 * size;
    width: @height;
    margin: size;
    font-size: 4 * size;
    line-height: 5 * size;

  .sequences
    display: flex;
    flex-direction: column;

  .sequence .button
    border-radius: 10px;
    font-size: 3 * size;
    margin: 10px;
    padding: .5 * size 2 * size;
</style>
