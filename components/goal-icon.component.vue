<template lang="pug">
  .goal.button(ref="goal", @click="$emit('click')", :class="{show}")
    img(src="~/assets/listen-music-128.png", v-if="mode === 'listen'")
    svg(height="60", width="60", viewBox="0 0 60 60")
      svg:path.auto(v-if="mode === 'auto'", :d="autoPath",
          fill="white", stroke="white", stroke-width="1px")
</template>

<script>
  import { TimelineMax } from 'gsap'
  import { mapGetters } from 'vuex';

  import BeatTick from '~/common/core/beat-tick.model';

  export default {
    props: {
      scene: {
        type: String,
        default: null
      },
      nextScene: {
        type: String,
        default: null
      }
    },
    data: function() {
      return {
        autoPath: 'M15,27 H32 V23 L47,30 L32,37 V33 H15 Z',
        mode: 'listen'
      };
    },
    mounted() {
      this.mode = this.autoGoal ? 'auto' : 'listen';
      this.$bus.$on(BeatTick.BEAT, this.beatHandler);
    },
    destroyed() {
      this.$bus.$off(BeatTick.BEAT, this.beatHandler);
    },
    methods: {
      beatHandler() {
        if (this.scene === 'count' && this.nextScene === 'goal') {
          this.mode = 'auto';
          this.animate([[.2, {
            transform: 'scale(1.05)'
          }], [.6, {
            transform: 'scale(0.95)'
          }], [.2, {
            transform: 'scale(1)'
          }]]);
        }
      },
      animate(data, options) {
        if (this.$refs.goal) {
          return _.reduce(data, (timeline, [time, style]) => {
            if (time) {
              return timeline.to(this.$refs.goal, time, style);
            } else {
              return timeline.from(this.$refs.goal, time, style);
            }
          }, new TimelineMax(options)).duration(this.animationDuration).play(0);
        }
      }
    },
    computed: {
      animationDuration() {
        return this.duration / 2;
      },
      ...mapGetters({
        duration: 'transport/duration',
        autoGoal: 'stage/autoGoal'
      }),
      show() {
        return this.scene === 'standby' ||
            this.scene === 'count' && this.nextScene === 'goal'
      }
    },
    watch: {
      scene(scene, oldScene) {
        if (scene === 'goal' && oldScene === 'standby') {
          this.animate([[.2, {
            transform: 'translateY(2vh) scale(1.2, 0.6)'
          }], [.2, {
            transform: 'translateY(0vh) scale(0.5, 1.2)'
          }], [.6, {
            transform: 'translateY(-50vh) scale(0.5, 1)'
          }]]);
        } else if (scene === 'goal' && oldScene === 'count') {
          this.animate([[.4, {
            transform: 'rotate(-15deg) scale(1.05)'
          }], [.6, {
            transform: 'rotate(180deg) scale(0)'
          }]]);
        } else if (scene === 'count' && this.nextScene === 'goal' && oldScene === 'goal') {
          this.mode = 'auto';
          this.animate([[0, {
            transform: 'rotate(180deg) scale(0)'
          }], [.8, {
            transform: 'rotate(-15deg) scale(1.05)'
          }], [.2, {
            transform: 'rotate(0) scale(1)'
          }]]);
        } else if (scene === 'standby' && oldScene === 'goal') {
          this.mode = 'listen';
          this.animate([[0, {
            transform: 'translateY(-50vh) scale(0.5, 1)'
          }], [.6, {
            transform: 'translateY(0vh) scale(0.5, 1.2)'
          }], [.2, {
            transform: 'translateY(2vh) scale(1.2, 0.6)'
          }], [.2, {
            transform: 'translateY(0) scale(1)'
          }]]);
        } else if ((scene === 'playback' || scene === 'count' && this.nextScene === 'playback')
              && oldScene === 'standby') {
          this.animate([[.2, {
            transform: 'rotate(0) scale(1.2)'
          }], [.3, {
            transform: 'rotate(-10deg) scale(1.2)'
          }], [.5, {
            transform: 'rotate(45deg) scale(0)'
          }]]);
        } else if (scene === 'standby') {
          this.mode = 'listen';
          this.animate([[.5, {
            transform: 'rotate(90deg) scale(0.8)'
          }], [.3, {
            transform: 'rotate(-10deg) scale(1.2)'
          }], [.2, {
            transform: 'rotate(0) scale(1)'
          }]]);
        }
      },
      nextScene(nextScene, oldNextScene) {
        if (nextScene === 'playback' && oldNextScene === 'goal') {
          this.animate([[.2, {
            transform: 'rotate(0) scale(1.2)'
          }], [.3, {
            transform: 'rotate(-10deg) scale(1.2)'
          }], [.5, {
            transform: 'rotate(45deg) scale(0)'
          }]]);
        }
      }
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  .goal
    display: inline-block;
    position: relative;
    background-color: primary-blue;
    border-radius: 50%;
    height: 60px;

  img
    posit(absolute, 0, x, x, 0);
    height: 40px;
    width: 40px;
    margin: 10px;

</style>
