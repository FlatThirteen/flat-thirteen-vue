<template lang="pug">
  .tempo
    metronome.icon(:playing="playing", :duration="duration", :disabled="toggle === false",
        :class="{button}", @click.native="button && $emit('update:toggle', !toggle)")
    .control(:class="{stage: stageGoal, flip: throttled}",
        :style="{animationDuration: throttle + 'ms'}") {{ displayTempo | three}}
      .up(v-show="tempo < max", :class="{button: !throttled, weenie: weenie && !stageGoal}",
          @click="onChange(tempo + increment)")
        .arrow ▲
      .down(v-show="tempo > min", :class="{button: !throttled}",
          @click="onChange(tempo - increment)") ▼
</template>

<script>
  import { mapGetters } from 'vuex'

  import Metronome from '~/components/metronome.component';

  export default {
    components: {
      'metronome': Metronome
    },
    props: {
      tempo: {
        type: Number,
        default: 120
      },
      increment: {
        type: Number,
        default: 10
      },
      min: Number,
      max: Number,
      weenie: Number,
      toggle: {
        type: Boolean,
        default: undefined
      },
      throttle: Number
    },
    data() {
      return {
        displayTempo: this.tempo,
        throttled: false
      };
    },
    methods: {
      onChange(tempo) {
        if (!this.throttled) {
          if (this.throttle) {
            this.throttled = true;
          }
          this.$emit('tempo', tempo);
          if (this.throttle) {
            setTimeout(() => {
              this.displayTempo = tempo;
            }, this.throttle / 2);
            setTimeout(() => {
              this.throttled = false;
            }, this.throttle);
          }
        }
      }
    },
    filters: {
      three(value) {
        return _.padStart(value, 3, ' ');
      }
    },
    computed: {
      button() {
        return this.toggle !== undefined;
      },
      ...mapGetters({
        stageGoal: 'progress/stageGoal',
        playing: 'transport/playing',
        duration: 'transport/duration'
      })
    },
    watch: {
      tempo: {
        immediate: true,
        handler(tempo) {
          if (!this.throttled) {
            this.displayTempo = tempo;
          }
        }
      }
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  .tempo
    display: inline-block;
    font-size: 60px;
    user-select: none;

    .icon
      height: 60px;
      vertical-align: sub;

  .flip
    animation-name: flip;

  .control
    display: inline-block;
    position: relative;
    text-align: center;

    &.stage .button, &:hover .button, .weenie.up
      opacity: 1;

    .up, .down
      opacity: 0;
      cursor: pointer;
      font-size: 10px;
      margin: 0 5%;
      padding: 3% 5%;
      transition: all 150ms ease;
      width: 80%;

      &:hover
        background-color: faint-grey;

    .up
      posit(absolute, x, x, 57px, 0)

      &.weenie .arrow
        font-size: 20px;
        line-height: 16px;
        padding-top: 4px;

    .down
      posit(absolute, x, x, 0, 0)

  .weenie:not(:hover)
    animation: weenie-move 1s infinite 500ms;

  @keyframes weenie-move
    0%, 100%
      transform: translateY(0);
      shadow(#888, 0);
    50%
      transform: translateY(-5px);
      shadow(#888, 5px);

  @keyframes flip
    0%, 100%
      transform: scaleY(1);
    50%
      transform: scaleY(0);
</style>
