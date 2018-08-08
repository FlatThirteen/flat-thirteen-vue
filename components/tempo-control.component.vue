<template lang="pug">
  .tempo
    metronome.icon(:playing="playing", :duration="duration")
    .control {{ tempo }}
      .up(v-show="tempo < max", @click="$emit('update:tempo', tempo + increment)") ▲
      .down(v-show="tempo > min", @click="$emit('update:tempo', tempo - increment)") ▼
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
      min: {
        type: Number,
        default: 60
      },
      max: {
        type: Number,
        default: 240
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
    font-size: 8vh;

    .icon
      height: 8vh;
      vertical-align: sub;

  .control
    display: inline-block;
    position: relative;

    &:hover .up, &:hover .down
      opacity: 1;

    .up, .down
      opacity: 0;
      cursor: pointer;
      font-size: 10px;
      margin: 0 5%;
      padding: 3% 5%;
      transition: all 150ms ease;
      width: 80%;
      user-select: none;

      &:hover
        background-color: rgba(233, 233, 233, 0.4);

    .up
      posit(absolute, -7px, x, x)

    .down
      posit(absolute, x, x, 0)
</style>
