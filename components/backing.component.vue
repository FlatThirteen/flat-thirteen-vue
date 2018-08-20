<template lang="pug">
  .backing-container(v-if="show && !skip")
    .fx(v-for="note in notes", :key="note.id", :id="note.id", :class="note.fxClass")
      .tilt(:style="{transform: note.tiltTransform}")
        .scale(:style="{transform: note.scaleTransform}")
          transition(appear, :name="note.transitionName")
            .note(v-if="note.on", :class="note.noteClass")
              .shadow(:style="{height: note.shadowHeight}")
    .counts(v-if="showCounts", @click="resetCounts()")
      span {{ playCount }}
      span  {{ drawCount }}
      span.diff(v-if="playCount !== drawCount") ({{ drawCount - playCount }})
      span(:class="{diff: activeNotes < 0}")  {{ undrawCount }}{{ activeNotes | diff }}

</template>

<script>
  import { mapGetters } from 'vuex'

  import BeatTick from '~/common/core/beat-tick.model';
  import Note from '~/common/core/note.model';
  import Tone from '~/common/tone';

  export default {
    props: {
      fixed: {
        type: Array,
        default() { return []; }
      },
      show: {
        type: Boolean,
        default: true
      },
      skip: {
        type: Boolean,
        default: false
      },
      showCounts: {
        type: Boolean,
        default: false
      }
    },
    data() {
      return {
        notes: {},
        playCount: 0,
        drawCount: 0,
        undrawCount: 0,
        activeNotes: 0
      };
    },
    mounted() {
      this.$bus.$on(BeatTick.EVENT, this.beatTickHandler);
    },
    destroyed() {
      this.$bus.$off(BeatTick.EVENT, this.beatTickHandler);
    },
    filters: {
      diff(value) {
        return value < 0 ? value : '+' + value;
      }
    },
    methods: {
      resetCounts() {
        this.playCount = 0;
        this.drawCount = 0;
        this.undrawCount = 0;
        this.activeNotes = 0;
      },
      beatTickHandler({beatTick, time}) {
        let notes = this.getNotes('backing', beatTick);
        _.forEach(notes, (note) => {
          note.play(time);
          this.playCount++;
          if (!this.skip) {
            let id = beatTick + note.toString();
            Tone.Draw.schedule(() => {
              this._setBackingNote(note, id);
              this.drawCount++;
              this.activeNotes++;
              // Needed because vue doesn't know Tone.Draw.schedule
              this.$forceUpdate();
            }, time);
            Tone.Draw.schedule(() => {
              if (this.notes[id]) {
                this.notes[id].on = false;
              }
              this.undrawCount++;
              this.activeNotes--;
              this.$forceUpdate();
            }, time + note.duration);
          }
        });
      },
      _setBackingNote(note, id) {
        if (!this.notes[id]) {
          this.notes[id] = {id};
        }
        let backingNote = this.notes[id];
        let frequency = note.frequency;
        backingNote.on = true;
        backingNote.fxClass = note.soundName + (frequency ?
            ' rotate' + (frequency.toMidi() % 12) :
            ' rotate' + _.random(11) + ' offset' + _.random(24));
        backingNote.tiltTransform = frequency ? 'rotateX(40deg)' : 'rotateX(10deg)';
        backingNote.scaleTransform = !frequency ? '' : 'scale(' +
            (-.009375 * frequency.toMidi() + 1.225) + ',' +
            (frequency.toMidi() / -160 + 1.15) + ')';
        backingNote.transitionName = note.soundName === 'cowbell' ? 'cowbell' :
            frequency ? 'pitched' : 'unpitched';
        backingNote.noteClass = [backingNote.transitionName];
        if (note.soundName === 'cowbell') {
          backingNote.noteClass.push('delay' + _.random(4));
        } else if (note.soundName === 'snare') {
          backingNote.noteClass.push('before' + _.random(11));
          backingNote.noteClass.push('after' + _.random(11));
        }
        backingNote.shadowHeight = backingNote.transitionName !== 'pitched' ? '0' :
            (frequency.toMidi() * -1.875 + 245) + '%';
      }
    },
    computed: {
      ...mapGetters({
        starting: 'transport/starting',
        paused: 'transport/paused',
        getNotes: 'phrase/getNotes'
      })
    },
    watch: {
      starting(starting) {
        if (starting) {
          this.resetCounts();
        }
      },
      fixed(fixed, oldFixed) {
        _.forEach(oldFixed, (noteId) => {
          if (this.notes[noteId]) {
            this.notes[noteId].on = false;
          }
        });
        _.forEach(fixed, (noteId) => {
          let note = Note.from(noteId);
          if (this.paused) {
            note.play('+0.1');
          }
          this._setBackingNote(note, noteId);
        });
        this.$forceUpdate();
      }
    }
  }

