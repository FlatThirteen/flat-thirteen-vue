<template lang="pug">
  .power.button(ref="backing", v-if="show", @click="onClick()", :class="{active}",
      @mouseenter="onMouseEnter()", @mouseleave="onMouseLeave()")
    svg(height="40", width="40", viewBox="0 0 40 40")
      path(:d="path", fill="white")
</template>

<script>
  import PowerMixin from './power.mixin';

  import Svg from '~/common/svg';

  const backing = [[5, 23], [18, 10], [18, 25], [33, 10], [33, 27], [5, 27]];

  export default {
    mixins: [PowerMixin],
    constants: {
      animationTarget: 'backing',
      animationDefinitions: {
        appear: [[0, {
          marginLeft: '-70px'
        }], [1, {
          marginLeft: 0,
          delay: 1.8
        }]],
        click: [[.5, {
          marginLeft: '10px'
        }], [.3, {
          transform: 'scale(2) rotate(45deg)',
          opacity: 0.5
        }], [.2, {
          transform: 'scale(2.5) rotate(205deg)',
          opacity: 0
        }]]
      },
      path: Svg.path(backing, {z: true}),
      soundEffectDelay: 2000
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  @import "~assets/stylus/power.styl"

  .power
    posit(absolute, 25px, x, x, 20px)

</style>
