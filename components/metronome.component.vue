<template lang="pug">
  svg(:height="size", :width="size", viewBox="0 0 60 60")
    defs(v-if="mask")
      mask(id="arm-mask")
        g.arm(:class="{playing}", :style="style")
          rect(x="-50%", y="-50%", width="200%", height="200%", fill="white")
          line(x1="30", y1="3", x2="30", y2="45", stroke="black", stroke-width="2px")
          circle(cx="30", cy="45", r="8", fill="black")
    path.metronome(:d="path", :class="{hint, disabled}", :mask="mask")

</template>

<script>

  export default {
    props: {
      disabled: Boolean,
      playing: Boolean,
      hint: Boolean,
      mini: Boolean,
      duration: Number,
    },
    constants: {
      path: 'M0,60 L15,0 L45,0 L60,60 Z'
    },
    computed: {
      size() {
        return this.mini ? 20 : 60;
      },
      mask() {
        return !this.hint && !this.mini && 'url(#arm-mask)';
      },
      style() {
        return !this.duration ? {} : { animationDuration: ( this.duration * 2) + 's'};
      }
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  .metronome
    fill: black;

    &.disabled
      fill: #DDD;

    &.hint
      fill: transparent;
      stroke: #CCC;
      stroke-dasharray: 6px;
      stroke-width: 3px;

  .playing
    transform-origin: 50% 60%;
    animation: tick linear infinite;

  @keyframes tick
    0%, 100%
      transform: rotate(0);
    10%, 40%
      transform: rotate(20deg);
    20%, 30%
      transform: rotate(30deg);
    50%
      transform: rotate(0);
    60%, 90%
      transform: rotate(-20deg);
    70%, 80%
      transform: rotate(-30deg);
</style>
