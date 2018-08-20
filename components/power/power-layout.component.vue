<template lang="pug">
  .power.button(ref="layout", v-if="show", @click="onClick()", :class="{active}",
      @mouseenter="onMouseEnter()", @mouseleave="onMouseLeave()")
    .square
</template>

<script>
  import AnimatedMixin from '~/mixins/animated.mixin';

  import Sound from '~/common/sound/sound';

  export default {
    mixins: [AnimatedMixin],
    constants: {
      animationTarget: 'layout',
      animationDefinitions: {
        appear: [[0, {
          right: '0'
        }], [1, {
          right: '-70px',
          delay: 1
        }]],
        click: [[.5, {
          bottom: '20%',
          right: '-40px'
        }], [.3, {
          transform: 'scale(2) rotate(45deg)',
          opacity: 0.5
        }], [.2, {
          transform: 'scale(2.5) rotate(205deg)',
          opacity: 0
        }]]
      }
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
    posit(absolute, x, 0, 0, x)

  .square
    border: solid 5px white;
    posit(absolute, 10px)
</style>
