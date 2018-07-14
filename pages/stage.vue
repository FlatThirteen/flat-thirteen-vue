<template lang="pug">
  .container
    stage(:showNextPower="true")
    .bottom-controls
      .auto
        .icon(@click="setAuto(0)") o
        | :{{ autoMax }}
      .points(v-if="goalNoteCount") {{ basePoints }}
        .info ({{ goalCount }} {{ playCount }})

</template>

<script>
  import { mapGetters } from 'vuex';

  import Stage from '~/components/stage.component';

  export default {
    components: {
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
        ]
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
      }
    },
    computed: {
      ...mapGetters({
        keyDown: 'keyDown',
        goalNoteCount: 'phrase/goalNoteCount',
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

    .auto
      font-size: 40px;
      font-weight: bold;
      margin: 5px 10px;

      .icon
        display: inline-block;
        color: primary-blue;
        line-height: 30px;

    .points
      color: active-blue;
      font-size: 40px;
      font-weight: 600;

      .info
        color: gray;
        display: inline-block;


</style>
