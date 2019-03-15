<template lang="pug">
  .container(:style="{backgroundColor: bgIntensity}")
    backing
    stage(ref="stage", :goal="goal", :intensity="intensityLevel", :tempo="tempo",
        @basePoints="basePoints = $event", @complete="$refs.stage.start()")
    .top
      .intensity.left
        level-control.control(:level="intensityLevel", :max="4", @level="setIntensity($event)")
          intensity-icon(:level="intensityLevel")
        span(v-show="hasBacking") =
        composer(ref="composer", :show="hasBacking")
      tempo-control.right(:tempo="tempo", @tempo="tempo = $event", :min="60", :max="240")
    .bottom
      .left
      .middle
        .pulses-input
          input(type="text", v-model="pulseBeat", placeholder="# pulses", @keydown.stop="")
      .right
        .victory
          span(@click="onVictory()") V
          span(@click="setVictory()") {{ victoryLevel }}
        .points(@click="onVictory(true)") {{ basePoints }}
</template>

<script>
  import { mapGetters } from 'vuex';

  import { bgIntensity } from "~/common/colors";

  import Backing from '~/components/backing.component';
  import Composer from '~/components/composer.component';
  import IntensityIcon from '~/components/icon/intensity-icon.component';
  import LevelControl from '~/components/level-control.component';
  import Stage from '~/components/stage/stage.component';
  import TempoControl from '~/components/tempo-control.component';

  export default {
    components: {
      'backing': Backing,
      'composer': Composer,
      'intensity-icon': IntensityIcon,
      'level-control': LevelControl,
      'stage': Stage,
      'tempo-control': TempoControl
    },
    head: {
      title: 'Flat Thirteen | Stage'
    },
    layout: 'debug',
    data() {
      return {
        pulseBeat: '1111',
        intensityLevel: 0,
        layout: [
          { noteByKey: { q: 'snare', a: 'kick' } },
        ],
        tempo: 120,
        basePoints: 0,
        victoryLevel: 10
      }
    },
    mounted() {
      this.$refs.stage.start();
    },
    methods: {
      setIntensity(level) {
        this.intensityLevel = level;
        if (level > 2) {
          this.$refs.composer.reset();
        } else {
          this.$refs.composer.clear();
        }
      },
      setVictory(level = this.victoryLevel > 1 ? this.victoryLevel - 1 : 10) {
        this.victoryLevel = level;
      },
      onVictory(clear) {
        this.$refs.stage.setVictory(clear ? 0 : this.victoryLevel);
      }
    },
    computed: {
      bgIntensity() {
        return bgIntensity(this.intensityLevel);
      },
      goal() {
        return !this.numBeats ? null : [{
          type: 'drums',
          notes: _.join(_.times(this.numBeats - 1, i => i % 2 ? 'S' : 'K'), '|')
        }];
      },
      ...mapGetters({
        hasBacking: 'phrase/hasBacking',
        numBeats: 'player/numBeats'
      })
    },
    watch: {
      pulseBeat: {
        immediate: true,
        handler(pulseBeat) {
          this.$store.dispatch('player/update', { pulseBeat, layout: this.layout });
        }
      }
    }
  }

</script>

<style scoped lang="stylus" type="text/stylus">
  .container
    posit(absolute);
    user-select: none;
    display: flex;
    flex-direction: column;
    justify-content: center;

  .top
    posit(absolute, 0, 0, x, 0)
    height: 0;

    .left, .right
      posit(absolute, 0, x, x, x);
      margin: 20px;

    .right
      posit(absolute, x, 0, x, x);

  .bottom
    posit(fixed, x, 0, 0, 0)
    display: flex;
    justify-content: space-between;
    align-items: flex-end;

    .left, .right
      margin: 5px 10px;
      min-width: 90px;

    input
      background: transparent;
      border: none;
      margin: 0;
      text-align: center;

      &::placeholder
        color: primary-red;
        font-size: 14px;

      &:focus
        outline: none;

  .right
    text-align: right;

  .intensity, .victory
    font-size: 40px;
    font-weight: bold;

  .control
    vertical-align: middle;

  .points
    color: active-blue;
    font-size: 40px;
    font-weight: 600;
</style>
