<template lang="pug">
  .anchor
    slot
    .loop(ref="loop", @click="show && $emit('click')", :class="{button: show, off, repeat, assist}")
</template>

<script>
  import AnimatedMixin from '~/mixins/animated.mixin';

  export default {
    mixins: [AnimatedMixin],
    props: {
      show: Boolean,
      off: Boolean,
      repeat: Boolean,
      assist: Boolean
    },
    constants: {
      animationTarget: 'loop',
      animationDefinitions: {
        pulse: [[.2, {
          transform: 'scale(1.05)',
          outlineOffset: '13px'
        }], [.6, {
          transform: 'scale(0.95)',
          outlineOffset: '8px'
        }], [.2, {
          transform: 'scale(1)',
          outlineOffset: '10px',
          outlineWidth: 0
        }]],
        bumper: [[0, {
          transform: 'translateX(0)'
        }], [.2, {
          transform: 'translateX(1vw)'
        }], [.1, {
          transform: 'translateX(-1vw)'
        }], [.2, {
          transform: 'translateX(0)'
        }]],
        toast: [[0, {
          opacity: 0,
          transform: 'translateY(3vh)'
        }], [.8, {
          opacity: 1,
          transform: 'translateY(-1vh)',
        }], [.2, {
          transform: 'translateY(0)'
        }]],
        drop: [[0, {
          transform: 'translateY(0)'
        }], [.2, {
          transform: 'translateY(-1vh)'
        }], [.8, {
          opacity: 0,
          transform: 'translateY(3vh)'
        }]]
      }
    },
    methods: {
      pulse(beat) {
        this.set({ outlineWidth: (3 + beat) + 'px'});
        this.animate('pulse', { unless: 'drop', skip: true });
      }
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  .anchor
    position: relative;

  .loop
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: space-between;
    height: 60px;
    width: 30px;
    margin-left: 30px;

    &.button
      &:before, &:after
        content: '';
        border-radius: 50%;
        border: solid 5px primary-blue;
        display: block;
        margin: 1px;
        height: 18px;
        width: @height;
        transition: all 150ms;

      &:hover:before, &:hover:after
        border-color: primary-blue + 50%;

      &.off
        &:before, &:after
          border-color: alpha(gray, 0.4);

        &:hover:before, &:hover:after
          border-color: alpha(gray, 0.4) - 20%;

      &.assist
        outline: solid alpha(primary-green, 0.3);

    &.repeat:before, &.repeat:after
      background-color: primary-blue;

  </style>
