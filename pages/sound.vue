<template lang="pug">
  .content
    .sounds
      .sound(v-for="soundName in soundNames")
        .button(@mousedown="onSound(soundName)", v-html="soundButtonLabels[soundName]")
        .name {{ soundName }}
      .sound
        .button(@mousedown="onSound('custom')", v-html="customButtonLabel",
            :class="{disabled: !customValid}")
        input.custom(v-model="customSound", @keydown.stop="",
            @keydown.enter="onSound('custom')", @keydown.esc="$event.target.blur()",
            :class="{invalid: !customValid}")
      .active(v-if="active.length") {{ active.join(',') }}
    .sequences
      .sequence(v-for="(name, i) in fx")
        .button(@click="onEffect(name)") {{ percussionMode ? i : '&nbsp;' }}
        .name {{ name }}
</template>

<script>
  import Sound from '~/common/sound/sound';
  import Tone from '~/common/tone';

  const keyArray = ['q', '2', 'w', '3', 'e', 'r', '5', 't', '6', 'y', '7',
    'u', 'i', '9', 'o', '0', 'p', '[', '=', ']', 'a', 'z', 's', 'x', 'c', 'f',
    'v', 'g', 'b', 'n', 'j', 'm', 'k', ',', 'l', '.', '/'];

  export default {
    head: {
      title: 'Flat Thirteen | Sound'
    },
    layout: 'debug',
    constants: {
      soundNames: ['kick', 'snare', 'click', 'cowbell', 'synth'],
      keyLookup: _.zipObject(keyArray, _.range(keyArray.length))
    },
    data() {
      return {
        customSound: 'fatsquare5',
        customState: 'valid',
        lastSound: null,
        lastSoundName: null,
        activeSounds: {},
        active: [],
        octaveShift: 0,
        trySound: _.debounce(this._trySound, 500)
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
          let pitch = this.getPitch(event.key);
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
          if (event.key === 'ArrowDown') {
            if (this.lastSoundName === 'cowbell') {
              this.onSound('synth', false);
            } else if (this.lastSoundName === 'synth') {
              this.onSound('custom', false);
            }
          } else if (event.key === 'ArrowUp') {
            if (this.lastSoundName === 'custom') {
              this.onSound('synth', false);
            } else if (this.lastSoundName === 'synth') {
              this.onSound('cowbell', false);
            } else {
              this.onSound('snare', false);
            }
          }
        }
      },
      onKeyUp(event) {
        let pitch = this.getPitch(event.key);
        if (this.lastSound && this.lastSound.release && pitch) {
          delete this.activeSounds[pitch];
          this.active = _.keys(this.activeSounds);
          this.lastSound.release({ pitch });
        }
      },
      getPitch(key) {
        return Tone.pitch('C' + (3 + this.octaveShift), this.keyLookup[key]);
      },
      _trySound(soundName) {
        let play = this.customState === 'play';
        this.customState = Sound.set('custom', soundName) ? 'valid' : 'invalid';
        if (play) {
          this.onSound('custom');
        }
      },
      onSound(soundName, play = true) {
        Sound.resume().then(() => {
          this.lastSoundName = soundName;
          if (this.lastSound) {
            this.releaseAll();
            this.octaveShift = 0;
          }
          this.lastSound = Sound.get(soundName);
          if (play) {
            if (soundName === 'custom' && !this.customValid) {
              if (this.customState === 'invalid') {
                this.active = ['Invalid custom sound'];
              } else {
                this.customState = 'play';
              }
            } else if (this.lastSound) {
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
              pitch = Tone.pitch(pitch, 12 * shift);
              activeSounds[pitch] = true;
              this.lastSound.attack({ pitch });
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
        };
      },
      customButtonLabel() {
        return this.lastSoundName === 'custom' && this.customValid ? this.octaveShift : '&nbsp;';
      },
      customValid() {
        return this.customState === 'valid';
      }
    },
    watch: {
      customSound: {
        immediate: true,
        handler(customSound) {
          this.customState = '';
          this.trySound(customSound);
        }
      }
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  size = 1.5vh;

  h3
    line-height: 7 * size;
    margin: 10px 0;

  .content
    display: flex;
    margin: 60px 20px 10px;

  .name
    display: inline-block;
    font-size: 5vw;
    margin-right: 4vw;

  .custom
    font-size: 5vw;
    width: 30vw;
    border: none;

    &.invalid
      opacity: 0.5;

    &:focus
      outline: none;

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
    flex-flow: column wrap;
    flex: 2

  .sequence .button
    border-radius: 10px;
    font-size: 3 * size;
    margin: 10px;
    padding: .5 * size 2 * size;
</style>
