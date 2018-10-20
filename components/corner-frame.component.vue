<template lang="pug">
  .frame
    slot
    .top
      transition(name="boing")
        backing-button.left(v-if="showBacking", :backing="backing", :throttle="500",
            :class="{weenie: weenie.backing}", @click="$store.dispatch('progress/backing')")
      power-backing(ref="backing", @click="$store.dispatch('progress/next', 'backing')")
      transition(name="boing")
        tempo-control.right(v-if="minTempo < maxTempo", :tempo="tempo",
            :min="minTempo", :max="maxTempo", :weenie="weenie.tempo", :throttle="500",
            @tempo="$store.dispatch('progress/tempo', $event)")
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

  import Sound from '~/common/sound/sound';

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
        return !!this.next.backing && this.level.auto > 1 && _.every(this.playable) &&
            this.totalPoints >= this.nextPoints;
      },
      showNextTempo() {
        return !!this.next.tempo && this.tempo === this.maxTempo && this.rowsWithStars >= 5 &&
            this.totalPoints >= this.nextPoints;
      },
      ...mapGetters({
        level: 'progress/level',
        next: 'progress/next',
        weenie: 'progress/weenie',
        backing: 'progress/backing',
        showBacking: 'progress/showBacking',
        tempo: 'progress/tempo',
        minTempo: 'progress/minTempo',
        maxTempo: 'progress/maxTempo',
        playable: 'progress/playable',
        rowsWithStars: 'progress/rowsWithStars',
        nextPoints: 'progress/nextPoints'
      })
    },
    watch: {
      backing(backing) {
        Sound.playSequence('synth', backing === 'bass' ? ['A1', 'A2'] : ['A1'], '32n', undefined, 0.5);
      },
      tempo(tempo, oldTempo) {
        Sound.click.play('+0', { variation: tempo > oldTempo ? 'normal' : 'heavy' });
        Sound.click.play('+16n', { variation: tempo > oldTempo ? 'heavy' : 'normal' });
      },
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
  @import "~assets/stylus/weenie.styl"

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
    transition: transform 300ms cubic-bezier(0,.5,.5,1.5);

  .boing-leave-active
    transition: transform 300ms cubic-bezier(.5,-.5,1,.5);

  .boing-enter, .boing-leave-to
    transform: scale(0);

  .slide-enter-active
    transition: transform 500ms cubic-bezier(0,1,.5,2);

  .slide-enter
    transform: translateX(100px) scale(0);
</style>
