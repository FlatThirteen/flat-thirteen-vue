<template lang="pug">
  .play.button(ref="play", :class="playClass")
    svg(height="60", width="60", viewBox="0 0 60 60")
      defs(v-if="goalNotes")
        linearGradient(id="playGradient" x1="0" y1="0" x2="0" y2="100%")
          stop(:offset="stopTop", stop-color="white")
          stop(:offset="stopBottom", :stop-color="color")
      path.play-icon(:d="playPath",
          :fill="goalNotes ? 'url(#playGradient)' : color",
          :stroke="color" stroke-width="6px")
    .counter(v-if="showCount") {{ count }}
</template>

<script>
  import { TweenMax } from 'gsap'
  import { mapGetters } from 'vuex';

  import { primaryGreen } from '~/common/colors'

  import BeatTick from '~/common/core/beat-tick.model';

  export default {
    props: {
      showCount: {
        type: Boolean,
        default: false
      },
      scene: {
        type: String,
        default: null
      },
      nextScene: {
        type: String,
        default: null
      },
      playNotes: {
        type: Number,
        default: 0
      },
      goalNotes: {
        type: Number,
        default: 0
      }
    },
    data: function() {
      return {
        color: '#50ffa0',
        playPath: 'M5,5L50,30L5,55Z',
        count: 0,
        stopLevelTop: 0,
        stopLevelBottom: 0
      };
    },
    mounted() {
      this.$bus.$on(BeatTick.BEAT, this.beatHandler);
    },
    destroyed() {
      this.$bus.$off(BeatTick.BEAT, this.beatHandler);
    },
    methods: {
      beatHandler({count}) {
        this.count = count;
        if (this.goalNotes && this.showCount) {
          this.animate([[.1, {
            transform: 'translateX(10px)'
          }], [.6, {
            transform: 'translateX(-6px)'
          }], [.3, {
            transform: 'translateX(0)'
          }]]);
        }
      },
      animate(data) {
        if (this.$refs.play) {
          _.reduce(data, (timeline, [time, style]) => {
            if (time) {
              return timeline.to(this.$refs.play, time, style);
            } else {
              return timeline.from(this.$refs.play, time, style);
            }
          }, new TimelineMax()).duration(this.animationDuration).play(0);
        }
      }
    },
    computed: {
      animationDuration() {
        return this.duration / 2;
      },
      ready() {
        return this.playNotes === this.goalNotes;
      },
      stopCalculation() {
        let highest = this.goalNotes > 4 ? 15 : 45 - this.goalNotes * 6;
        let notch = (75 - highest) / (this.goalNotes - 1);
        return 75 - notch * this.playNotes;
      },
      stopTop() {
        return this.stopLevelTop + '%';
      },
      stopBottom() {
        return this.stopLevelBottom + '%';
      },
      playClass() {
        return {
          wrong: this.goalNotes && !this.ready
        };
      },
      ...mapGetters({
        duration: 'transport/duration'
      })
    },
    watch: {
      playNotes: {
        immediate: true,
        handler() {
          TweenMax.to(this.$data, this.animationDuration, {
            stopLevelTop: this.ready ? 0 : this.stopCalculation,
            stopLevelBottom: this.ready ? 0 : this.stopCalculation + 15
          });
          if (this.$refs.play) {
            this.animate([[0, {
              transform: 'scale(1)'
            }], [.2, {
              transform: 'scale(0.8, 1.1)'
            }], [.4, {
              transform: 'scale(1.2, 0.8)'
            }], [.4, {
              transform: 'scale(1)'
            }]]);
          }
        }
      },
      scene(scene, oldScene) {
        if (scene === 'playback') {
          this.animate([[0, {
            opacity: 1,
            transform: 'translateX(0) scale(1)'
          }], [.2, {
            transform: 'translateX(-1vw) scale(0.8, 1.1)'
          }], [.3, {
            transform: 'translateX(-1vw) scale(0.6, 1.2)'
          }], [.4, {
            opacity: 0.5,
            transform: 'translateX(5vw) scale(1.5, 0.1)'
          }], [.1, {
            opacity: 0,
            transform: 'translateX(5vw) scale(0, 0)'
          }]]);
        } else if (scene === 'standby' && oldScene === 'playback') {
          this.animate([[0, {
            opacity: 0,
            transform: 'translateX(5vw) scale(0, 0)'
          }], [.1, {
            opacity: 0.5,
            transform: 'translateX(5vw) scale(1.5, 0.1)'
          }], [.5, {
            opacity: 1,
            transform: 'translateX(-1vw) scale(0.6, 1.2)'
          }], [.2, {
            transform: 'translateX(-1vw) scale(0.8, 1.1)'
          }], [.2, {
            transform: 'translateX(0) scale(1)'
          }]]);
        } else if (scene === 'goal') {
          this.animate([[.1, {
            transform: 'rotate(0) scale(1.2)'
          }], [.4, {
            transform: 'rotate(-10deg) scale(1.2)'
          }], [.5, {
            transform: 'rotate(90deg) scale(0)'
          }]]);
        } else if (scene === 'standby' || scene === 'count' && oldScene !== 'standby') {
          this.animate(appearData);
        }
      },
      nextScene(nextScene) {
        if (nextScene === 'playback') {
          this.animate(appearData);
        }
      }
    }
  }

  const appearData = [[0, {
    opacity: 0,
    transform: 'rotate(90deg) scale(0)'
  }], [.5, {
    opacity: 1,
    transform: 'rotate(45deg) scale(0.3)'
  }], [.3, {
    transform: 'rotate(-10deg) scale(1.2)'
  }], [.2, {
    transform: 'rotate(0) scale(1)'
  }]];

</script>

<style scoped lang="stylus" type="text/stylus">
  .play
    position: relative;

    &.wrong.button:hover:not(.disabled)
      shadow(primary-red)

  .counter
    posit(absolute, 0, x, x);
    font-size: 40px;
    padding: 10px 5px;

</style>
