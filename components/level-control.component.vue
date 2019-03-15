<template lang="pug">
  .control(v-if="max > 0")
    slot
    .control__up(v-show="level < max", :class="{button: !throttled, weenie}",
        @click="onChange(level + 1)")
      .arrow ▲
    .control__down(v-show="level > 0", :class="{button: !throttled}",
        @click="onChange(level - 1)") ▼
</template>

<script>
  export default {
    props: {
      level: Number,
      max: Number,
      weenie: Number,
      throttle: Number
    },
    data() {
      return {
        throttled: false
      };
    },
    methods: {
      onChange(level) {
        if (!this.throttled) {
          if (this.throttle) {
            this.throttled = true;
          }
          this.$emit('level', level);
          if (this.throttle) {
            setTimeout(() => {
              this.throttled = false;
            }, this.throttle);
          }
        }
      }
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  .control
    display: inline-block;
    position: relative;
    text-align: center;

    &:hover .button, &__up.weenie
      opacity: 1;

    &__up, &__down
      opacity: 0.2;
      cursor: pointer;
      font-size: 10px;
      margin: 0 5%;
      padding: 3% 5%;
      transition: all 150ms ease;
      width: 80%;

      &:hover
        background-color: faint-grey;

    &__up
      posit(absolute, x, x, 100%, 0)

      &.weenie .arrow
        font-size: 20px;
        line-height: 16px;
        padding-top: 4px;

    &__down
      posit(absolute, 100%, x, x, 0)

  .weenie:not(:hover)
    animation: weenie-move 1s infinite 500ms;

  @keyframes weenie-move
    0%, 100%
      transform: translateY(0);
      shadow(#888, 0);
    50%
      transform: translateY(-5px);
      shadow(#888, 5px);
</style>