</script>
<style scoped lang="stylus" type="text/stylus">
  @import "~assets/stylus/note.styl"

  .backing-container
    posit(fixed);
    overflow: hidden;
    user-select: none;
    perspective: 800px;

  .counts
    posit(absolute, 50px, 2px, x, x);
    background-color: faint-grey;
    color: lightgray;
    padding: 5px;

    .diff
      color: primary-red;

  .fx, .tilt, .scale
    posit(absolute, 0);

  .tilt
    transform-origin: bottom;

  .scale
    display: flex;
    flex-flow: column-reverse nowrap;
    align-items: center;
    transform-origin: top;

  .note
    position: relative;

    &:before, &:after
      posit(absolute, 0, x);

    .shadow
      position: absolute;
      width: 100%;

  .fx
    &.snare, &.kick
      .note
        border-radius: 50%;
        height: 99vh;
        width: 99vh;

        &:before, &:after
          border-radius: 50%;
          content: '';

        &:before
          left: 7%;
          top: @left;
          bottom: @left;
          right: @left;

        &:after
          left: 15%;
          top: @left;
          bottom: @left;
          right: @left;

    &.kick .note
      background: radial-gradient(ellipse at center, alpha(primary-blue, 0.4) 0%, alpha(primary-blue, 0.1) 40%, transparent 80%);
      box-shadow: 0 0 20px 4px alpha(gray, 0.1);

      &:before
        box-shadow: 0 0 15px 3px alpha(gray, 0.2);

      &:after
        box-shadow: 0 0 20px 4px alpha(gray, 0.3);

    &.snare .note
      background: radial-gradient(ellipse at center, alpha(gray, 0.5) 0%, alpha(gray, 0.2) 30%, transparent 70%);

      &:before
        star-background(3);
        box-shadow: 0 0 20px 4px alpha(gray, 0.1);

      &:after
        star-background(5);
        box-shadow: 0 0 15px 3px alpha(gray, 0.2);

    &.synth .note
      transform-origin: top;
      height: 10vh;
      width: 300%;

      &:after
        content: '';
        animation-name: synth;
        animation-duration: 250ms;
        animation-timing-function: linear;
        animation-iteration-count: infinite;
        background-color: primary-green;
        background: linear-gradient(-15deg, transparent 65px, alpha(primary-green, 0.5) 75px) repeat-x;
        background-size: 25vh 10vh;
        width: 100%;

      .shadow
        background: linear-gradient(transparent, alpha(primary-green, 0.5));
        bottom: 100%;

    &.cowbell .note
      transform-origin: top;
      height: 20vh;
      width: 20vh;

      &:after
        content: '';
        animation-name: cowbell;
        animation-duration: 250ms;
        animation-timing-function: linear;
        animation-iteration-count: infinite;
        background-color: primary-red;
        clip-path: polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%);
        width: 100%;


  .rotate1, .before1:before, .after1:after
    transform: rotate(-30deg);
  .rotate2, .before2:before, .after2:after
    transform: rotate(-60deg);
  .rotate3, .before3:before, .after3:after
    transform: rotate(-90deg);
  .rotate4, .before4:before, .after4:after
    transform: rotate(-120deg);
  .rotate5, .before5:before, .after5:after
    transform: rotate(-150deg);
  .rotate6, .before6:before, .after6:after
    transform: rotate(-180deg);
  .rotate7, .before7:before, .after7:after
    transform: rotate(-210deg);
  .rotate8, .before8:before, .after8:after
    transform: rotate(-240deg);
  .rotate9, .before9:before, .after9:after
    transform: rotate(-270deg);
  .rotate10, .before10:before, .after10:after
    transform: rotate(-300deg);
  .rotate11, .before11:before, .after11:after
    transform: rotate(-330deg);

  .offset1, .offset2, .offset3, .offset14, .offset24
    margin-top: 25px;
  .offset1, .offset7, .offset8, .offset10, .offset20
    margin-left: 25px;
  .offset3, .offset4, .offset5, .offset12, .offset18
    margin-right: 25px;
  .offset5, .offset6, .offset7, .offset16, .offset22
    margin-bottom: 25px;
  .offset9, .offset10, .offset11, .offset12, .offset13
    margin-top: 50px;
  .offset13, .offset14, .offset15, .offset16, .offset17
    margin-right: 50px;
  .offset17, .offset18, .offset19, .offset20, .offset21
    margin-bottom: 50px;
  .offset9, .offset21, .offset22, .offset23, .offset24
    margin-left: 50px;

  .note.delay1
    animation-delay: -50ms;
  .note.delay2
    animation-delay: -100ms;
  .note.delay3
    animation-delay: -150ms;
  .note.delay4
    animation-delay: -200ms;

  @keyframes synth
    0%
      transform: translateX(0);
    100%
      transform: translateX(-25vh);

  @keyframes cowbell
    0%,100%
      transform: rotate(0);
    33%
      transform: rotate(10deg);
    66%
      transform: rotate(-10deg);

  .pitched-enter-active
    transition: all 100ms;

  .pitched-enter
    transform: translateX(-100%);
    opacity: 0;

  .pitched-enter-to, .pitched-leave
    transform: translate(0, 0) scale(1);
    opacity: 1;

  .pitched-leave-active
    transition: all 140ms;

  .pitched-leave-to
    transform: translateY(20vh) scale(3, 1.5);
    opacity: 0;

  .unpitched-enter-active, .unpitched-leave-active
    transition: all 250ms;

  .unpitched-enter, .unpitched-leave
    transform: scale(1);
    opacity: 1 !important;

  .unpitched-enter-to
    transform: scale(2.5);
    opacity: 0.3 !important;

  .unpitched-leave-to
    transform: scale(2.5);
    opacity: 0;

  .cowbell-leave-active
    transition: all 140ms;

  .cowbell-leave
    transform: scale(1);
    opacity: 0.5;

  .cowbell-leave-to
    transform: scale(3);
    opacity: 0.1;
</style>
