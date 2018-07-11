<template lang="pug">
  .container
    stage
    .bottom-controls
      .points(v-if="goalNoteCount") {{ basePoints }}
        .info ({{ goalCount }} {{ playCount }})

      .toggle.auto.button(v-for="i in autoLevels", @click="setAuto(i)",
          :class="{active: autoMax >= i}") {{ i }}

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
        autoLevels: 'stage/autoLevels',
        goalCount: 'stage/goalCount',
        playCount: 'stage/playCount',
        basePoints: 'stage/basePoints',
        active: 'transport/active',
        numBeats: 'transport/numBeats'
      })
    },
    watch: {
      keyDown(key) {
        if (_.includes('012', key)) {
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

    .points
      posit(absolute, x, 0, 0, x)
      color: active-blue;
      font-size: 40px;
      font-weight: 600;

      .info
        color: gray;
        display: inline-block;

    .toggle
      display: inline-block;
      font-size: 40px;
      line-height: 60px;
      font-weight: bold;
      border-radius: 5px;
      border-width: 5px;

  toggle-color('.auto', primary-red);

</style>
