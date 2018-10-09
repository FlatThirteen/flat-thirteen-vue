<template lang="pug">
  .container
    .bouncing.ball(ref="ball", :class="{active: showBall && active}")
    .counter.ball(v-for="(left, i) in lefts", :style="{left}",
        :class="{active: playing && showCounter && beat === i}") {{ counts[i] }}
</template>

<script>
  import { TimelineMax, TweenMax, Circ } from 'gsap'
  import { mapGetters } from 'vuex';

  import AnimatedMixin from '~/mixins/animated.mixin';

  import BeatTick from '~/common/core/beat-tick.model';
  import Tone from '~/common/tone';

  const inactiveLeft = '50%';
  const inactiveBottom = '50vh';

  export default {
    mixins: [AnimatedMixin],
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
    constants: {
      animationTarget: 'ball',
      animationDefinitions: {
        bounce: [[.1, {
          bottom: 0,
          transform: 'translateY(0.2vh) scale(1.2, 0.6)'
        }], [.2, {
          transform: 'translateY(0.2vh) scale(0.9, 1.2)'
        }], [.2, {
          transform: 'translateY(-7vh) scale(0.8, 1.1)'
        }], [.2, {
          transform: 'translateY(-10vh) scale(1, 0.9)'
        }], [.3, {
          transform: 'translateY(0.1vh) scale(0.8, 1.2)',
          ease: Circ.easeIn
        }]],
        enter: [[.2, {
          opacity: 1,
          bottom: inactiveBottom,
          transform: 'translateY(-5vh) scale(0.8, 1.2)'
        }], [.4, {
          bottom: 0,
          transform: 'translateY(0.1vh) scale(0.8, 1.2)',
        }], [.2, {
          transform: 'translateY(0.2vh) scale(1.2, 0.6)'
        }], [.2, {
          transform: 'translateY(0.2vh) scale(1, 1)'
        }]]
      },
    },
    data() {
      return {
        ballIn: false,
        beat: 0,
        nextBeat: 0,
        left: inactiveLeft,
        lefts: ['50%']
      };
    },
    mounted() {
      TweenMax.set(this.$refs.ball, { bottom: inactiveBottom });
      this.$bus.$on(BeatTick.BEAT, this.beatHandler);
    },
    destroyed() {
      TweenMax.killTweensOf(this.$refs.ball);
      this.$bus.$off(BeatTick.BEAT, this.beatHandler);
    },
    methods: {
      beatHandler({time, beat, nextBeat}) {
        this.beat = beat;
        this.nextBeat = nextBeat;
        if (this.showBall) {
          Tone.Draw.schedule(() => {
            if (this.ballIn && this.$refs.ball) {
              TweenMax.to(this.$refs.ball, .7 * this.duration, {
                left: this.lefts[nextBeat],
                delay: .3 * this.duration
              });
              this.animate('bounce', { duration: this.duration });
            }
          }, time);
        }
      },
      ballEnter(starting) {
        if (this.ballIn) {
          return;
        }
        this.ballIn = true;
        TweenMax.fromTo(this.$refs.ball, (starting ? 1 : .6) * this.duration, {
          left: inactiveLeft
        }, {
          left: this.lefts[this.nextBeat]
        });
        this.animate('enter', { duration: starting ? 1.8 * this.duration : this.duration });
      },
      ballExit() {
        if (this.ballIn) {
          this.ballIn = false;
          // Delay exit so that ball has a chance to bounce
          setTimeout(() => {
            TweenMax.killTweensOf(this.$refs.ball);
            TweenMax.fromTo(this.$refs.ball, .7 * this.duration, {
              transform: 'scale(.6, 1.2)'
            }, {
              bottom: inactiveBottom
            });
            TweenMax.to(this.$refs.ball, .5 * this.duration, {
             left: inactiveLeft,
             ease: Circ.easeInOut
           });
          }, 200 * this.duration);
        }
      }
    },
    computed: {
      ...mapGetters({
        playing: 'transport/playing',
        active: 'transport/active',
        counts: 'transport/counts',
        numBeats: 'player/numBeats'
      })
    },
    watch: {
      active(active) {
        if (active) {
          this.nextBeat = 0;
          this.lefts = _.times(this.numBeats, beat => {
            return ((100 * beat + 50) / this.numBeats) + '%'
          });
          if (this.showBall) {
            this.ballEnter(true);
          }
        } else {
          this.ballExit();
        }
      },
      showBall(showBall) {
        if (showBall && this.active) {
          this.ballEnter();
        } else {
          this.ballExit();
        }
      }
    }
  }

</script>
<style scoped lang="stylus" type="text/stylus">
  .container
    user-select: none;

  .ball
    position: absolute;
    border-radius: 50%;
    height: 5vh;
    font-size: @height;
    font-weight: 800;
    line-height: @height;
    margin-left: -0.5 * @height;
    width: @height;

  .bouncing
    background-color: primary-blue;
    transform-origin: bottom;
    opacity: 0;

  .counter
    border: solid 6px primary-blue;
    bottom: -6vh;
    color: primary-blue;
    opacity: 0;
    text-align: center;
    transition: all 150ms cubic-bezier(0.81, 0.16, 0.38, 0.56);
    transform: scale(0.1, 1.2);

    &.active
      bottom: 1vh;
      opacity: 1;
      transform: scale(1, 1);
</style>
