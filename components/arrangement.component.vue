<template lang="pug">
  .arrangement-container
    .arrangement
      .phrase(v-for="(phrase, i) in phrases")
        .key(:class="{active: position === i}") {{ phrase.phraseKey }}
    .position {{ position + playing }} / {{ phrases.length }}

    transport(ref="transport", v-bind="transportProps")
</template>

<script>
  import { mapActions, mapGetters } from 'vuex';

  import AnimatedMixin from '~/mixins/animated.mixin';

  import BeatTick from '~/common/core/beat-tick.model';
  import Tone from '~/common/tone';

  import Phrase from '~/components/phrase.component';
  import BouncingBall from '~/components/stage/bouncing-ball.component';
  import PlayButton from '~/components/stage/play-button.component';
  import Transport from '~/components/stage/transport.component';

  export default {
    mixins: [AnimatedMixin],
    components: {
      'phrase': Phrase,
      'bouncing-ball': BouncingBall,
      'play-button': PlayButton,
      'transport': Transport
    },
    props: {
      phrases: Array,
      tempo: Number
    },
    constants: {

    },
    data() {
      return {
        position: 0
      }
    },
    mounted() {
      this.$bus.$on(BeatTick.TOP, this.topHandler);
      this.$bus.$on(BeatTick.EVENT, this.beatTickHandler);
    },
    destroyed() {
      this.stop();
      this.$bus.$off(BeatTick.TOP, this.topHandler);
      this.$bus.$off(BeatTick.EVENT, this.beatTickHandler);
    },
    methods: {
      topHandler({first}) {
        if (first) {
          this.position = 0;
        } else {
          this.position = this.position + 1;
        }
        if (this.position >= this.phrases.length) {
          this.stop();
        }
      },
      beatTickHandler({time, beatTick}) {
        let phrase = this.phrases[this.position];
        phrase.onBeatTick(beatTick, time);
      },
      ...mapActions({
        start: 'transport/start',
        stop: 'transport/stop'
      })
    },
    computed: {
      bouncingBallProps() {
        return {
          showBall: this.lastBeat ? this.nextScene === 'goal' : this.scene === 'goal',
          showCounter: this.scene !== 'goal' && this.nextScene === 'goal'
        };
      },
      transportProps() {
        return {
          beatsPerMeasure: this.beatsPerMeasure,
          tempo: this.tempo,
          metronome: false
        };
      },
      ...mapGetters({
        beatsPerMeasure: 'player/beatsPerMeasure',
        playing: 'transport/playing'
      })
    },
    watch: {
      playing(playing) {
        if (!playing) {
          this.position = 0;
        }
      }
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  .arrangement-container
    text-align: center;

  .phrase, .key
    display: inline-block;
    font-size: 15px;

  .active.key
    font-size: 20px;

  .phrase:not(:last-child):after
    content: ',';
    background-color: transparent;
</style>
