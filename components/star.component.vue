<template lang="pug">
  svg(height="30", width="30", viewBox="0 0 30 30")
    path.star(:d="path", :class="backing")
</template>

<script>
  import Svg from '~/common/svg';

  const halfStar = [[0, 0], [4, 10], [14, 11], [7, 17], [10, 28], [0, 21]];

  export default {
    props: {
      backing: {
        type: String,
        default: 'default'
      }
    },
    constants: {
      path: Svg.path(Svg.mirror(halfStar, [15,0]), {z: true})
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  .default
    fill: black;

  .none
    fill: white;

  .bass
    fill: bass-color;
</style>
