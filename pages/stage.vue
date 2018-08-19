<template lang="pug">
  .container
    backing
    stage(:showNextAuto="true", :tempo="tempo", @basePoints="basePoints = $event")
    .top
      .backing.left
        backing-button.button(:level="hasBacking ? 1 : 0",
            @click.native="toggleBackingLevel()")
        composer(ref="composer", :show="true")
      tempo-control.right(:tempo.sync="tempo", :min="60", :max="240", v-on="$listeners")
    .bottom
      .auto.left
        .icon(@click="setAuto(false)") o
        span(@click="setAuto(next.auto)") :{{ power.auto }}
      .points.right {{ basePoints }}
</template>

<script>
  import { mapGetters } from 'vuex';

  import Backing from '~/components/backing.component';
  import BackingButton from '~/components/backing-button.component';
  import Composer from '~/components/composer.component';
  import Stage from '~/components/stage.component';
  import TempoControl from '~/components/tempo-control.component';

  import Sound from '~/common/sound/sound';

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
          { soundByKey: { q: 'snare', a: 'kick' } },
        ],
        tempo: 120,
        basePoints: 0
      }
    },
    mounted() {
      this.setAuto(false);
    },
    methods: {
      setAuto(next) {
        if (this.active) {
          this.$store.dispatch('stage/clear');
        }
        if (next) {
          this.$store.dispatch('progress/next', 'auto');
        } else {
          this.$store.dispatch('progress/reset');
        }
        let notes = _.join(_.fill(Array(this.numBeats - 1), 'K'), '|');
        this.$store.dispatch('stage/initialize', {
          autoLevel: next ? undefined : 0,
          goal: [{ type: 'drums', notes }]
        });
      },
      toggleBackingLevel() {
        if (this.hasBacking) {
          this.$refs.composer.clear();
        } else {
          this.$refs.composer.reset();
        }
      }
    },
    computed: {
      ...mapGetters({
        keyDown: 'keyDown',
        goalNoteCount: 'phrase/goalNoteCount',
        hasBacking: 'phrase/hasBacking',
        power: 'progress/power',
        next: 'progress/next',
        active: 'transport/active',
        numBeats: 'transport/numBeats'
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
    position: relative;
    user-select: none;

  .top
    posit(absolute, 0, 0, x, 0)
    height: 0;

    .left, .right
      top: 0;
      margin: 20px;

  .bottom
    posit(fixed, x, 0, 0, 0)
    height: 0;

    .left, .right
      bottom: 0;
      background-color: white;
      box-shadow: 0 0 25px 15px white;
      margin: 5px 10px;

  .left
    posit(absolute, x, x, x, 0);

  .right
    posit(absolute, x, 0, x, x);
    text-align: right;

  .auto, .backing
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
