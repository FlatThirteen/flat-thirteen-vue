<template lang="pug">
  .container
    key-handler(:player="true")
    transport(v-bind="{beatsPerMeasure, tempo, metronome}")
    .top
      play-control
      .layouts
        layout-button(v-for="(thisLayout, i) in layouts", :key="i", :layout="thisLayout",
            :selected="layout === thisLayout", @click="layout = thisLayout")
      tempo-control(:tempo="tempo", :min="60", :max="240", @tempo="tempo = $event",
          :toggle.sync="metronome")
    .content
      stage-ball.ball-container(:showBall="showBall", :showCounter="showCounter")
      .svg-grids(v-if="showSvgGrid")
        svg-grid(v-for="(surface, i) in layout", :key="i", :grid="surface",
            :showPosition="showPosition")
      .html-grids(v-if="showHtmlGrid")
        html-grid(v-for="(surface, i) in layout", :key="'h' + i", :grid="surface")
          transport-position.transport-container(:show="showPosition")
      faces(:scene="playing ? 'playback' : 'standby'")
    .bottom
      .toggle.ball(:class="{active: showBall}",
          @click="showBall = !showBall") Bounce
      .toggle.counter(:class="{active: showCounter}",
          @click="showCounter = !showCounter") Counter
      .toggle.position(:class="{active: showPosition}",
          @click="showPosition = !showPosition") Position
      .pulses-input
        input(type="text", v-model="pulseBeat", placeholder="# pulses",
            @keydown.stop="")
      .toggle.svg-grid(:class="{active: showSvgGrid}",
          @click="showSvgGrid = !showSvgGrid") SVG Grid
      .toggle.html-grid(:class="{active: showHtmlGrid}",
          @click="showHtmlGrid = !showHtmlGrid") HTML Grid

</template>

<script>
  import { mapGetters } from 'vuex';

  import BeatTick from '~/common/core/beat-tick.model';

  import LayoutButton from '~/components/curriculum/layout-button.component';
  import HtmlGrid from '~/components/grid/html-grid.component';
  import SvgGrid from '~/components/grid/svg-grid.component';
  import TransportPosition from '~/components/grid/transport-position.component';
  import KeyHandler from '~/components/key-handler.component';
  import PlayControl from '~/components/play-control.component';
  import Faces from '~/components/stage/faces.component';
  import StageBall from '~/components/stage/stage-ball.component';
  import Transport from '~/components/stage/transport.component';
  import TempoControl from '~/components/tempo-control.component';

  export default {
    components: {
      'layout-button': LayoutButton,
      'html-grid': HtmlGrid,
      'svg-grid': SvgGrid,
      'key-handler': KeyHandler,
      'play-control': PlayControl,
      'faces': Faces,
      'stage-ball': StageBall,
      'transport': Transport,
      'tempo-control': TempoControl,
      'transport-position': TransportPosition
    },
    head: {
      title: 'Flat Thirteen | Grid'
    },
    layout: 'debug',
    constants: {
      layouts: [
        [{ noteByKey: { a: 'kick' } }],
        [{ noteByKey: { q: 'snare', a: 'kick' } }],
        [{ noteByKey: { q: 'snare' } }, { noteByKey: { a: 'kick' } }],
        [{ noteByKey: { q: 'snare', a: 'kick' } }, { noteByKey: { z: 'cowbell' } }]
      ]
    },
    data() {
      return {
        tempo: 120,
        metronome: true,
        showBall: true,
        showCounter: true,
        showPosition: true,
        showSvgGrid: true,
        showHtmlGrid: false,
        pulseBeat: 1111,
        layout: this.layouts[this.layouts.length - 1]
      }
    },
    mounted() {
      this.$bus.$on(BeatTick.EVENT, this.beatTickHandler);
      this.$store.dispatch('phrase/clear', 'goal');
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
      ...mapGetters({
        beatsPerMeasure: 'player/beatsPerMeasure',
        getNotes: 'player/getNotes',
        playing: 'transport/playing'
      })
    },
    watch: {
      pulseBeat: {
        immediate: true,
        handler(pulseBeat) {
          this.$store.dispatch('player/update', { pulseBeat, layout: this.layout });
        }
      },
      layout(layout) {
        this.$store.dispatch('player/update', { pulseBeat: this.pulseBeat, layout });
      }
    }
  }

</script>

<style scoped lang="stylus" type="text/stylus">
  .container
    position: relative;

  .top
    display: flex;
    justify-content: space-between;
    background-color: faint-grey;
    padding: 12px;

    .layouts
      display: inline-flex;

  .bottom
    posit(fixed, x, 0, 0);
    background-color: white;
    box-shadow: 0 0 25px 15px white;
    display: flex;
    justify-content: center;

    .pulses-input
      margin: 10px 0;

      input
        background: transparent;
        border: none;
        margin: 0;
        text-align: center;

        &::placeholder {
          color: primary-red;
          font-size: 14px;
        }

        &:focus
          outline: none;

    toggle-color('.ball', primary-blue);
    toggle-color('.counter', black);
    toggle-color('.position', primary-green);
    toggle-color('.svg-grid', primary-red);
    toggle-color('.html-grid', primary-red);

  .content
    position: relative;
    margin-bottom: 60px;

  .ball-container
    position: relative;
    height: 15vh;
    width: 100%;
    margin: auto;

  .transport-container
    posit(absolute);

</style>
