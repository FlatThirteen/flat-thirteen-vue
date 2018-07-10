<template lang="pug">
  .goal.button(ref="goal", v-show="mode === 'listen'")
    img(src="~/assets/listen-music-128.png", v-if="mode === 'listen'")
    svg(height="60", width="60", viewBox="0 0 60 60")
      svg:path.auto(v-if="mode === 'auto'", :d="autoPath",
          fill="white", stroke="white", stroke-width="1px")
</template>

<script>

  import { mapGetters } from 'vuex';

  import AnimatedMixin from '~/mixins/animated.mixin';

  import BeatTick from '~/common/core/beat-tick.model';

  export default {
    mixins: [AnimatedMixin],
    constants: {
      autoPath: 'M15,27 H32 V23 L47,30 L32,37 V33 H15 Z',
      animationTarget: 'goal',
      animationDefinitions: {
        launch: [[.2, {
          transform: 'translateY(2vh) scale(1.2, 0.6)'
        }], [.2, {
          transform: 'translateY(0vh) scale(0.5, 1.2)'
        }], [.6, {
          transform: 'translateY(-30vh) scale(0.5, 1)'
        }]],
        land: [[0, {
          transform: 'translateY(-30vh) scale(0.5, 1)'
        }], [.6, {
          transform: 'translateY(0vh) scale(0.5, 1.2)'
        }], [.2, {
          transform: 'translateY(2vh) scale(1.2, 0.6)'
        }], [.2, {
          transform: 'translateY(0) scale(1)'
        }]],
        appear: [[0, {
          transform: 'translateY(5vh) scale(0)'
        }], [.8, {
          transform: 'translateY(-1vh) scale(1.05)',
          opacity: 1
        }], [.2, {
          transform: 'translateY(0) scale(1)'
        }]],
        disappear: [[.4, {
          transform: 'translateY(0) scale(1.05)'
        }], [.6, {
          transform: 'translateY(0) scale(0)'
        }]]
      }
    },
    data: function() {
      return {
        mode: 'listen'
      };
    },
    mounted() {
      this.mode = this.autoGoal ? 'auto' : 'listen';
    },
    computed: {
      ...mapGetters({
        autoGoal: 'stage/autoGoal',
        scene: 'stage/scene',
        nextScene: 'stage/nextScene'
      })
    },
    watch: {
      scene: {
        immediate: true,
        handler(scene, oldScene) {
          if (scene === 'goal' && oldScene === 'standby') {
            this.animate('launch');
          } else if (!this.autoGoal && scene === 'count' && oldScene !== 'victory' ||
              oldScene === 'standby') {
            this.animate('disappear');
          } else if (scene === 'standby') {
            this.mode = 'listen';
            this.animate(oldScene === 'goal' ? 'land' : 'appear');
          }
        }
      }
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  .goal
    position: relative;
    background-color: primary-blue;
    border-radius: 50%;

  img
    posit(absolute, 0, x, x, 0);
    height: 40px;
    width: 40px;
    margin: 10px;

</style>
