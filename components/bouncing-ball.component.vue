<template lang="pug">
  .container
    #bouncing.ball(:class="{active: showBall && active}")
    .counter.ball(v-for="(left, i) in lefts", :style="{left}",
        :class="{active: playing && showCounter && beat === i}") {{ counts[i] }}
</template>

<script>
  import { TimelineMax, TweenMax, Circ } from 'gsap'
  import { mapGetters } from 'vuex';

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
      beatTickHandler({time, beat, tick, nextBeat}) {
        this.beat = beat;
        this.nextBeat = nextBeat;
        if (this.showBall && !tick) {
          Tone.Draw.schedule(() => {
            if (!this.paused && this.showBall) {
              this.bounceAnimation.play(0);
              TweenMax.to('#bouncing', .8 * this.durationMs, {
                left: this.lefts[nextBeat],
                delay: nextBeat ? .1 * this.durationMs : 0
              });
            }
          }, time);
        }
      },
      ballEnter(starting) {
        TweenMax.fromTo('#bouncing', this.durationMs, {
          opacity: 1,
          left: 0
        }, {
          left: this.lefts[this.nextBeat]
        });
        TweenMax.fromTo('#bouncing', this.durationMs, {
          bottom: '160%',
        }, {
          bottom: 0,
          ease: Circ.easeIn,
          delay: starting ? .2 * this.durationMs : 0
        });
      },
      ballExit() {
        TweenMax.to('#bouncing', .5 * this.durationMs, {
          bottom: '160%'
        });
      }
    },
    computed: {
      durationMs() {
        return this.duration / 1000;
      },
      bounceAnimation() {
        return new TimelineMax().to('#bouncing', .2 * this.durationMs, {
          transform: 'translateY(-7vh) scale(0.9, 1.1)'
        }).to('#bouncing', .2 * this.durationMs, {
          transform: 'translateY(-10vh) scale(1.1, 0.9)'
        }).to('#bouncing', .3 * this.durationMs, {
          transform: 'translateY(0.1vh) scale(0.8, 1.2)',
          ease: Circ.easeIn
        }).to('#bouncing', .2 * this.durationMs, {
          transform: 'translateY(0.2vh) scale(1.2, 0.6)'
        }).to('#bouncing', .1 * this.durationMs, {
          transform: 'translateY(0.2vh) scale(0.8, 1.2)'
        });
      },
      ...mapGetters({
        playing: 'transport/playing',
        active: 'transport/active',
        counts: 'transport/counts',
        duration: 'transport/duration',
        numBeats: 'transport/numBeats'
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
        if (showBall) {
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
    height: 3vw;
    font-size: @height;
    font-weight: 800;
    line-height: @height;
    margin-left: -0.5 * @height;
    width: @height;

  #bouncing
    background-color: primary-blue;
    transform-origin: bottom;
    opacity: 0;

  .counter
    border: solid 6px primary-blue;
    bottom: -4vw;
    color: primary-blue;
    opacity: 0;
    text-align: center;
    transition: all 150ms cubic-bezier(0.81, 0.16, 0.38, 0.56);
    transform: scale(0.1, 1.2);

    &.active {
      bottom: 0;
      opacity: 1;
      transform: scale(1, 1);
    }
</style>
