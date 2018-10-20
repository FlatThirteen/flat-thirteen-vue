<template lang="pug">
  svg(height="60", width="60", viewBox="0 0 60 60")
    path.metronome(:d="path", :class="{hint, disabled}")
    g.arm(v-if="!hint", :class="{playing}", :style="style")
      line(x1="30", y1="3", x2="30", y2="45", stroke="#EEE", stroke-width="2px")
      circle(cx="30", cy="45", r="8", fill="#EEE")
</template>

<script>

  export default {
    props: {
      disabled: Boolean,
      playing: Boolean,
      hint: Boolean,
      duration: Number,
    },
    constants: {
      path: 'M0,60 L15,0 L45,0 L60,60 Z'
    },
    computed: {
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
      stroke: #DDD;
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
