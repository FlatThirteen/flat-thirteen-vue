<template lang="pug">
  .points(v-if="show")
    .char(v-for="(char, i) in pointChars",
        :style="{'animation-delay': 100 * i + 'ms'}") {{char}}
</template>

<script>
  export default {
    props: {
      show: {
        type: Boolean,
        default: false
      },
      points: {
        type: Number,
        default: 0
      }
    },
    computed: {
      pointChars() {
        return _.toArray(_.toString(this.points));
      }
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  .points
    posit(absolute, 0);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    text-shadow: 0 3px 6px rgba(255, 255, 255, 0.6)
    white-space: nowrap;

    .char
      display: inline-block;
      animation-name: points-bounce;
      animation-duration: 700ms;

  @keyframes points-bounce
    0%
      transform: translateY(1vh) scale(0.8, 1.2)
    30%
      transform: translateY(-5vh) scale(1.1, 0.9)
    60%
      transform: translateY(1vh) scale(0.9, 1.1)
    80%
      transform: translateY(-0.5vh) scale(1.05, .95)
    100%
      transform: translateY(0) scale(1, 1)
</style>
