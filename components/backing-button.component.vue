<template lang="pug">
  svg(height="60", width="60", viewBox="0 0 60 60", :class="{button: !throttled}",
      @click="onClick()")
    path.backing-icon(:d="path", stroke-width="5px", :class="[backingClass, {flip: throttled}]",
        :style="{animationDuration: throttle + 'ms'}")
</template>

<script>
  export default {
    props: {
      backing: String,
      throttle: Number
    },
    constants: {
      path: 'M2,30 L12,20 L12,35 L27,20 L27,35 L42,20 L42,35 L57,20 L57,40 L0,40 Z'
    },
    data() {
      return {
        backingClass: '',
        throttled: false
      }
    },
    methods: {
      onClick() {
        if (!this.throttled) {
          if (this.throttle) {
            this.throttled = true;
          }
          this.$emit('click');
          if (this.throttle) {
            setTimeout(() => {
              this.backingClass = this.backing;
            }, this.throttle / 2);
            setTimeout(() => {
              this.throttled = false;
            }, this.throttle);
          }
        }
      }
    },
    watch: {
      backing: {
        immediate: true,
        handler(backing) {
          if (!this.throttled) {
            this.backingClass = backing;
          }
        }
      }
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  .flip
    animation-name: flip;
    transform-origin: center;

  .none
    fill: #DDD;
    stroke: @fill;

  .bass
    fill: bass-color;
    stroke: @fill;

  @keyframes flip
    0%, 100%
      transform: scaleX(1);
    50%
      transform: scaleX(0);
</style>
