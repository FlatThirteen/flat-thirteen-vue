<template lang="pug">
  .penalty(ref="penalty", :style="{top, right, bottom, left}") {{ penalty }}
</template>

<script>
  import AnimatedMixin from '~/mixins/animated.mixin';

  import Sound from '~/common/sound/sound';

  export default {
    mixins: [AnimatedMixin],
    props: {
      top: String,
      right: String,
      bottom: String,
      left: String
    },
    constants: {
      animationTarget: 'penalty',
      animationDefinitions: {
        appear: [[0, {
          transform: 'translateY(10px) scale(1.2, 0.6) rotate(0)',
        }], [.1, {
          transform: 'translateY(-20px) scale(0.8, 1.2)',
          opacity: 1
        }], [.1, {
          transform: 'translateY(0) scale(1)'
        }], [.6, {
          transform: 'translateY(0)'
        }], [.2, {
          transform: 'translateY(50px) rotate(135deg)',
          opacity: 0
        }]]
      }
    },
    data() {
      return {
        penalty: 0,
        buffer: []
      }
    },
    methods: {
      appear(amount, {noisy, silent} = {}) {
        if (this.penalty) {
          this.buffer.push(amount);
        } else if (amount) {
          if (!silent) {
            Sound.playSequence('cowbell', ['F4', 'D4'], '32n');
          }
          this.penalty = amount;
          this.animate('appear', {
            duration: 1,
            onComplete: () => {
              this.penalty = 0;
              if (this.buffer.length) {
                this.appear(this.buffer.shift());
              }
            }
          });
        } else if (noisy) {
          Sound.playSequence('cowbell', ['D4', 'D4'], '32n');
        }
      }
    }
  }
</script>

<style scoped lang="stylus", type="text/stylus">
  .penalty
    position: absolute;
    opacity: 0;
    color: primary-red;
    font-size: 30px;
    font-weight: bold;
    transition-origin: center center;
</style>
