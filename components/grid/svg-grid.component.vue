<template lang="pug">
  .grid(:class="gridClass")
    svg(:viewBox="viewBox", :style="svgStyle", @mouseleave="unselect()")
      defs
        filter(id="shadow", x="-40%", y="-40%", width="180%", height="180%")
          feOffset(result="offOut", in="SourceGraphic", dx="1", dy="5")
          feComponentTransfer(result="colorOut", in="offOut")
            feFuncA(type="table", tableValues="0 0.6")
          feGaussianBlur(result="blurOut", in="colorOut", stdDeviation="5")
          feComposite(in="SourceGraphic", in2="blurOut", operator="over")
        radialGradient(id="kick")
          stop(stop-color="rgba(255,255,255,0.4)", offset="41%")
          stop(stop-color="rgba(55,55,55,0.2)", offset="43%")
          stop(stop-color="rgba(255,255,255,0.3)", offset="50%")
          stop(stop-color="rgba(255,255,255,0.1)", offset="54%")
          stop(stop-color="rgba(55,55,55,0.2)", offset="55%")
          stop(stop-color="rgba(255,255,255,0.1)", offset="75%")
          stop(stop-color="rgba(255,255,255,0)", offset="100%")
        radialGradient(id="snareFill")
          stop(stop-color="rgba(255,255,255,1)", offset="40%")
          stop(stop-color="rgba(155,155,155,0.3)", offset="42%")
          stop(stop-color="rgba(255,255,255,0.9)", offset="50%")
          stop(stop-color="rgba(255,255,255,0.3)", offset="54%")
          stop(stop-color="rgba(55,55,55,0.3)", offset="55%")
          stop(stop-color="rgba(255,255,255,0.4)", offset="75%")
          stop(stop-color="rgba(255,255,255,0)", offset="100%")
        filter(id="snareFilter")
          feTurbulence(type="turbulence", baseFrequency="0.2", numOctaves="3", result="turb")
          feComponentTransfer(result="noise")
            feFuncA(type="discrete", tableValues="0 1 0 .5")
          feComposite(in="SourceGraphic", in2="noise", operator="in")
          feGaussianBlur(stdDeviation="1.5")
      rect#background(:height="backgroundHeight", :width="backgroundWidth")
      rect#position(:height="backgroundHeight", width="0")
      g(v-for="(key, index) in keys",
          :transform="'translate(0,' + index * beatUnit + ')'")
        g(v-for="(pulses, beat) in pulsesByBeat",
            :transform="'translate(' + beat * beatUnit + ',0)'")
          rect.beat(:width="beatSize", :height="beatSize",
              :stroke-width="beatBorder + 1")
          g(v-for="(cursor, i) in cursorsByBeat[beat]",
              :transform="'translate(' + i * beatSize / pulses + ',0)'")
            rect.pulse(:class="pulseClass[cursor]", :x="pulseBorder", :y="pulseBorder",
                :width="beatSize / pulses - beatBorder", :height="beatSize - beatBorder",
                @mouseenter="select(cursor)", @mouseleave="unselect()")
            line.pulse-line(v-if="i !== 0", y1="2", :y2="beatUnit - pulseBorder",
                :stroke-width="pulseBorder", :stroke-dasharray="pulseBorder + 1")
        line.measure-top(v-for="beats in measureTops", :stroke-width="pulseBorder",
            :x1="beats * beatUnit - pulseBorder", :x2="beats * beatUnit - pulseBorder",
            :y1="0.3 * beatSize", :y2="0.7 * beatSize")
      g(v-for="(key, index) in keys", v-if="!blink",
          :transform="'translate(0,' + index * beatUnit + ')'")
        g(v-for="(pulses, beat) in pulsesByBeat",
            :transform="'translate(' + beat * beatUnit + ',0)'")
          circle.fx(v-for="(cursor, i) in cursorsByBeat[beat]", ref="fx",
              :class="soundByKey[key]",
              :cy="beatCenter", :cx="((2 * i) + 1) * beatSize / 2 / pulses",
              :r="beatSize / 2 / pulses - 4 * beatBorder / pulses",
              :transform-origin="((2 * i) + 1) * beatSize / 2 / pulses + ' ' + beatCenter",)
          circle.note(v-for="(cursor, i) in cursorsByBeat[beat]", ref="note",
              :class="noteClass[cursor][key]",
              :cy="beatCenter", :cx="((2 * i) + 1) * beatSize / 2 / pulses",
              :r="beatSize / 2 / pulses - 4 * beatBorder / pulses",
              :transform-origin="((2 * i) + 1) * beatSize / 2 / pulses + ' ' + beatCenter",
              @mouseenter="select(cursor)", @click="onNote(key, cursor)")
      rect#glass(:height="backgroundHeight", width="0")
    slot

