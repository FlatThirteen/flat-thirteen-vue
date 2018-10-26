<template lang="pug">
  .power-container(v-if="show", ref="auto")
    .power.button(@click="onClick()", :class="{active}",
        @mouseenter="onMouseEnter()", @mouseleave="onMouseLeave()") o
</template>

<script>
  import PowerMixin from './power.mixin';

  import GameAnalytics from '~/common/game-analytics';
  import Sound from '~/common/sound/sound';

  export default {
    mixins: [PowerMixin],
    constants: {
      animationTarget: 'auto',
      animationDefinitions: {
        appear: [[0, {
          bottom: '-100%'
        }], [.3, {
          bottom: '10%'
        }], [.2, {
          bottom: '15%'
        }], [.2, {
          bottom: '5%'
        }], [.3, {
          bottom: '-100%'
        }]],
        disappear: [[1, {
          bottom: '-100%',
          transform: 'scale(0) rotate(225deg)'
        }]],
        center: [[.5, {
          bottom: '20%',
          right: '50%'
        }], [.3, {
          transform: 'scale(2) rotate(45deg)',
          opacity: 0.5
        }], [.2, {
          transform: 'scale(2.5) rotate(205deg)',
          opacity: 0
        }]],
        right: [[.5, {
          bottom: '20%',
          right: '15px',
          opacity: 0.9
        }], [.3, {
          transform: 'scale(2) rotate(45deg)',
          opacity: 0.5
        }], [.2, {
          transform: 'scale(2.5) rotate(205deg)',
          opacity: 0
        }]]
      },
      animationParams: [
        ['40%', '45%', '55%', '60%'],
        ['25px', '27px', '29px'],
        ['55px', '57px', '59px']
      ]
    },
    methods: {
      appear(level, {duration = 3, repeat = 2, repeatDelay = 1} = {}) {
        if (!this.show) {
          this.show = level;
          // Wait for nextTick so that power-up button shows up
          this.$nextTick(() => {
            let rights = _.shuffle(this.animationParams[this.show - 1]);
            let i = 0;
            this.set({ right: rights[i++]});
            this.animate('appear', {
              duration,
              repeat,
              repeatDelay,
              onRepeat: () => {
                this.set({ right: rights[i++]});
              }
            });
            this.active = true;
            GameAnalytics.power('Show', 'auto', level);
          });
        }
      },
      fade() {
        if (this.active) {
          this.active = false;
          this.animate('disappear');
        }
      },
      onClick() {
        Sound.playSequence('cowbell', ['A6', 'E7', 'A7'], '16t');
        this.active = false;
        this.animate(this.show === 1 ? 'center' : 'right', {
          duration: .5,
          onComplete: () => {
            this.show = 0;
            this.$emit('click')
          }
        });
      }
    },
    watch: {
      animated(animated) {
        if (!animated) {
          this.active = false;
          this.show = 0;
        }
      }
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  @import "~assets/stylus/power.styl"

  .power-container
    posit(absolute, x, x, -100%);
    margin-right: -20px;

  .power
    font-size: 40px;
    line-height: 35px;
    color: white;
    font-weight: bold;
</style>
