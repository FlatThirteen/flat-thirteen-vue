<template lang="pug">
  .container
    .bouncing.ball(v-if="showBall", :style="ballStyle",
        :class="{active: active, calibrate: !paused}")
    .counter.ball(v-for="(left, i) in lefts", :style="{left}",
        :class="{active: !paused && showCounter && beat === i}")
      | {{ beat === i ? count : ''}}
</template>

<script>
  import { mapGetters } from 'vuex'

  import BeatTick from '~/common/core/beat-tick.model';
  import Tone from '~/common/tone';

  const inactiveLeft = '25%';

  export default {
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
    data: function() {
      return {
        ball: null,
        active: false,
        count: 0,
        beat: 0,
        nextBeat: 0,
        left: inactiveLeft,
        lefts: ['50%']
      };
    },
    mounted() {
      this.$bus.$on(BeatTick.EVENT, this.beatTickHandler);
    },
    destroyed() {
      this.$bus.$off(BeatTick.EVENT, this.beatTickHandler);
    },
    methods: {
      beatTickHandler({time, count, beat, nextBeat}) {
        this.count = count;
        this.beat = beat;
        this.nextBeat = nextBeat;
        Tone.Draw.schedule(() => {
          this.left = this.lefts[nextBeat];
          this.$forceUpdate();
        }, time);
      }
    },
    computed: {
      ballStyle() {
        return {
          left: this.left,
          animationDuration: this.duration + 'ms',
          animationDelay: '0',
          transitionDuration: .8 * this.duration + 'ms',
          transitionDelay: .1 * this.duration + 'ms'
        };
      },
      ...mapGetters({
        starting: 'transport/starting',
        paused: 'transport/paused',
        duration: 'transport/duration',
        numBeats: 'transport/numBeats'
      })
    },
    watch: {
      starting(starting) {
        if (starting) {
          this.active = true;
          this.lefts = _.times(this.numBeats, beat => {
            let index = 2 * beat + 1;
            return (50 / this.numBeats * index) + '%'
          });
          this.left = this.lefts[0];
          console.log(' lefts', this.lefts);
        }
      },
      paused(paused) {
        this.active = !paused;
        if (paused) {
          this.left = inactiveLeft;
        }
      }
    }
  }

</script>
<style scoped lang="stylus" type="text/stylus">

  .container
    user-select: none;

  .ball
    border-radius: 50%;
    height: 3vw;
    font-size: @height;
    font-weight: 800;
    line-height: @height;
    margin-left: -0.5 * @height;
    width: @height;
    position: absolute;

  .bouncing
    background-color: primary-blue;
    bottom: 150%;
    opacity: 0;
    transform-origin: bottom;
    transition: all cubic-bezier(0.81, 0.16, 0.38, 0.56);

    &.calibrate
      animation: bouncing ease-in infinite;

    &.active
      bottom: 0;
      opacity: 1;

  .counter
    border: solid 6px primary-blue;
    bottom: -4vw;
    color: primary-blue;
    opacity: 0;
    text-align: center;
    transition: all 100ms cubic-bezier(0.81, 0.16, 0.38, 0.56);

    &.active {
      bottom: 0;
      opacity: 1;
    }

  @keyframes bouncing
    0%, 100%
      transform: translateY(0.2vh) scale(0.8, 1.2);
    30%
      transform: translateY(-9vh) scale(0.9, 1.1);
    40%
      transform: translateY(-10vh) scale(1.1, 0.9);
    80%
      transform: translateY(0.1vh) scale(0.9, 1.1);
    90%
      transform: translateY(0.2vh) scale(1.2, 0.6);
</style>
