<template lang="pug">
  .loop(ref="loop", :class="loopClass")
</template>

<script>
  import { mapGetters } from 'vuex';

  import AnimatedMixin from '~/mixins/animated.mixin';

  import BeatTick from '~/common/core/beat-tick.model';

  export default {
    mixins: [AnimatedMixin],
    constants: {
      animationTarget: 'loop',
      animationDefinitions: {
        pulse: [[.2, {
          transform: 'scale(1.05)'
        }], [.6, {
          transform: 'scale(0.95)'
        }], [.2, {
          transform: 'scale(1)'
        }]],
        bumper: [[0, {
          transform: 'translateX(0)'
        }], [.2, {
          transform: 'translateX(1vw)'
        }], [.1, {
          transform: 'translateX(-1vw)'
        }], [.2, {
          transform: 'translateX(0)'
        }]],
        toast: [[0, {
          opacity: 0,
          transform: 'translateY(3vh)'
        }], [.8, {
          opacity: 1,
          transform: 'translateY(-1vh)',
        }], [.2, {
          transform: 'translateY(0)'
        }]],
        drop: [[0, {
          transform: 'translateY(0)'
        }], [.2, {
          transform: 'translateY(-1vh)'
        }], [.8, {
          opacity: 0,
          transform: 'translateY(3vh)'
        }]]
      }
    },
    mounted() {
      this.$bus.$on(BeatTick.BEAT, this.beatHandler);
    },
    destroyed() {
      this.$bus.$off(BeatTick.BEAT, this.beatHandler);
    },
    methods: {
      beatHandler() {
        if (this.autoLoop && this.nextScene !== 'playback') {
          this.animate('pulse', { unless: 'drop'});
        }
      }
    },
    computed: {
      loopClass() {
        return {
          button: this.showLoop,
          off: !this.autoLoop,
          repeat: this.autoRepeat
        }
      },
      ...mapGetters({
        scene: 'stage/scene',
        nextScene: 'stage/nextScene',
        autoLoop: 'stage/autoLoop',
        autoRepeat: 'stage/autoRepeat',
        showLoop: 'stage/showLoop'
      })
    },
    watch: {
      scene(scene, oldScene) {
        if (!this.autoLoop) {
          return;
        }
        if (this.nextScene === 'goal' && oldScene === 'goal') {
          this.animate('bumper');
        } else if (scene === 'goal' && this.nextScene === 'count') {
          this.animate('toast', { when: 'drop' });
        }
      },
      nextScene(nextScene, oldNextScene) {
        if (!this.autoLoop) {
          return;
        }
        if (nextScene === 'goal') {
          this.animate('toast', { when: 'drop' });
        } else if (nextScene === 'standby' ||
            nextScene === 'playback' && (oldNextScene === 'goal' || oldNextScene === 'count')) {
          this.animate('drop');
        }
      }
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">

  .loop
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: space-between;
    height: 60px;
    width: 30px;
    margin-left: 30px;

    &.button
      &:before, &:after
        content: '';
        border-radius: 50%;
        background-color: white;
        border: solid 5px primary-blue;
        display: block;
        margin: 1px;
        height: 18px;
        width: @height;
        transition: all 150ms;

      &:hover:before, &:hover:after
        border-color: primary-blue + 50%;

      &.off
        &:before, &:after
          border-color: faint-grey;

        &:hover:before, &:hover:after
          border-color: faint-grey - 20%;

    &.repeat:before, &.repeat:after
      background-color: primary-blue;

  </style>
