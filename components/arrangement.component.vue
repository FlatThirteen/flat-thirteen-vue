<template lang="pug">
  .arrangement-container(v-show="show")
    .arrangement
      .phrase(v-for="(phrase, i) in phrases")
        .key(:class="{active: position === i}") {{ phrase.phraseKey }}
    .position(v-if="phrases && phrases.length") {{ position + playing }} / {{ phrases.length }}
    transport(ref="transport", v-bind="transportProps")
</template>

<script>
  import { mapActions, mapGetters } from 'vuex';

  import AnimatedMixin from '~/mixins/animated.mixin';

  import BeatTick from '~/common/core/beat-tick.model';

  import Transport from '~/components/stage/transport.component';

  export default {
    mixins: [AnimatedMixin],
    components: {
      'transport': Transport
    },
    props: {
      phrases: Array,
      tempo: Number,
      show: Boolean,
      count: Boolean,
      play: String
    },
    data() {
      return {
        position: -1
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
          this.position = this.count ? -1 : 0;
        } else {
          this.position = this.position + 1;
        }
        if (this.position >= this.phrases.length) {
          this.stop();
        } else {
          this.$emit('position', this.position);
        }
      },
      beatTickHandler({time, beatTick}) {
        let phrase = this.phrases[this.position];
        if (phrase) {
          phrase.onBeatTick(beatTick, time);
          if (this.play) {
            _.forEach(this.getNotes(this.play, beatTick), note => {
              note.play(time);
            });
          }
        }
      },
      ...mapActions({
        start: 'transport/start',
        stop: 'transport/stop'
      })
    },
    computed: {
      transportProps() {
        return {
          beatsPerMeasure: this.beatsPerMeasure,
          tempo: this.tempo,
          metronome: this.position < 0
        };
      },
      ...mapGetters({
        beatsPerMeasure: 'player/beatsPerMeasure',
        getNotes: 'phrase/getNotes',
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
