<template lang="pug">
  .container
    key-handler(:player="true")
    .content
      bouncing-ball.ball-container(:showBall="showBall", :showCounter="showCounter")
      .svg-grids(v-if="showSvgGrid")
        svg-grid(v-for="(surface, i) in surfaces", :key="i", :grid="surface",
            :showPosition="showPosition")
      .html-grids(v-if="showHtmlGrid")
        html-grid(v-for="(surface, i) in surfaces", :key="'h' + i", :grid="surface")
          transport-position.transport-container(:show="showPosition")
      faces(:react="false")
    .left
      transport-controls(:metronome="true", :beatsPerMeasure="beatsPerMeasure.join(',')")
        .pulses-input
          input(type="text", v-model="pulseBeat", placeholder="# pulses",
              @keydown.stop="")

      .toggle.ball(:class="{active: showBall}",
          @click="showBall = !showBall") Bounce
      .toggle.counter(:class="{active: showCounter}",
          @click="showCounter = !showCounter") Counter
      .toggle.position(:class="{active: showPosition}",
          @click="showPosition = !showPosition") Position
      .spacer
      .toggle.svg-grid(:class="{active: showSvgGrid}",
          @click="showSvgGrid = !showSvgGrid") SVG Grid
      .toggle.html-grid(:class="{active: showHtmlGrid}",
          @click="showHtmlGrid = !showHtmlGrid") HTML Grid

</template>

<script>
  import { mapGetters } from 'vuex';

  import BeatTick from '~/common/core/beat-tick.model';

  import BouncingBall from '~/components/bouncing-ball.component';
  import Faces from '~/components/faces.component';
  import HtmlGrid from '~/components/grid/html-grid.component';
  import SvgGrid from '~/components/grid/svg-grid.component';
  import KeyHandler from '~/components/key-handler.component';
  import TransportControls from '~/components/transport-controls.component';
  import TransportPosition from '~/components/transport-position.component';

  export default {
    components: {
      'bouncing-ball': BouncingBall,
      'faces': Faces,
      'html-grid': HtmlGrid,
      'svg-grid': SvgGrid,
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
        showSvgGrid: true,
        showHtmlGrid: false,
        pulseBeat: 1111,
        surfaces: [
          { soundByKey: { q: 'snare', a: 'kick' } },
          { soundByKey: { z: 'cowbell' } }
        ]
      }
    },
    created() {
      this.$store.dispatch('stage/clear');
    },
    mounted() {
      this.$bus.$on(BeatTick.EVENT, this.beatTickHandler);
    },
    destroyed() {
      this.$bus.$off(BeatTick.EVENT, this.beatTickHandler);
    },
    methods: {
      beatTickHandler({time, beat, beatTick}) {
        this.$store.dispatch('stage/onBeatTick', { time, beat, beatTick });
      }
    },
    computed: {
      ...mapGetters({
        beatsPerMeasure: 'player/beatsPerMeasure'
      })
    },
    watch: {
      pulseBeat: {
        immediate: true,
        handler(pulseBeat) {
          this.$store.dispatch('player/update', { pulseBeat, surfaces: this.surfaces });
        }
      }
    }
  }

</script>

<style scoped lang="stylus" type="text/stylus">
  .container
    position: relative;

  .left
    posit(absolute, 0, x, x, 0);
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

    .spacer
      height: 40px;

    toggle-color('.ball', primary-blue);
    toggle-color('.counter', black);
    toggle-color('.position', primary-green);
    toggle-color('.svg-grid', primary-red);
    toggle-color('.html-grid', primary-red);

  .content, .footer
    margin: 10vh 0 0 content-side-margin;
    position: relative;

  .ball-container
    height: 10vh;
    width: 100%;
    max-width: 80vh;
    margin: auto;

  .transport-container
    posit(absolute);

</style>
