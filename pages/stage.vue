<template lang="pug">
  .container
    backing
    stage(ref="stage", :goal="goal", :showNextAuto="true", :tempo="tempo",
        @basePoints="basePoints = $event", @complete="$refs.stage.start()")
    .top
      .backing.left
        backing-button.button(:backing="hasBacking ? 'bass' : 'none'",
            @click="toggleBackingLevel()")
        composer(ref="composer", :show="true")
      tempo-control.right(:tempo="tempo", @tempo="tempo = $event", :min="60", :max="240")
    .bottom
      .auto.left
        .icon(@click="setAuto(false)") o
        span(@click="setAuto(next.auto)") :{{ power.auto }}
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

  import Sound from '~/common/sound/sound';

  import Backing from '~/components/backing.component';
  import BackingButton from '~/components/backing-button.component';
  import Composer from '~/components/composer.component';
  import Stage from '~/components/stage/stage.component';
  import TempoControl from '~/components/tempo-control.component';

  export default {
    components: {
      'backing': Backing,
      'backing-button': BackingButton,
      'composer': Composer,
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
        layout: [
          { noteByKey: { q: 'snare', a: 'kick' } },
        ],
        tempo: 120,
        basePoints: 0,
        victoryLevel: 10
      }
    },
    created() {
      this.setAuto(false);
    },
    mounted() {
      this.$refs.stage.start();
    },
    methods: {
      setAuto(next) {
        if (next) {
          this.$store.dispatch('progress/next', 'auto');
        } else {
          this.$store.dispatch('progress/initialize');
        }
      },
      setVictory(level = this.victoryLevel > 1 ? this.victoryLevel - 1 : 10) {
        this.victoryLevel = level;
      },
      onVictory(clear) {
        this.$refs.stage.setVictory(clear ? 0 : this.victoryLevel);
      },
      toggleBackingLevel() {
        if (this.paused) {
          Sound.playSequence(this.$refs.composer.type, this.hasBacking ? ['A1'] : ['A1', 'A2'], '32n');
        }
        if (this.hasBacking) {
          this.$refs.composer.clear();
        } else {
          this.$refs.composer.reset();
        }
      }
    },
    computed: {
      goal() {
        return !this.numBeats ? null : [{
          type: 'drums',
          notes: _.join(_.times(this.numBeats - 1, i => i % 2 ? 'S' : 'K'), '|')
        }];
      },
      ...mapGetters({
        keyDown: 'keyDown',
        paused: 'transport/paused',
        hasBacking: 'phrase/hasBacking',
        power: 'progress/power',
        next: 'progress/next',
        numBeats: 'player/numBeats'
      })
    },
    watch: {
      keyDown(key) {
        if (key === 'o') {
          this.setAuto(this.next.auto);
        }
      },
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
      top: 0;
      margin: 20px;

    .right
      posit(absolute, x, 0, x, x);

  .bottom
    posit(fixed, x, 0, 0, 0)
    display: flex;
    justify-content: space-between;
    align-items: flex-end;

    .left, .right
      background-color: white;
      box-shadow: 0 0 25px 15px white;
      margin: 5px 10px;

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

  .auto, .backing, .victory
    font-size: 40px;
    font-weight: bold;

  .auto .icon
    color: primary-blue;
    display: inline-block;

  .backing
    color: lightgrey;
    margin-top: -10px;

    .composer
      transform: translateY(8px);

  .points
    color: active-blue;
    font-size: 40px;
    font-weight: 600;

  .info
    color: gray;
    font-size: 20px;
    font-weight: 600;

</style>
