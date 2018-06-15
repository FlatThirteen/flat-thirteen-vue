<template lang="pug">
  .grid(:class="gridClass", @mouseleave="unselect()")
    svg(:viewBox="viewBox", :style="svgStyle")
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
    slot

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
      }
    },
    data: function() {
      return {
        activeBeatTick: null,
        liveKeyCursor: null
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
        if (!this.paused && this.beatTicks.includes(beatTick)) {
          this.activeBeatTick = beatTick;
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
        if (this.paused && soundName) {
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
        return {
          standby: !this.starting && this.paused,
          playback: this.starting || !this.paused,
          selected: this.isSelected,
          starting: this.starting
        };
      },
      measureTops() {
        let last = 0;
        return _.reduce(this.beatsPerMeasure, (result, beats) => {
          if (last) {
            result.push(last)
          }
          last += beats;
          return result;
        }, [])
      },
      pulseClass() {
        return _.times(this.numPulses, cursor => ({
          active: this.activeBeatTick === this.beatTicks[cursor]
        }));
      },
      noteClass() {
        return _.times(this.numPulses, cursor => {
          return _.mapValues(this.soundName, (soundName, key) => ({
            active: this.activeBeatTick === this.beatTicks[cursor],
            cursor: this.cursor === cursor,
            live: this.liveKeyCursor === key + cursor,
            on: this.isOn[cursor][key]
          }));
        });
      },
      ...mapGetters({
        keyDown: 'keyDown',
        keyUp: 'keyUp',
        keyMode: 'keyMode',
        noKeysHeld: 'noKeysHeld',
        starting: 'transport/starting',
        paused: 'transport/paused',
        numBeats: 'transport/numBeats',
        beatsPerMeasure: 'transport/beatsPerMeasure',
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
      paused(paused) {
        if (paused) {
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

  .grid
    margin: 5px auto;
    position: relative;

    &.victory
      background-color: back-green;

    svg
      overflow: visible;

  .beat
    transition: background-color 150ms ease-in-out;
    fill: main-blue;
    stroke: back-blue;

    & .active
      background-color: active-blue;

      .victory &
        background-color: active-green;

  .measure-top
    stroke: white;

  .pulse
    fill: active-blue;
    opacity: 0;

    &.active
      opacity: 1;

  .pulse-line
    stroke: back-blue;

  .note
    cursor: pointer;
    opacity: 0;

    .standby &.live, &.active
      animation: actual 250ms;

    .selected &.cursor:not(.on)
      opacity: 0.1;

      &:hover
        opacity: 0.3;
        box-shadow: 0 button-shadow-size 1px 0 rgba(0, 0, 0, 0.1);

    &.on
      opacity: 1;
</style>
