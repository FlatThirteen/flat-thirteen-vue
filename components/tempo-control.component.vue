<template lang="pug">
  .tempo
    metronome.icon(:playing="playing", :duration="duration")
    .control {{ tempo | three}}
      .up.button(v-show="tempo < max", :class="{weenie}", @click="$emit('tempo', tempo + increment)")
        .arrow ▲
      .down.button(v-show="tempo > min", @click="$emit('tempo', tempo - increment)") ▼
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
      weenie: Number
    },
    filters: {
      three(value) {
        return _.padStart(value, 3, ' ');
      }
    },
    computed: {
      ...mapGetters({
        playing: 'transport/playing',
        duration: 'transport/duration'
      })
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

  .control
    display: inline-block;
    position: relative;
    text-align: center;

    &:hover .up, &:hover .down, .weenie.up
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

</style>
