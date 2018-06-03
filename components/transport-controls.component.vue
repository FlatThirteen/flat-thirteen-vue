<template lang="pug">
  .controls
    transport(ref="transport", v-bind="transportProps")
    play-icon(@click.native="onPlay()")
      .counter(v-if="transport.playing") {{ transport.count }}
    slot
    .beats-input(v-if="showBeatsPerMeasureInput")
      input.beats(type="text", v-model="bpm", placeholder="# beats")
    .beats-input(:class="{dim: tempo !== transport.bpm(), invalid: !transport.isValidBpm(tempo)}")
      input(type="number", v-model.number="tempo", placeholder="tempo")
    .performance(:class="{invalid: !transport.isValidLatencyHint(latencyHint)," +
        "dim: transport.isValidLatencyHint(latencyHint) && latencyHint !== transport.latencyHint}")
      input(type="text", v-model="latencyHint", placeholder="latency hint",
      @focus="showSuggestions = true", @blur="hideSuggestions()")
      .suggestions(v-if="showSuggestions")
        .suggestion(@click="onLatencyHint('0.2')") 0.2
        .suggestion(@click="onLatencyHint('fastest')") fastest
        .suggestion(@click="onLatencyHint('interactive')") interactive
        .suggestion(@click="onLatencyHint('balanced')") balanced
        .suggestion(@click="onLatencyHint('playback')") playback
</template>

<script>
  import { mapGetters } from 'vuex'

  import Sound from '~/common/sound/sound';
  import PlayIcon from '~/components/play-icon.component';
  import Transport from '~/components/transport.component';

  export default {
    components: {
      'play-icon': PlayIcon,
      'transport': Transport
    },
    props: {
      playTime: {
        type: String,
        default: '+4n'
      },
      beatsPerMeasure: {
        type: String,
        default: '4,4'
      },
      metronome: {
        type: Boolean,
        default: false
      },
    },
    data: function() {
      return {
        transport: { bpm: () => 120, isValidBpm: _.stubTrue, isValidLatencyHint: _.stubTrue },
        bpm: this.beatsPerMeasure,
        tempo: 120,
        latencyHint: 'balanced',
        showSuggestions: false,
      }
    },
    mounted() {
      this.transport = this.$refs.transport;
      window.addEventListener('keydown', this.onKeyDown);
    },
    destroyed: function() {
      window.removeEventListener('keydown', this.onKeyDown);
    },

    methods: {
      onKeyDown(event) {
        if (event.key === 'Enter') {
          this.onPlay();
        }
      },
      onPlay() {
        Sound.resume().then(() => {
          this.$store.dispatch('transport/toggle', this.playTime);
        });
      },
      hideSuggestions() {
        // Need to do this after timeout so that suggestion click handler has a chance
        setTimeout(() => {
          this.showSuggestions = false;
        }, 200);
      },
      onLatencyHint(latencyHint) {
        this.latencyHint = latencyHint;
      },
    },
    computed: {
      transportProps() {
        this.$nextTick(function () {
          // Needed because vue doesn't watch Tone.Transport.bpm
          this.$forceUpdate();
        });
        let bpm = this.showBeatsPerMeasureInput ? this.bpm : this.beatsPerMeasure;
        return {
          beatsPerMeasure: _.map(_.split(_.trim(bpm, ':'), ','), Number),
          tempo: this.tempo || 0,
          latencyHint: this.latencyHint,
          metronome: this.metronome,
          show: true
        }
      },
      showBeatsPerMeasureInput() {
        return !_.startsWith(this.bpm, ':');
      }
    },
    watch: {

    }
  }

</script>

<style scoped lang="stylus" type="text/stylus">
  @import "~assets/stylus/button.styl"

  .controls
    padding: 10px;

  .play
    position: relative;

    .counter
      posit(absolute, 0, x, x);
      font-size: 40px;
      padding: 10px 5px;

  .beats-input, .performance
    margin: 10px 0;

    &.dim
      opacity: 0.5;

    &.invalid input
      color: primary-red;

    input
      background: transparent;
      border: none;
      font-size: 30px;
      margin: 0;
      text-align: center;
      width: 100%;

      &::placeholder {
        color: primary-red;
        font-size: 14px;
      }

      &[type="text"]
        margin-right: 14%;
        width: 86%;

      &:focus
        outline: none;

  .performance
    position: relative;

    input
      font-size: 14px;
      opacity: 0.3;

      &:hover, &:focus
        opacity: 1;

    .suggestions
      posit(absolute, x, x, x, 20%);
      border: solid darkgray 1px;
      padding: 1px 5px;

      .suggestion
        color: darkgray;
        cursor: pointer;

        &:hover
          color: black;

</style>