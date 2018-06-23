<template lang="pug">
  .grid(:class="gridClass")
    svg(:viewBox="viewBox", :style="svgStyle", @mouseleave="unselect()")
      defs
        filter(id="shadow", x="-10%", y="-10%", width="120%", height="120%")
          feOffset(result="offOut", in="SourceGraphic", dx="1", dy="5")
          feComponentTransfer(result="colorOut", in="offOut")
            feFuncA(type="table", tableValues="0 0.6")
          feGaussianBlur(result="blurOut", in="colorOut", stdDeviation="5")
          feComposite(in="SourceGraphic", in2="blurOut", operator="over")
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
                @mouseenter="select(cursor)")
            line.pulse-line(v-if="i !== 0", y1="2", :y2="beatUnit - pulseBorder",
                :stroke-width="pulseBorder", :stroke-dasharray="pulseBorder + 1")
        line.measure-top(v-for="beats in measureTops", :stroke-width="pulseBorder",
            :x1="beats * beatUnit - pulseBorder", :x2="beats * beatUnit - pulseBorder",
            :y1="0.3 * beatSize", :y2="0.7 * beatSize")
      g(v-for="(key, index) in keys",
          :transform="'translate(0,' + index * beatUnit + ')'")
        g(v-for="(pulses, beat) in pulsesByBeat",
            :transform="'translate(' + beat * beatUnit + ',0)'")
          circle.note(v-for="(cursor, i) in cursorsByBeat[beat]",
              :class="noteClass[cursor][key]",
              :cy="beatCenter", :cx="((2 * i) + 1) * beatSize / 2 / pulses",
              :r="beatSize / 2 / pulses - 4 * beatBorder / pulses",
              :transform-origin="((2 * i) + 1) * beatSize / 2 / pulses + ' ' + beatCenter",
              @mouseenter="select(cursor)", @click="onNote(key, cursor)")
      rect#glass(:height="backgroundHeight", width="0")
    slot

</template>

<script>
  import { TweenMax, Linear } from 'gsap'
  import { mapGetters } from 'vuex';

  import BeatTick from '~/common/core/beat-tick.model';
  import Sound from '~/common/sound/sound';
  import Tone from '~/common/tone';

  export default {
    props: {
      grid: {
        type: Object,
        default: () => ({ soundByKey: { q: 'kick' } })
      },
      scene: {
        type: String,
        default: null
      },
      showPosition: {
        type: Boolean,
        default: false
      }
    },
    data: function() {
      return {
        activeCursor: null,
        liveKeyCursor: null
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
        this.$store.commit('keyMode');
        this.$store.commit('player/select', { cursor, soundId: this.soundId });
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
          soundId: this.soundId
        });
        if (!this.active && soundName) {
          this.liveKeyCursor = key + this.cursor;
          Sound[soundName].play();
        } else {
          this.liveKeyCursor = null;
        }
      },
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
      gridClass() {
        return [this.scene, {
          standby: !this.scene && !this.active,
          playback: !this.scene && this.active,
          selected: this.isSelected
        }];
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
        return _.times(this.numPulses, cursor => {
          return _.mapValues(this.soundName, (soundName, key) => ({
            active: this.activeCursor === cursor,
            cursor: this.scene !== 'victory' && this.cursor === cursor,
            live: this.liveKeyCursor === key + cursor,
            on: this.isOn[cursor][key],
            hover: this.scene !== 'victory' && this.keyMode && this.cursor === cursor
          }));
        });
      },
      ...mapGetters({
        keyDown: 'keyDown',
        keyUp: 'keyUp',
        keyMode: 'keyMode',
        noKeysHeld: 'noKeysHeld',
        active: 'transport/active',
        numBeats: 'transport/numBeats',
        beatsPerMeasure: 'transport/beatsPerMeasure',
        duration: 'transport/duration',
        pulsesByBeat: 'player/pulsesByBeat',
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
        if (this.scene === 'victory' ||
            this.scene === 'playback' && this.activeCursor >= this.cursor) {
          // Don't allow modifications to notes
          return;
        }
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
      }
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  @import "~assets/stylus/note.styl"

  button-shadow-size = 4px;

  .grid
    margin: 5px auto;
    position: relative;


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

  .note
    cursor: pointer;
    opacity: 0;
    transition: opacity 200ms ease;

    .goal &.on
      opacity: 0.3;

    .standby &.live, .playback &.active.on, .victory &.active.on
      animation: actual 250ms;

    .selected &.cursor:not(.on)
      opacity: 0.1;

      &:hover
        opacity: 0.3;
        box-shadow: 0 button-shadow-size 1px 0 rgba(0, 0, 0, 0.1);

    &.on
      opacity: 1;

      &:hover, &.hover
        opacity: 0.9;
        filter: url(#shadow);


</style>
