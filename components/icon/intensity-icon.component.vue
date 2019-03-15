<template lang="pug">
  svg(:height="size", :width="size", viewBox="0 0 60 60")
    defs
      mask(id="mask")
        rect(width="100%", height="100%", fill="white")
        text.level(x="50%", y="60%") {{ level }}
    path.intensity(:d="path", :mask="color ? '' : 'url(#mask)'")
    text.level(v-if="color", x="50%", y="60%", :fill="color") {{ level }}
</template>

<script>
  import Svg from '~/common/svg';

  const halfIntensity = [[0, 2], [30, 25], [17, 60]];

  export default {
    props: {
      level: Number,
      color: String
    },
    constants: {
      path: Svg.path(Svg.mirror(halfIntensity, [30, 0]), { z: true }),
      size: 60
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  .level
    cursor: default;
    dominant-baseline: middle;
    text-anchor: middle;
</style>
