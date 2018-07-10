<template lang="pug">
  .grid(:class="gridClass", @mouseleave="unselect()")
    .strip-container
      .strip(v-for="key in keys")
        .beat(v-for="(pulses, beat) in pulsesByBeat", :class="beatClass[beat]")
          .pulse(v-for="cursor in cursorsByBeat[beat]", :class="pulseClass[cursor]")
            .fx.note(v-if="isOn[cursor][key]",
                :class="[live[cursor][key], soundName[key], noteName[pulses]]")
    .overlay
      .strip(v-for="key in keys")
        .beat(v-for="(pulses, beat) in pulsesByBeat", :class="beatClass[beat]")
          .pulse(v-for="cursor in cursorsByBeat[beat]", :class="pulseClass[cursor]")
            .actual.note(v-if="isOn[cursor][key]",
                :class="[live[cursor][key], soundName[key], noteName[pulses]]")
    slot
    .overlay
      .strip(v-for="key in keys")
        .beat(v-for="(pulses, beat) in pulsesByBeat", :class="beatClass[beat]")
          .pulse(v-for="cursor in cursorsByBeat[beat]", :class="pulseClass[cursor]",
              @mouseenter="select(cursor)")
            .controls
              .note(@click="onNote(key, cursor)",
                  :class="[noteName[pulses], isOn[cursor][key] && 'on']")
    .glass.overlay(v-if="scene === 'victory'")
</template>

<script>
  import { mapGetters } from 'vuex';

  import BeatTick from '~/common/core/beat-tick.model';
  import Sound from '~/common/sound/sound';

  export default {
    props: {
      grid: {
        type: Object,
        default: () => ({ soundByKey: { q: 'kick' } })
      },
      scene: {
        type: String,
        default: null
      }
    },
    data: function() {
      return {
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
      beatTickHandler({beatTick}) {
        if (this.active && this.beatTicks.includes(beatTick)) {
          this.activeBeatTick = beatTick;
        }
      },
      select(cursor) {
        this.$store.dispatch('player/select', { cursor, soundId: this.soundId });
      },
      unselect() {
        this.$store.dispatch('player/unselect');
      },
      onNote(key, cursor) {
        Sound.resume();
        let soundName = (cursor === undefined || !this.isOn[cursor][key]) &&
            this.soundName[key];

        this.$store.dispatch('player/set', {cursor, soundName,
          soundId: this.soundId
        });
        if (!this.playing && soundName) {
          this.liveKeyCursor = key + this.cursor;
          Sound[soundName].play();
        }
      },
    },
    computed: {
      soundId() {
        return _.join(this.keys);
      },
      keys() {
        return _.keys(this.grid.soundByKey);
      },
      soundName() {
        return this.grid.soundByKey;
      },
      isSelected() {
        return this.keyMode || this.soundId === this.selected;
      },
      isOn() {
        return _.times(this.numPulses, cursor => {
          return _.mapValues(this.soundName, (soundName) => {
            return soundName === this.getDataFor({
              beatTick: this.beatTicks[cursor],
              soundId: this.soundId
            });
          });
        });
      },
      live() {
        return _.times(this.numPulses, cursor => {
          return _.mapValues(this.soundName, (soundName, key) => {
            return this.liveKeyCursor === key + cursor ? 'live' : '';
          });
        });
      },
      gridClass() {
        return [this.scene, {
          standby: !this.scene && !this.active,
          playback: ! this.scene && this.active,
          selected: this.isSelected
        }];
      },
      beatClass() {
        return _.map(this.counts, count => count === 1 ? 'first' : '');
      },
      pulseClass() {
        return _.times(this.numPulses, cursor => ({
          active: this.activeBeatTick === this.beatTicks[cursor],
          cursor: this.playerCursor === cursor
        }));
      },
      ...mapGetters({
        keyDown: 'keyDown',
        keyUp: 'keyUp',
        keyMode: 'keyMode',
        noKeysHeld: 'noKeysHeld',
        active: 'transport/active',
        playing: 'transport/playing',
        counts: 'transport/counts',
        pulsesByBeat: 'player/pulsesByBeat',
        numPulses: 'player/numPulses',
        cursorsByBeat: 'player/cursorsByBeat',
        beatTicks: 'player/beatTicks',
        getDataFor: 'player/getDataFor',
        selected: 'player/selected',
        cursor: 'player/cursor',
        playerCursor: 'player/cursor'
      })
    },
    watch: {
      keyDown(key) {
        if (key === ' ' || key === 'Backspace') {
          this.$store.dispatch('player/unset', this.soundId);
        } else if (this.soundName[key]) {
          this.onNote(key);
        }
      },
      keyUp(key) {
        if (this.noKeysHeld && this.soundName[key]) {
          this.$store.dispatch('player/move', 1);
        }
      },
      active(active) {
        if (active) {
          this.liveKeyCursor = null;
        } else {
          this.activeBeatTick = '';
        }
      }
    }
  }

</script>
<style scoped lang="stylus" type="text/stylus">
  @import "~assets/stylus/note.styl"

  button-shadow-size = 4px;

  .grid
    margin: 0 auto 5px;
    position: relative;
    user-select: none;
    width: 100%;
    max-width: 80vh;

  .overlay
    posit(absolute);
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

  .strip
    display: flex;
    margin: 0;
    width: 100%;

  .strip-container
    background-color: back-blue;

    .victory &
      background-color: back-green;

  .victory
    .strip-container .beat
      background-color: main-green;

  .strip-container .first.beat:not(:first-child):before
    posit(absolute, 0, 100%, 0, x)
    background-color: #FFF;
    content: '';
    height: 8vh;
    max-height: 8vw;
    margin: auto 4px;
    width: 2px;

  .beat
    align-items: center;
    display: inline-flex;
    flex: 1 1 0;
    height: 20vh;
    max-height: 20vw;
    margin: 5px;
    position: relative;
    text-align: center;
    transition: background-color 150ms ease-in-out;

    .strip-container &
      background-color: main-blue;

      & .active
        background-color: active-blue;

        .victory &
          background-color: active-green;

  .pulse
    display: inline-flex;
    flex: 1;
    height: 100%;
    position: relative;

    .strip-container &:not(:last-child)
      border-right: dotted 3px back-blue;

      .victory &
        border-right-color: back-green;

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
    transition: opacity 200ms ease;

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
