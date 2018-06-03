<template lang="pug">
  .grid(:class="gridClass", @mouseleave="unselect()")
    .strip-container
      .strip(v-for="key in keys")
        .beat(v-for="(pulses, beat) in pulsesByBeat", :class="beatClass[beat]")
          .pulse(v-for="cursor in cursorsFor(beat)", :class="pulseClass[cursor]")
            .fx.note(v-if="isOn[cursor][key]",
                :class="[live(key, cursor), soundName[key], noteName[pulses]]")
    .overlay
      .strip(v-for="key in keys")
        .beat(v-for="(pulses, beat) in pulsesByBeat", :class="beatClass[beat]")
          .pulse(v-for="cursor in cursorsFor(beat)", :class="pulseClass[cursor]")
            .actual.note(v-if="isOn[cursor][key]",
                :class="[live(key, cursor), soundName[key], noteName[pulses]]")
    slot
    .faces
      <!--particle-fx([type]="particleType", [count]="particleCount$ | async")-->
      .face(v-for="(pulses, beat) in pulsesByBeat", :class="faceClass[beat]")
        .eyes(:class="eyesClass[beat]")
    .overlay
      .strip(v-for="key in keys")
        .beat(v-for="(pulses, beat) in pulsesByBeat", :class="beatClass[beat]")
          .pulse(v-for="(cursor, pulse) in cursorsFor(beat)",
              :class="pulseClass[cursor]", @mouseenter="select(key, cursor)")
            .controls
              .note(@click="onNote(key, cursor)",
                  :class="[noteName[pulses], isOn[cursor][key] && 'on']")
    .glass.overlay(v-if="false")
</template>

<script>
  import { mapGetters } from 'vuex';

  import BeatTick from '~/common/core/beat-tick.model';
  import Sound from '~/common/sound/sound';

  export default {
    props: {
      grid: {
        type: Object,
        default: () => ({
          soundId: 'qa',
          soundByKey: {
            q: 'snare',
            a: 'kick'
          }
        })
      }
    },
    data: function() {
      return {
        activeBeat: -1,
        activeBeatTick: null,
        liveKeyCursor: null,
        noteName: {
          1: 'quarter',
          2: 'eighth',
          3: 'triplet',
          4: 'sixteenth'
        }
      };
    },
    mounted() {
      this.$bus.$on(BeatTick.EVENT, this.beatTickHandler);
    },
    destroyed() {
      this.$bus.$off(BeatTick.EVENT, this.beatTickHandler);
    },
    methods: {
      beatTickHandler({beat, beatTick}) {
        if (!this.paused) {
          this.activeBeat = beat;
          if (this.beatTicks.includes(beatTick)) {
            this.activeBeatTick = beatTick;
          }
        }
      },
      select(key, cursor) {
        this.$store.commit('keyMode');
        this.$store.commit('player/select', { cursor, soundId: this.soundId(key) });
      },
      unselect() {
        this.$store.commit('keyMode');
        this.$store.commit('player/unselect');
      },
      onNote(key, cursor) {
        Sound.resume();
        let soundName = (cursor === undefined || !this.isOn[cursor][key]) &&
            this.soundName[key];

        this.$store.dispatch('player/set', {cursor, soundName,
          soundId: this.soundId(key)
        });
        if (this.paused && soundName) {
          this.liveKeyCursor = key + this.cursor;
          Sound[soundName].play();
        }
      },
      isBeat(beat) {
        return beat === this.activeBeat;
      },
      live(key, cursor) {
        return this.liveKeyCursor === key + cursor ? 'live' : '';
      },
      soundId(key) {
        return this.grid.soundId || key || this.keys;
      },
    },
    computed: {
      keys() {
        return _.keys(this.grid.soundByKey);
      },
      soundName() {
        return this.grid.soundByKey;
      },
      isSelected() {
        return this.keyMode || (this.grid.soundId ?
            this.grid.soundId === this.selected :
            !!this.grid.soundByKey[this.selected]);
      },
      isOn() {
        return _.times(this.numPulses, cursor => {
          return _.mapValues(this.soundName, (soundName, key) => {
            return soundName === this.getDataFor({
              beatTick: this.beatTickFor(cursor),
              soundId: this.soundId(key)
            });
          });
        });
      },
      gridClass() {
        return {
          standby: !this.starting && this.paused,
          playback: this.starting || !this.paused,
          selected: this.isSelected,
          starting: this.starting
        };
      },
      beatClass() {
        return _.map(this.measureTops, top => top ? 'first-measure' : '');
      },
      pulseClass() {
        return _.times(this.numPulses, cursor => ({
          active: this.activeBeatTick === this.beatTickFor(cursor),
          cursor: this.playerCursor === cursor
        }));
      },
      faceClass() {
        return _.times(this.numBeats, beat => ({
          active: this.isBeat(beat),
          cursor: this.playerBeat === beat
        }));
      },
      eyesClass() {
        return _.times(this.numBeats, beat => ({
          left: this.playerBeat + 1 === beat,
          right: this.playerBeat - 1 === beat,
          wrong: false,
          very: false
        }));
      },
      playerBeat() {
        return this.beatPulse[0];
      },
      ...mapGetters({
        keyDown: 'keyDown',
        keyUp: 'keyUp',
        keyMode: 'keyMode',
        noKeysHeld: 'noKeysHeld',
        starting: 'transport/starting',
        paused: 'transport/paused',
        numBeats: 'transport/numBeats',
        measureTops: 'transport/measureTops',
        pulsesByBeat: 'player/pulsesByBeat',
        numPulses: 'player/numPulses',
        cursorsFor: 'player/cursorsFor',
        beatTicks: 'player/beatTicks',
        beatTickFor: 'player/beatTickFor',
        getDataFor: 'player/getDataFor',
        selected: 'player/selected',
        cursor: 'player/cursor',
        playerCursor: 'player/cursor',
        beatPulse: 'player/beatPulse',
      })
    },
    watch: {
      keyDown(key) {
        if (key === ' ' || key === 'Backspace') {
          this.$store.dispatch('player/unset', this.soundId());
        } else if (this.soundName[key]) {
          this.onNote(key);
        }
      },
      keyUp(key) {
        if (this.noKeysHeld && this.soundName[key]) {
          this.$store.dispatch('player/move', 1);
        }
      },
      paused(paused) {
        if (paused) {
          this.activeBeat = -1;
          this.activeBeatTick = '';
        } else {
          this.liveKeyCursor = null;
        }
      }
    }
  }

