<template lang="pug">
  .power.button(ref="notes", v-if="show", @click="onClick()", :class="{active}",
      @mouseenter="onMouseEnter()", @mouseleave="onMouseLeave()")
    .note

</template>

<script>
  import AnimatedMixin from '~/mixins/animated.mixin';

  import Sound from '~/common/sound/sound';

  export default {
    mixins: [AnimatedMixin],
    constants: {
      animationTarget: 'notes',
      animationDefinitions: {
        appear: [[0, {
          bottom: '-100px'
        }], [1, {
          bottom: '5px',
          delay: 1
        }]],
        click: [[.5, {
          bottom: '10px',
          left: '-15px'
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
            this.animate('appear', { duration: 2, delay: 1 });
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
    posit(absolute, x);
    margin-left: 10px;

  .note
    background-color: white;
    border-radius: 50%;
    posit(absolute, 9px)
</style>
