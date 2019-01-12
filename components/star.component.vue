<template lang="pug">
  svg(height="30", width="30", viewBox="0 0 30 30")
    path.star(:d="path", stroke-width="2px", stroke-linejoin="miter", :class="[backing, { hollow }]")
</template>

<script>
  import Svg from '~/common/svg';

  const halfStar = [[0, 2], [4, 11], [13, 12], [7, 18], [10, 28], [0, 22]];

  export default {
    props: {
      backing: {
        type: String,
        default: 'default'
      },
      hollow: Boolean
    },
    constants: {
      path: Svg.path(Svg.mirror(halfStar, [15,0]), {z: true})
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  .default
    fill: black;
    stroke: @fill;

  .none
    fill: white;
    stroke: @fill;

  .bass
    fill: bass-color;
    stroke: @fill;

  .hollow
    fill: transparent;
</style>