</script>
<style scoped lang="stylus" type="text/stylus">
  @import "~assets/stylus/note.styl"

  button-shadow-size = 4px;
  faces-height = 5vh;

  .grid
    margin: auto;
    position: relative;
    user-select: none;
    width: 100%;
    max-width: 80vh;

  .overlay
    posit(absolute, 0, 0, faces-height);
    margin-bottom: 15px;

  .glass
    display: flex;
    align-items: center;
    justify-content: center;

    .points
      color: active-blue;
      font-size: 15vw;
      font-weight: 600;
      text-shadow: 0 3px 6px rgba(255, 255, 255, 0.6)
      white-space: nowrap;

      .char
        display: inline-block;

  .strip, .faces
    display: flex;
    margin: 0;
    width: 100%;

  .strip-container, .faces
    background-color: back-blue;

    .victory &
      background-color: back-green;

  .beat, .face
    transition: background-color 150ms ease-in-out;

  .victory
    .strip-container .beat, .face
      background-color: main-green;

  .strip-container .first-measure.beat:not(:first-child):before
    posit(absolute, 0, 100%, 0, x)
    background-color: #FFF;
    content: '';
    height: 8vh;
    max-height: 8vw;
    margin: auto 4px;
    width: 2px;

  .faces
    display: flex;
    margin-top: 5px;
    position: relative;

  particle-fx
    posit(absolute);
    margin: - faces-height 0 0;

  .face
    flex: 1 1 0;
    height: faces-height;
    min-height: 25px;
    margin: 5px;
    background-color: main-blue;

  eyes-path(tl, bl = 100% - tl, tr = tl, br = bl, tl2 = tl, bl2 = bl, tr2 = tr, br2 = br)
    polygon(0% tl, 50% tl2, 50% tr2, 100% tr,
    100% br, 50% br2, 50% bl2, 0% bl);

  clip-path(param)
    clip-path param;
    -webkit-clip-path param;

  .eyes
    posit(relative, 25%, x, x, 0);
    margin: 0 auto;
    height: 17px;
    width: 4vw;
    min-width: 30px;
    max-width: 40px;
    padding: 1px;
    transition: all 100ms ease-in-out;
    display: flex;
    justify-content: space-between;
    clip-path(eyes-path(0%));

    .goal &, .count &
      clip-path(eyes-path(60%, 70%));

    .goal &.wrong
      clip-path(eyes-path(50%, 70%, 35%, 60%, 65%, 70%, 55%));
      animation-duration: 50ms;

      &.very
        clip-path(eyes-path(50%, 70%, 15%, 80%, 65%, 70%, 55%));

    .victory &
      clip-path: none;

    .active &
      animation: blink;
      animation-duration: 250ms;

    .selected:not(.goal) .faces:not(:hover) &
      &.left, &.right
        top: 10%;

      &.left
        left: -1vw;

      &.right
        left: 1vw;

    .selected:not(.goal) .faces:not(:hover) .cursor &
      top: 0;

    &:before, &:after
      background-color: eye-color = #000;
      content: '';
      border: solid 0 eye-color;
      border-radius: 50%;
      height: 17px;
      width: 12px;
      transition: all 150ms ease-in-out;

      .victory &
        animation: bounce 500ms ease infinite;
        background-color: transparent;
        border-radius: 50% 50% 0 0;
        border-width: 3px 0 0 0;

    &:before
      left: 0;

    &:after
      right: 0;

    &:hover
      margin-top: 8px;

      &:before, &:after
        height: 2px;

  .eyes:hover:active
    animation: shake 500ms ease infinite;

  @keyframes blink
    0%, 100%
      transform: translateY(0) scaleY(1);

    20%
      transform: translateY(1vh) scaleY(.3)

    40%
      transform: translateY(1.4vh) scaleY(.2);

    80%
      transform: translateY(1vh) scaleY(.5)

  @keyframes bounce
    0%, 95%
      transform: translateY(0)

    25%
      transform: translateY(.7vh)

    50%
      transform: translateY(-.8vh)

    65%
      transform: translateY(.5vh)

    80%
      transform: translateY(-.3vh)

  @keyframes shake
    0%, 100%
      transform: translate3d(0, 0, 0)

    25%
      transform: translate3D(.7vw, -.1vh, 0)

    50%
      transform: translate3D(-.8vw, -.2vh, 0)

    65%
      transform: translate3D(.5vw, -.2vh, 0)

    80%
      transform: translate3D(-.3vw, -.1vh, 0)

  .beat
    align-items: center;
    display: inline-flex;
    flex: 1 1 0;
    height: 20vh;
    max-height: 20vw;
    margin: 5px;
    position: relative;
    text-align: center;

    .strip-container &
      background-color: main-blue;

  .active
    .strip-container .beat &, &.face
      background-color: active-blue;

    .strip-container .beat &, &.face
      .victory &
        background-color: active-green;

  .pulse
    .strip-container &:not(:last-child)
      border-right: dotted 3px back-blue;

      .victory &
        border-right-color: back-green;

    display: inline-flex;
    flex: 1;
    height: 100%;
    position: relative;

  note-size(percent, line-adjust = 0)
    line-height (percent - line-adjust)vh;
    height (percent)vh;
    width (percent)vw;
    max-height (percent)vw;
    max-width (percent)vh;

  .quarter
    font-size: 10vh;
    note-size(16, 1);

  .eighth
    font-size: 6vh;
    note-size(9, 1);

  .triplet
    font-size: 4vh;
    note-size(6);

  .sixteenth
    font-size: 2vh;
    note-size(4);

  .note
    background-color: #000;
    border-radius: 50%;
    margin: auto;

    .goal &.actual
      opacity: 0.3;

    &.fx
      background-color: transparent;

  .controls
    posit(absolute, 0, x, x, 0);
    align-items: center;
    display: inline-flex;
    height: 100%;
    opacity: 0;
    width: 100%;

    .note
      background-color: rgba(0, 0, 0, 0.1);
      color: rgba(0, 0, 0, 0.5);
      transform: scale(0.9);
      transition: all 150ms ease-in-out;

      :not(.active) &
        transition: none;

  .cursor .controls
    .selected &
      opacity: 1;

    .note
      background-color: rgba(0, 0, 0, 0.1);
      cursor: pointer;
      position: relative;

      &:hover
        background-color: rgba(0, 0, 0, 0.3);
        top: - button-shadow-size;
        box-shadow: 0 button-shadow-size 1px 0 rgba(0, 0, 0, 0.1);

      &.on
        background-color: rgba(0, 0, 0, 1);
        color: rgba(255, 255, 255, 0.5);
        transform: scale(1);

        &:hover
          box-shadow: 0 button-shadow-size 1px 0 rgba(255, 255, 255, 0.3);

        &:after
          posit(absolute, x, x, x, 25%)
          content: '';
          background-color: rgba(255, 255, 255, 0.5);
          font-size: 10px;
          line-height: 10px;
          text-align: center;
          width: 50%;

  .fx.note
    opacity: 0;
    position: relative;

    &:before, &:after
      border-radius: 50%;
      content: '';
      position: absolute;

  .standby .live.note, .playback .active .note, .victory .active .note
    &.actual
      animation: actual 250ms;

    &.fx
      &.kick
        animation: kick 250ms;

      &.snare
        animation: snare 250ms;

        &:before, &:after
          star-background();

      &:before
        box-shadow: 0 0 15px 3px alpha-blue-dark;
        left: 7%;
        top: @left;
        bottom: @left;
        right: @left;

      &:after
        box-shadow: 0 0 20px 4px alpha-blue-dark;
        left: 15%;
        top: @left;
        bottom: @left;
        right: @left;

</style>
