<template lang="pug">
  .tempo(v-if="min < max")
    metronome.icon(:playing="playing", :duration="duration")
    .control {{ tempo | three}}
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
      min: Number,
      max: Number
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

    .icon
      height: 60px;
      vertical-align: sub;

  .control
    display: inline-block;
    position: relative;
    text-align: center;

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