</template>

<script>
  import AnimatedMixin from '~/mixins/animated.mixin';
  import { TweenMax, Linear } from 'gsap'
  import { mapGetters } from 'vuex';

  import BeatTick from '~/common/core/beat-tick.model';
  import Note from '~/common/core/note.model';
  import Sound from '~/common/sound/sound';
  import Tone from '~/common/tone';

  export default {
    mixins: [AnimatedMixin],
    props: {
      grid: {
        type: Object,
        default: () => ({ soundByKey: { q: 'kick' } })
      },
      scene: String,
      showPosition: Boolean,
      showFx: Array,
      weenie: Boolean,
      disable: Boolean
    },
    constants: {
      animationDefinitions: {
        note: [[0, {
          transform: 'scale(1)'
        }], [.4, {
          transform: 'scale(1.1)'
        }], [.3, {
          transform: 'scale(0.9)'
        }], [.3, {
          transform: 'scale(1)'
        }]]
      }
    },
    data() {
      return {
        activeCursor: null,
        blink: false
      };
    },
    mounted() {
      this.$bus.$on(BeatTick.EVENT, this.beatTickHandler);
      this.$bus.$on(BeatTick.BEAT, this.beatHandler);
    },
    destroyed() {
      this.$bus.$off(BeatTick.EVENT, this.beatTickHandler);
      this.$bus.$off(BeatTick.BEAT, this.beatHandler);
    },
    methods: {
      beatTickHandler({beatTick}) {
        let cursor = _.indexOf(this.beatTicks, beatTick);
        if (this.active && cursor !== -1) {
          this.activeCursor = cursor;
          this.$nextTick(() => {
            // Need nextTick to give scene a change to update after top
            if (!this.scene || this.scene === 'playback' || this.scene === 'victory') {
              _.forEach(this.isOn[cursor], (on, key) => {
                if (on) {
                  this.animateNoteAt(cursor, key);
                }
              });
            }
            _.forEach(this.showFx, note => {
              this.animateNoteAt(cursor, this.keyByNote[note.toString()]);
            });
          });
        }
      },
      beatHandler({beat}) {
        if (this.showPosition) {
          TweenMax.fromTo('#position', this.duration, {
            opacity: .7,
            width: beat * this.beatUnit
          }, {
            width: (beat + 1) * this.beatUnit - this.pulseBorder,
            ease: Linear.easeNone
          });
          if (this.scene) {
            TweenMax.fromTo('#glass', .2 * this.duration, {
              width: beat * this.beatUnit
            }, {
              width: (beat + 1) * this.beatUnit - this.pulseBorder,
              ease: Linear.easeNone
            });
          }
        }
      },
      select(cursor) {
        if (!this.disable) {
          this.$store.dispatch('player/select', { cursor, soundId: this.soundId });
        }
      },
      unselect() {
        this.$store.dispatch('player/unselect');
      },
      onNote(key, cursor) {
        if (this.disable) {
          return;
        }
        Sound.resume();
        let soundName = (cursor === undefined || !this.isOn[cursor][key]) &&
          this.soundByKey[key];

        this.$store.dispatch('player/set', {cursor, soundName,
          soundId: this.soundId
        });
        if (!this.playing && soundName) {
          this.animateNoteAt(this.cursor, key);
          Sound[soundName].play();
        }
      },
      animateNoteAt(cursor, key) {
        let refIndex = this.refIndex[cursor][key];
        this.animate('note', { element: this.$refs.note[refIndex] });
        let fx = this.$refs.fx[refIndex];
        new TimelineMax().
            to(fx, .2, { opacity: 0, transform: 'scale(1)'}).
            to(fx, .2, { opacity: 1, transform: 'scale(2)'}).
            to(fx, .5, { opacity: .7, transform: this.transformByCursor[cursor] }).
            to(fx, .1, { opacity: 0, transform: 'scale(1)'}).
            duration(.25).play(0);
      }
    },
    computed: {
      svgStyle() {
        return {
          'max-height': this.keys.length * 20 + 'vh'
        }
      },
      beatUnit() {
        return 200;
      },
      beatBorder() {
        return 5;
      },
      beatSize() {
        return this.beatUnit - this.beatBorder;
      },
      beatCenter() {
        return this.beatUnit / 2;
      },
      pulseBorder() {
        return this.beatBorder / 2;
      },
      height() {
        return this.beatUnit * this.keys.length;
      },
      width() {
        return this.beatUnit * this.numBeats;
      },
      backgroundHeight() {
        return this.height && this.height - this.beatBorder;
      },
      backgroundWidth() {
        return this.width && this.width - this.beatBorder;
      },
      viewBox() {
        return '0 0 ' + this.width + ' ' + this.height;
      },
      soundId() {
        return _.join(this.keys);
      },
      keys() {
        return _.keys(this.grid.soundByKey);
      },
      keyIndex() {
        return _.invert(this.keys);
      },
      keyByNote() {
        return _.invert(_.mapValues(this.soundByKey, (soundName) => Note.toString(soundName)));
      },
      soundByKey() {
        return this.grid.soundByKey;
      },
      isSelected() {
        return this.keyMode || this.soundId === this.selected;
      },
      refIndex() {
        return _.times(this.numPulses, cursor => {
          return _.mapValues(this.soundByKey, (soundName, key) => {
            return this.keyIndex[key] * this.numPulses + cursor;
          });
        });
      },
      isOn() {
        return _.times(this.numPulses, cursor => {
          return _.mapValues(this.soundByKey, (soundName) => {
            return soundName === this.getDataFor({
              beatTick: this.beatTicks[cursor],
              soundId: this.soundId
            });
          });
        });
      },
      gridClass() {
        return [this.scene, {
          disable: this.disable,
          selected: this.isSelected
        }];
      },
      transformByCursor() {
        return _.reduce(this.pulsesByBeat, (result, pulses) => {
          return _.concat(result, _.times(pulses,
              _.constant([, 'scale(3)', 'scale(3.5)', 'scale(3.75)', 'scale(4)'][pulses])));
        }, []);
      },
      measureTops() {
        let last = 0;
        return _.reduce(this.beatsPerMeasure, (result, beats) => {
          if (last) {
            result.push(last)
          }
          last += beats;
          return result;
        }, []);
      },
      pulseClass() {
        return _.times(this.numPulses, cursor => ({
          active: !this.showPosition && this.activeCursor === cursor
        }));
      },
      noteClass() {
        return _.times(this.numPulses, cursor =>
          _.mapValues(this.soundByKey, (soundName, key) => (!this.disable && {
            cursor: this.scene !== 'victory' && this.cursor === cursor,
            hover: this.scene !== 'victory' && this.cursor === cursor && this.keyMode,
            on: this.isOn[cursor][key],
            weenie: this.weenie && !this.active && !this.isSelected && !this.isOn[cursor][key]
          })));
      },
      ...mapGetters({
        keyDown: 'keyDown',
        keyUp: 'keyUp',
        keyMode: 'keyMode',
        noKeysHeld: 'noKeysHeld',
        starting: 'transport/starting',
        active: 'transport/active',
        playing: 'transport/playing',
        duration: 'transport/duration',
        beatsPerMeasure: 'player/beatsPerMeasure',
        pulsesByBeat: 'player/pulsesByBeat',
        numBeats: 'player/numBeats',
        numPulses: 'player/numPulses',
        cursorsByBeat: 'player/cursorsByBeat',
        beatTicks: 'player/beatTicks',
        getDataFor: 'player/getDataFor',
        selected: 'player/selected',
        cursor: 'player/cursor'
      })
    },
    watch: {
      keyDown(key) {
        if (this.disable || this.scene === 'victory' ||
            this.scene === 'playback' && this.activeCursor >= this.cursor) {
          // Don't allow modifications to notes
          return;
        }
        if (key === ' ' || key === 'Backspace') {
          this.$store.dispatch('player/unset', this.soundId);
        } else if (this.soundByKey[key]) {
          this.onNote(key);
        }
      },
      keyUp(key) {
        if (!this.disable && this.noKeysHeld && this.soundByKey[key]) {
          this.$store.dispatch('player/move', 1);
        }
      },
      playing(playing) {
        if (!playing) {
          this.activeCursor = -1;
          TweenMax.to('#position', this.duration, {
            opacity: 0
          });
        }
      },
      showPosition(showPosition) {
        if (showPosition) {
          TweenMax.to('#position', this.duration, {
            opacity: .7,
          });
        } else  {
          TweenMax.to('#position', this.duration, {
            opacity: 0,
          });
          TweenMax.to('#position', 0, {
            width: 0,
            delay: this.duration
          });
        }
      },
      scene(scene) {
        if (scene !== 'playback') {
          TweenMax.to('#glass', 0, { width: 0 });
        }
        if (scene === 'victory') {
          TweenMax.to('#glass', 0, { width: this.width });
        }
      },
      numPulses() {
        // Blink out all notes and fx so that the refs are put back in the correct order.
        this.blink = true;
        this.$nextTick(() => {
          this.blink = false;
        });
      }
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  button-shadow-size = 4px;

  .grid
    margin: 0 auto;
    position: relative;
    padding-left: 4px;

    &.disable
      opacity: 0.6;

    svg
      overflow: visible;

  #background
    fill: main-blue;

    .victory &
      fill: main-green;

  #position
    fill: primary-green;
    opacity: 0;

  #glass
    fill: transparent;

  .beat
    transition: background-color 150ms ease-in-out;
    fill: transparent;
    stroke: back-blue;

    .victory &
      stroke: back-green;

  .measure-top
    stroke: white;

  .pulse
    fill: white;
    opacity: 0;

    &.active
      opacity: 0.1;

  .pulse-line
    stroke: back-blue;

    .victory &
      stroke: back-green;

  .fx
    fill: transparent;
    opacity: 0;

    &.snare
      fill: url(#snareFill);
      filter: url(#snareFilter);

    &.kick
      fill: url(#kick);

  .note
    opacity: 0;
    transition: opacity 200ms ease;

    .grid:not(.disable) &
      cursor: pointer;

    .goal &.on
      opacity: 0.3;

    .selected &.cursor:not(.on)
      opacity: 0.1;

      &:hover
        opacity: 0.3;
        box-shadow: 0 button-shadow-size 1px 0 rgba(0, 0, 0, 0.1);

    &.weenie
      animation: weenie 2s infinite 500ms;

    &.on
      opacity: 1;

      &:hover, &.hover
        opacity: 0.9;
        filter: url(#shadow);

  @keyframes weenie
    0%, 100%
      opacity: 0;
    50%
      opacity: 0.05;
</style>
