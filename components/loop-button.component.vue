<template lang="pug">
  .loop.button(ref="loop", :class="{show: autoLoop}")
</template>

<script>
  import { mapGetters } from 'vuex';

  import AnimatedMixin from '~/mixins/animated.mixin';

  import BeatTick from '~/common/core/beat-tick.model';

  export default {
    mixins: [AnimatedMixin],
    mounted() {
      this.$bus.$on(BeatTick.BEAT, this.beatHandler);
    },
    destroyed() {
      this.$bus.$off(BeatTick.BEAT, this.beatHandler);
    },
    methods: {
      beatHandler() {
        if (this.autoLoop && this.nextScene !== 'playback') {
          this.animate('loop', [[.2, {
            transform: 'scale(1.05)'
          }], [.6, {
            transform: 'scale(0.95)'
          }], [.2, {
            transform: 'scale(1)'
          }]]);
        }
      }
    },
    computed: {
      ...mapGetters({
        autoLoop: 'stage/autoLoop',
        scene: 'stage/scene',
        nextScene: 'stage/nextScene'
      })
    },
    watch: {
      scene(scene, oldScene) {
        if (!this.autoLoop) {
          return;
        }
        if (scene === 'standby' && (oldScene === 'goal' || oldScene === 'count')) {
          this.animate('loop', [[0, {
            transform: 'scale(1)'
          }], [.2, {
            transform: 'scale(1.1)'
          }], [.8, {
            opacity: 0,
            transform: 'scale(0)'
          }]]);
        } else if ((scene === 'count' && this.nextScene === 'goal') && oldScene === 'goal') {
          this.animate('loop', [[0, {
            transform: 'translateY(0)'
          }], [.2, {
            transform: 'translateY(-.5vh)'
          }], [.2, {
            transform: 'translateY(1vh)'
          }], [.2, {
            transform: 'translateY(0)'
          }]]);
        } else if (scene === 'playback' && (oldScene === 'goal' || oldScene === 'count')) {
          this.animate('loop', [[0, {
            transform: 'translateY(0)'
          }], [.2, {
            transform: 'translateY(-1vh)'
          }], [.8, {
            opacity: 0,
            transform: 'translateY(3vh)'
          }]]);
        }
      },
      nextScene(nextScene, oldNextScene) {
        if (!this.autoLoop) {
          return;
        }
        if (nextScene === 'goal') {
          this.animate('loop', [[0, {
            opacity: 0,
            transform: 'translateY(3vh)'
          }], [.8, {
            opacity: 1,
            transform: 'translateY(-1vh)',
          }], [.2, {
            transform: 'translateY(0)'
          }]]);
        } else if (nextScene === 'playback' && (oldNextScene === 'goal' || oldNextScene === 'count')) {
          this.animate('loop', [[0, {
            transform: 'scale(1)'
          }], [.2, {
            transform: 'scale(1.1)'
          }], [.8, {
            opacity: 0,
            transform: 'scale(0)'
          }]]);
        }
      }
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">

  .loop
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    height: 60px;
    width: 60px;

    &.show:before, &.show:after
      content: '';
      border-radius: 50%;
      background-color: white;
      border: solid 5px primary-blue;
      display: block;
      margin: 1px;
      height: 18px;
      width: @height;

  </style>
