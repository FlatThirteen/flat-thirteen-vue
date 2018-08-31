<template lang="pug">
  svg(height="60", width="60", viewBox="0 0 60 60", @click="$emit('click')")
    path.backing-icon(:d="path", :class="backing", stroke-width="5px")
</template>

<script>
  export default {
    props: {
      backing: String
    },
    constants: {
      path: 'M2,30 L12,20 L12,35 L27,20 L27,35 L42,20 L42,35 L57,20 L57,40 L0,40 Z'
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  .none
    fill: #DDD;
    stroke: @fill;

  .bass
    fill: bass-color;
    stroke: @fill;

</style>
