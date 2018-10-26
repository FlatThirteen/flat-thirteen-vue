<template lang="pug">
  .power.button(ref="notes", v-if="show", @click="onClick()", :class="{active}",
      @mouseenter="onMouseEnter()", @mouseleave="onMouseLeave()")
    .note

</template>

<script>
  import PowerMixin from './power.mixin';

  export default {
    mixins: [PowerMixin],
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
