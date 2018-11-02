<template lang="pug">
  .grid(:class="gridClass", @mouseleave="unselect()")
    .strip-container
      .strip(v-for="note in supportedNotes")
        .beat(v-for="(pulses, beat) in pulsesByBeat", :class="beatClass[beat]")
          .pulse(v-for="cursor in cursorsByBeat[beat]", :class="pulseClass[cursor]")
            .fx.note(v-if="noteByCursor[cursor] === note",
                :class="[live[cursor][note], note, noteName[pulses]]")
    .overlay
      .strip(v-for="note in supportedNotes")
        .beat(v-for="(pulses, beat) in pulsesByBeat", :class="beatClass[beat]")
          .pulse(v-for="cursor in cursorsByBeat[beat]", :class="pulseClass[cursor]")
            .actual.note(v-if="noteByCursor[cursor] === note",
                :class="[live[cursor][note], note, noteName[pulses]]")
    slot
    .overlay
      .strip(v-for="note in supportedNotes")
        .beat(v-for="(pulses, beat) in pulsesByBeat", :class="beatClass[beat]")
          .pulse(v-for="cursor in cursorsByBeat[beat]", :class="pulseClass[cursor]",
              @mouseenter="select(cursor)")
            .controls
              .note(@click="onNote(note, cursor)",
                  :class="[noteName[pulses], noteByCursor[cursor] === note && 'on']")
    .glass.overlay(v-if="scene === 'victory'")
</template>

<script>
  import { mapGetters } from 'vuex';

  import BeatTick from '~/common/core/beat-tick.model';
  import Note from '~/common/core/note.model';
  import Sound from '~/common/sound/sound';

  export default {
    props: {
      grid: {
        type: Object,
        default: () => ({ noteByKey: { q: 'kick' } })
      },
      scene: {
        type: String,
        default: null
      }
    },
    data() {
      return {
        activeBeatTick: null,
        liveNoteCursor: null,
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
        this.$store.dispatch('player/select', { cursor, surfaceId: this.surfaceId });
      },
      unselect() {
        this.$store.dispatch('player/unselect');
      },
      onNote(note, cursor) {
        Sound.resume();
        if (cursor !== undefined && this.noteByCursor[cursor] === note) {
          note = null;
        }
        this.$store.dispatch('player/set', {cursor, note,
          surfaceId: this.surfaceId
        });
        if (!this.playing && note) {
          this.liveNoteCursor = note + this.cursor;
          Note.from(note).play();
        }
      },
    },
    computed: {
      noteByKey() {
        return this.grid.noteByKey;
      },
      surfaceId() {
        return _.join(_.keys(this.noteByKey));
      },
      supportedNotes() {
        return _.values(this.noteByKey);
      },
      selected() {
        return this.keyMode || this.surfaceId === this.selectedId;
      },
      noteByCursor() {
        return this.playerData[this.surfaceId];
      },
      live() {
        return _.times(this.numPulses, cursor => {
          return _.mapValues(_.invert(this.noteByKey), (key, name) => {
            return this.liveNoteCursor === name + cursor ? 'live' : '';
          });
        });
      },
      gridClass() {
        return [this.scene, {
          standby: !this.scene && !this.active,
          playback: ! this.scene && this.active,
          selected: this.selected
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
        playerData: 'player/dataBySurfaceCursor',
        selectedId: 'player/selected',
        cursor: 'player/cursor',
        playerCursor: 'player/cursor'
      })
    },
    watch: {
      keyDown(key) {
        if (key === ' ' || key === 'Backspace') {
          this.$store.dispatch('player/unset', this.surfaceId);
        } else if (this.noteByKey[key]) {
          this.onNote(this.noteByKey[key]);
        }
      },
      keyUp(key) {
        if (this.noKeysHeld && this.noteByKey[key]) {
          this.$store.dispatch('player/move', 1);
        }
      },
      active(active) {
        if (active) {
          this.liveNoteCursor = null;
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
