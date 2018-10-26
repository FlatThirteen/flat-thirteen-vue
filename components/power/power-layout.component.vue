<template lang="pug">
  .power.button(ref="layout", v-if="show", @click="onClick()", :class="{active}",
      @mouseenter="onMouseEnter()", @mouseleave="onMouseLeave()")
    .square
</template>

<script>
  import PowerMixin from './power.mixin';

  export default {
    mixins: [PowerMixin],
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
