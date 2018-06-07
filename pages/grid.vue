<template lang="pug">
  .container
    key-handler(:player="true")
    .left
      transport-controls(:metronome="true", :beatsPerMeasure="beatsPerMeasure")
        .pulses-input
          input.pulses(type="text", v-model="pbb", placeholder="# pulses")

      .toggle.ball(:class="{active: showBall}",
          @click="showBall = !showBall") Bounce
      .toggle.counter(:class="{active: showCounter}",
          @click="showCounter = !showCounter") Counter
      .toggle.position(:class="{active: showPosition}",
          @click="showPosition = !showPosition") Position

    .content
      bouncing-ball.ball-container(:showBall="showBall", :showCounter="showCounter")
      html-grid(v-for="(surface, i) in surfaces", :key="i", :grid="surface")
        transport-position.transport-container(:show="showPosition")
      faces

</template>

<script>
  import { mapGetters } from 'vuex';

  import BeatTick from '~/common/core/beat-tick.model';

  import BouncingBall from '~/components/bouncing-ball.component';
  import Faces from '~/components/faces.component';
  import HtmlGrid from '~/components/grid/html-grid.component';
  import KeyHandler from '~/components/key-handler.component';
  import TransportControls from '~/components/transport-controls.component';
  import TransportPosition from '~/components/transport-position.component';

  export default {
    components: {
      'bouncing-ball': BouncingBall,
      'faces': Faces,
      'html-grid': HtmlGrid,
      'key-handler': KeyHandler,
      'transport-controls': TransportControls,
      'transport-position': TransportPosition
    },
    head: {
      title: 'Flat Thirteen | Grid'
    },
    layout: 'debug',
    data: function() {
      return {
        showBall: true,
        showCounter: true,
        showPosition: true,
        pbb: 1111,
        surfaces: [
          { soundByKey: { q: 'snare', a: 'kick' }, soundId: 'qa' },
          { soundByKey: { z: 'cowbell' } }
        ]
      }
    },
    mounted() {
      this.$bus.$on(BeatTick.EVENT, this.beatTickHandler);
    },
    destroyed() {
      this.$bus.$off(BeatTick.EVENT, this.beatTickHandler);
    },
    methods: {
      beatTickHandler({time, beatTick}) {
        _.forEach(this.getNotes(beatTick), note => {
          note.play(time);
        });
      }
    },
    computed: {
      pbbPerMeasure() {
        return _.map(_.split(this.pbb, ','), (pbb) => {
          return _.chain(_.split(pbb, '')).map(_.toNumber).filter(value => {
            return _.inRange(value, 1, 5);
          }).value();
        });
      },
      beatsPerMeasure() {
        return ':' + _.map(this.pbbPerMeasure, 'length').join(',');
      },
      pulsesByBeat() {
        return _.flatten(this.pbbPerMeasure);
      },
      ...mapGetters({
        getNotes: 'player/getNotes'
      })
    },
    watch: {
      pulsesByBeat: {
        deep: true,
        immediate: true,
        handler(pulsesByBeat) {
          this.$store.dispatch('player/update', pulsesByBeat);
        }
      }
    }
  }

</script>

<style scoped lang="stylus" type="text/stylus">
  .container
    position: relative;

  .left
    posit(absolute, x, x, x, 0);
    width: content-side-margin;
    text-align: center;

    .pulses-input
      margin: 10px 0;

      input
        background: transparent;
        border: none;
        margin: 0;
        text-align: center;
        width: 100%;

        &::placeholder {
          color: primary-red;
          font-size: 14px;
        }

        &[type="text"]
          margin-right: 14%;
          width: 86%;

        &:focus
          outline: none;

    .toggle
      background-color: white;
      border: solid 1px;
      cursor: pointer;
      padding: 5px;
      margin: 5px;
      user-select: none;

      &.active
        color: white;

    toggle-color(class, color)
      {class}
        color: color;
        border-color: color;

        &.active
          background-color: color;

    toggle-color('.ball', primary-blue);
    toggle-color('.counter', black);
    toggle-color('.position', primary-green);

  .content, .footer
    margin: 10vh content-side-margin;
    position: relative;

  .ball-container
    height: 10vh;
    width: 100%;
    max-width: 80vh;
    margin: auto;

  .transport-container
    posit(absolute);

</style>
