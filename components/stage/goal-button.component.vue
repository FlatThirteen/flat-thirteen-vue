<template lang="pug">
  .anchor
    slot
    .goal.button(ref="goal", :class="{weenie, penalty, count: animatedLast === 'count'}",
        @click="$emit('click')")
      img(src="~/assets/listen-music-128.png", v-show="animatedLast !== 'count'")
</template>

<script>
  import AnimatedMixin from '~/mixins/animated.mixin';

  export default {
    mixins: [AnimatedMixin],
    props: {
      weenie: Boolean,
      penalty: Boolean
    },
    constants: {
      animationTarget: 'goal',
      animationDefinitions: {
        launch: [[.2, {
          transform: 'translateY(2vh) scale(1.2, 0.6)'
        }], [.2, {
          transform: 'translateY(0vh) scale(0.5, 1.2)'
        }], [.6, {
          transform: 'translateY(-50vh) scale(0.5, 1)'
        }]],
        land: [[0, {
          transform: 'translateY(-100vh) scale(0.5, 1)'
        }], [.6, {
          transform: 'translateY(0vh) scale(0.5, 1.2)'
        }], [.2, {
          transform: 'translateY(2vh) scale(1.2, 0.6)'
        }], [.2, {
          transform: 'translateY(0) scale(1)'
        }]],
        count: [[.2, {
          transform: 'translateY(-1vh)'
        }], [.2, {
          transform: 'translateY(0vh)'
        }], [.2, {
          transform: 'translateY(0vh)'
        }], [.2, {
          transform: 'translateY(12vh)'
        }]],
        appear: [[0, {
          transform: 'translateY(5vh) scale(0)'
        }], [.8, {
          transform: 'translateY(-1vh) scale(1.05)'
        }], [.2, {
          transform: 'translateY(0) scale(1)'
        }]],
        disappear: [[.4, {
          transform: 'translateY(0) scale(1.05)'
        }], [.6, {
          transform: 'translateY(0) scale(0)'
        }]]
      }
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  @import "~assets/stylus/weenie.styl"

  .anchor
    position: relative;

  .goal
    position: relative;
    background-color: primary-blue;
    border: solid 6px primary-blue;
    border-radius: 50%;
    height: 48px;
    width: 48px;

    &.count
      background-color: white;
      transition: background-color 200ms;

  img
    posit(absolute, 0, x, x, 0);
    height: 40px;
    width: 40px;
    margin: 5px;

</style>
