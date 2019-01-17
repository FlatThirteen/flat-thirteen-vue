<template lang="pug">
  .stage-ball-container(:style="containerStyle")
    bouncing-ball(ref="bouncingBall")
    .counter(v-for="(left, i) in lefts", :style="{left}",
        :class="{active: playing && showCounter && beat === i}") {{ counts[i] }}
</template>

<script>
  import { mapGetters } from 'vuex';

  import BeatTick from '~/common/core/beat-tick.model';
  import Tone from '~/common/tone';

  import BouncingBall from '~/components/widget/bouncing-ball.component';

  export default {
    components: {
      'bouncing-ball': BouncingBall
    },
    props: {
      showBall: {
        type: Boolean,
        default: true
      },
      showCounter: {
        type: Boolean,
        default: false
      }
    },
    data() {
      return {
        beat: 0,
        nextBeat: 0
      };
    },
    mounted() {
      this.$bus.$on(BeatTick.BEAT, this.beatHandler);
    },
    destroyed() {
      this.$bus.$off(BeatTick.BEAT, this.beatHandler);
    },
    methods: {
      beatHandler({time, beat, nextBeat}) {
        this.beat = beat;
        this.nextBeat = nextBeat;
        Tone.Draw.schedule(() => {
          // Make sure still active and not destroyed
          if (this.showBall && this.$refs.bouncingBall) {
            this.$refs.bouncingBall.to(this.lefts[nextBeat]);
          }
        }, time);
      }
    },
    computed: {
      containerStyle() {
        return { 'max-width': (20 * this.numBeats) + 'vh' };
      },
      lefts() {
        return _.times(this.numBeats, beat => {
          return ((100 * beat + 50) / this.numBeats) + '%'
        });
      },
      ...mapGetters({
        playing: 'transport/playing',
        active: 'transport/active',
        counts: 'transport/counts',
        numBeats: 'player/numBeats'
      })
    },
    watch: {
      active(active) {
        this.$refs.bouncingBall.to(active && this.showBall && this.lefts[0], true);
        this.nextBeat = 0;
      },
      showBall(showBall) {
        this.$refs.bouncingBall.to(showBall && this.active && this.lefts[this.nextBeat]);
      }
    }
  }

</script>
<style scoped lang="stylus" type="text/stylus">
  .stage-ball-container
    user-select: none;

  .counter
    position: absolute;
    border-radius: 50%;
    height: 5vmin;
    font-size: @height;
    font-weight: 800;
    line-height: @height;
    margin-left: calc(-2.5vmin - 6px);
    width: @height;
    border: solid 6px primary-blue;
    bottom: -6vmin;
    color: primary-blue;
    opacity: 0;
    text-align: center;
    transition: all 150ms cubic-bezier(0.81, 0.16, 0.38, 0.56);
    transform: scale(0.1, 1.2);

    &.active
      bottom: 1vmin;
      opacity: 1;
      transform: scale(1, 1);
</style>
