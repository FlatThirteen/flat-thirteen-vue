<template lang="pug">
  .content(@keyup="key(event)")
    h3
      .button(@mousedown="onSound('kick')") {{ kickKey }}
      | Kick
    h3
      .button(@mousedown="onSound('snare')") {{ snareKey }}
      | Snare
    h3
      .button(@mousedown="onSound('click')") {{ clickKey }}
      | Click
    h3
      .button(@mousedown="onSound('cowbell')") {{ showKey('cowbell') }}
      | Cowbell
    h3
      .button(@mousedown="onSound('synth')") {{ showKey('synth') }}
      | Synth
    .active(v-if="active.length") {{ active }}
</template>

<script>
  import Sound from '~/common/sound/sound';

  let globalKeyDown;
  let globalKeyUp;

  export default {
    head: {
      title: 'Flat Thirteen | Sound'
    },
    layout: 'debug',
    data: function() {
      return {
        lastSound: null,
        lastSoundName: null,
        activeSounds: {},
        active: [],
        octaveShift: 0
      };
    },
    mounted: function() {
      globalKeyDown = (e) => this.keyDown(e);
      globalKeyUp = (e) => this.keyUp(e);
      window.addEventListener('keydown', globalKeyDown);
      window.addEventListener('keyup', globalKeyUp);
    },
    destroyed: function() {
      window.removeEventListener('keydown', globalKeyDown);
      window.removeEventListener('keyup', globalKeyUp);
    },
    methods: {
      keyDown(event) {
        if (this.percussionMode) {
          this.lastSoundName = {
            q: 'kick',
            a: 'snare',
            z: 'click'
          }[event.key];
          this.lastSound = Sound[this.lastSoundName];
          if (this.lastSound) {
            this.lastSound.play();
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
      keyUp(event) {
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
              console.log('Play sound:', soundName);
            } else {
              console.log('Play ' + soundName + ' not supported');
            }
          }
        });
      },
      showKey(soundName) {
        return this.lastSoundName === soundName && this.lastSound.attack ?
          this.octaveShift : '';
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
      }
    },
    computed: {
      percussionMode() {
        return !this.lastSound || !this.lastSound.attack;
      },
      kickKey() {
        return this.percussionMode ? 'q' : '';
      },
      snareKey() {
        return this.percussionMode ? 'a' : '';
      },
      clickKey() {
        return this.percussionMode ? 'z' : '';
      },
      cowbellKey() {
        return this.lastSound === 'cowbell' ? this.octaveShift : '';
      },
      synthKey() {
        return this.lastSound === 'synth' ? this.octaveShift : '';
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
  @import "~assets/stylus/button.styl"

  size = 1.5vh;

  h3
    line-height: 7 * size;
    margin: 10px 0;

  .content
    margin: 100px content-side-margin 50px;
    position: relative;

    .button
      border-radius: 50%;
      position: absolute;
      padding: size;
      height: 5 * size;
      width: @height;
      margin-left: -8 * size;
      background-color: main-blue;
      font-size: 4 * size;
      line-height: 5 * size;

      &:hover
        margin-top: -1 button-shadow-size;
</style>
