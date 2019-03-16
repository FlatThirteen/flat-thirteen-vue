<template lang="pug">
  .power.button(ref="intensity", v-if="show", @click="onClick()", :class="{active}",
      @mouseenter="onMouseEnter()", @mouseleave="onMouseLeave()")
    svg(height="40", width="40", viewBox="0 0 40 40")
      path(:d="path", fill="white")
</template>

<script>
  import PowerMixin from './power.mixin';

  import Svg from '~/common/svg';

  const halfIntensity = [[0, 7], [13, 17], [7, 30]];

  export default {
    mixins: [PowerMixin],
    constants: {
      animationTarget: 'intensity',
      animationDefinitions: {
        appear: [[0, {
          marginLeft: '-70px'
        }], [1, {
          marginLeft: 0,
          opacity: 1,
          delay: 1.8
        }]],
        click: [[.5, {
          marginLeft: '20px',
          marginTop: '30px'
        }], [.3, {
          transform: 'scale(2) rotate(45deg)',
          opacity: 0.5
        }], [.2, {
          transform: 'scale(2.5) rotate(205deg)',
          opacity: 0
        }]]
      },
      path: Svg.path(Svg.mirror(halfIntensity, [20, 0]), { z: true }),
      soundEffectDelay: 2000
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  @import "~assets/stylus/power.styl"

  .power
    posit(absolute, 5px, x, x, 10px);
    margin-left: -200vw;
</style>
