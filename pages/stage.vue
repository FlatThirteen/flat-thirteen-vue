<template lang="pug">
  .container
    backing
    stage(:showNextPower="true", :showMetronome="showMetronome")
    .bottom-controls
      .auto
        .icon(@click="setAuto(0)") o
        | :{{ autoMax }}
      .backing
        backing-button.button(:level="hasBacking ? 1 : 0",
            @click.native="$refs.composer.toggle()")
        composer(ref="composer", :show="true")
      metronome.metronome.button(:disabled="!showMetronome",
          @click.native="toggleMetronome()")
      .points(v-if="goalNoteCount") {{ basePoints }}
        .info ({{ goalCount }} {{ playCount }})

</template>

<script>
  import { mapGetters } from 'vuex';

  import Backing from '~/components/backing.component';
  import BackingButton from '~/components/backing-button.component';
  import Composer from '~/components/composer.component';
  import Metronome from '~/components/metronome.component';
  import Stage from '~/components/stage.component';

  import Sound from '~/common/sound/sound';

  export default {
    components: {
      'backing': Backing,
      'backing-button': BackingButton,
      'composer': Composer,
      'metronome': Metronome,
      'stage': Stage
    },
    head: {
      title: 'Flat Thirteen | Stage'
    },
    layout: 'debug',
    data() {
      return {
        pulseBeat: '1111',
        surfaces: [
          { soundByKey: { q: 'snare', a: 'kick' } },
        ],
        showMetronome: false
      }
    },
    mounted() {
      this.setAuto(0);
    },
    methods: {
      setAuto(autoMax) {
        if (this.active) {
          this.$store.dispatch('stage/clear');
        }
        let notes = _.join(_.fill(Array(this.numBeats - 1), 'K'), '|');
        this.$store.dispatch('stage/initialize', { autoMax,
          goal: [{ type: 'drums', notes }]
        });
      },
      toggleMetronome() {
        this.showMetronome = !this.showMetronome;
        Sound.click.play('+0.1', { variation: this.showMetronome ? 'heavy' : 'normal'});
      }
    },
    computed: {
      ...mapGetters({
        keyDown: 'keyDown',
        goalNoteCount: 'phrase/goalNoteCount',
        hasBacking: 'phrase/hasBacking',
        autoMax: 'stage/autoMax',
        goalCount: 'stage/goalCount',
        playCount: 'stage/playCount',
        basePoints: 'stage/basePoints',
        active: 'transport/active',
        numBeats: 'transport/numBeats'
      })
    },
    watch: {
      keyDown(key) {
        if (_.includes('0123', key)) {
          this.setAuto(_.toNumber(key));
        }
      },
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

  .bottom-controls
    posit(fixed, x, 0, 0, 0)
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    user-select: none;

    .auto, .backing
      font-size: 40px;
      font-weight: bold;
      margin: 5px 10px;

    .auto .icon
      color: primary-blue;
      display: inline-block;

    .backing
      color: lightgrey;

      .button
        transform: translateY(6px);
        vertical-align: bottom;

    .metronome
      margin-bottom: 1px;

    .points
      color: active-blue;
      font-size: 40px;
      font-weight: 600;

      .info
        color: gray;
        display: inline-block;


</style>
