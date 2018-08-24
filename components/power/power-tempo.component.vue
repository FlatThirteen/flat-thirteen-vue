<template lang="pug">
  .power.button(ref="tempo", v-if="show", @click="onClick()", :class="{active}",
      @mouseenter="onMouseEnter()", @mouseleave="onMouseLeave()")
    svg(height="40", width="40", viewBox="0 0 40 40")
      path(:d="path", fill="white")
</template>

<script>
  import AnimatedMixin from '~/mixins/animated.mixin';

  import Sound from '~/common/sound/sound';
  import Svg from '~/common/svg';

  const halfBacking = [[6, 10], [10, 30]];

  export default {
    mixins: [AnimatedMixin],
    constants: {
      animationTarget: 'tempo',
      animationDefinitions: {
        appear: [[0, {
          marginTop: '-70px'
        }], [1, {
          marginTop: '3px',
          delay: 1
        }]],
        click: [[.5, {
          marginTop: '35px'
        }], [.3, {
          transform: 'scale(2) rotate(45deg)',
          opacity: 0.5
        }], [.2, {
          transform: 'scale(2.5) rotate(205deg)',
          opacity: 0
        }]]
      },
      path: Svg.path(Svg.mirror(halfBacking, [20, 0]), {z: true})
    },
    data() {
      return {
        show: false,
        active: false
      }
    },
    methods: {
      appear() {
        if (!this.show) {
          this.show = true;
          // Wait for nextTick so that power-up button shows up
          this.$nextTick(() => {
            this.animate('appear', { duration: 3 });
          });
          this.active = true;
        }
      },
      onClick() {
        Sound.playSequence('cowbell', ['A6', 'E7', 'A7'], '16t');
        this.active = false;
        this.animate('click', {
          duration: .5,
          onComplete: () => {
            this.show = false;
            this.$emit('click')
          }
        });
      },
      onMouseEnter() {
        if (this.active && this.animated) {
          this.animated.pause();
        }
      },
      onMouseLeave() {
        if (this.active && this.animated) {
          this.animated.play();
        }
      }
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  @import "~assets/stylus/power.styl"

  .power
    posit(absolute, 3px, 54px, x, x)

</style>
