<template lang="pug">
  .frame
    slot
    .top
      transition(name="boing")
        backing-button.left.button(:level="mode.backing", v-if="power.backing",
            @click="$store.dispatch('progress/mode', {power: 'backing'})")
      power-backing(ref="backing", @click="$store.dispatch('progress/next', 'backing')")
      transition(name="boing")
        tempo-control.right(:tempo="tempo", :min="minTempo", :max="maxTempo",
            v-if="minTempo < maxTempo", @tempo="$store.dispatch('progress/tempo', $event)")
      power-tempo(ref="tempo", @click="$store.dispatch('progress/next', 'tempo')")
    .bottom
      .left: slot(name="bottom-left")
      .right
        transition(name="slide"): .stars(v-if="totalStars")
          star
          span {{ totalStars }}
        transition(name="slide"): .points(v-if="showPoints") {{ showPoints | floor }}
</template>

<script>
  import { TweenMax } from 'gsap';
  import { mapGetters } from 'vuex';

  import BackingButton from '~/components/backing-button.component';
  import PowerBacking from '~/components/power/power-backing.component';
  import PowerTempo from '~/components/power/power-tempo.component';
  import Star from '~/components/star.component';
  import TempoControl from '~/components/tempo-control.component';

  import { MAX_POINTS } from '~/store/progress';

  export default {
    components: {
      'backing-button': BackingButton,
      'power-backing': PowerBacking,
      'power-tempo': PowerTempo,
      'star': Star,
      'tempo-control': TempoControl
    },
    props: {
      totalPoints: Number,
      totalStars: Number,
    },
    data() {
      return {
        showPoints: 0
      }
    },
    computed: {
      showNextBacking() {
        return !!this.next.backing && this.mode.auto > 1 && _.every(this.playable)
      },
      showNextTempo() {
        return !!this.next.tempo && this.tempo === this.maxTempo && this.rowsWithStars >= 5;
      },
      ...mapGetters({
        power: 'progress/power',
        mode: 'progress/mode',
        next: 'progress/next',
        tempo: 'progress/tempo',
        minTempo: 'progress/minTempo',
        maxTempo: 'progress/maxTempo',
        pointsByPulseBeat: 'progress/pointsByPulseBeat',
        playable: 'progress/playable',
        rowsWithStars: 'progress/rowsWithStars'
      })
    },
    watch: {
      showNextBacking(showNextBacking) {
        if (showNextBacking) {
          this.$refs.backing.appear();
        }
      },
      showNextTempo(showNextTempo) {
        if (showNextTempo) {
          this.$refs.tempo.appear();
        }
      },
      totalPoints(totalPoints) {
        TweenMax.to(this.$data, this.showPoints ? .5 : 1, { showPoints: totalPoints });
      }
    }
  }

</script>

<style scoped lang="stylus" type="text/stylus">
  .frame
    posit(absolute);

  .top
    posit(absolute, 0, 0, x, 0);
    height: 0;

    .left, .right
      top: 0;
      margin: 20px;

  .bottom
    posit(fixed, x, 0, 0, 0);
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

  .points, .stars
    color: active-blue;
    font-size: 40px;
    font-weight: 600;

  .boing-enter-active
    transition: transform 300ms cubic-bezier(0,.37,.29,1.3);

  .boing-enter
    transform: scale(0);

  .slide-enter-active
    transition: transform 500ms cubic-bezier(0,.37,.29,1.3);

  .slide-enter
    transform: translateX(100px);
</style>
