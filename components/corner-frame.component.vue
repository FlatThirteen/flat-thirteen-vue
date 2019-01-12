<template lang="pug">
  .frame
    slot
    transition(name="top")
      .top(v-show="!hideTop")
        transition(name="boing")
          backing-button.left(v-if="showBacking || hint.backing", :backing="backing", :throttle="500",
              :penalty="penalty.backing > 0 && level.backing === penalty.backing", :hint="hint.backing",
              :class="{weenie: weenie.backing}", @click="$store.dispatch('progress/backing')",
              @mouseenter.native="!showBacking && onHint('backing')", @mouseleave.native="onHint()")
        power-backing(ref="backing", @click="$store.dispatch('progress/next', 'backing')")
        transition(name="boing")
          tempo-control.right(v-if="minTempo < maxTempo || hint.tempo", :tempo="tempo",
              :min="minTempo", :max="maxTempo", :weenie="weenie.tempo", :throttle="500",
              :penalty="level.tempo === penalty.tempo", :hint="hint.tempo",
              @tempo="$store.dispatch('progress/tempo', $event)",
              @mouseenter.native="minTempo === maxTempo && onHint('tempo')", @mouseleave.native="onHint()")
        power-tempo(ref="tempo", @click="$store.dispatch('progress/next', 'tempo')")
    .bottom
      .left: slot(name="bottom-left")
      .right
        transition(name="slide"): .stars(v-if="totalStars")
          star.star(:class="{highlight: activeHint === 'backing'}")
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
      hideTop: Boolean
    },
    data() {
      return {
        showPoints: 0,
        activeHint: null
      }
    },
    methods: {
      onHint(type) {
        this.activeHint = type;
        this.$emit('hint', type && this.hint[type] ? type : null);
      }
    },
    computed: {
      hint() {
        return !this.lessonName && {
          backing: !this.showBacking && this.level.auto > 1,
          tempo: this.minTempo === this.maxTempo && this.power.notes >= 8
        };
      },
      showNextBacking() {
        return !this.lessonName && !!this.next.backing && this.level.auto > 1 &&
            this.totalPoints >= this.nextPoints && this.totalStars >= 6;
      },
      showNextTempo() {
        return !this.lessonName && !!this.next.tempo && this.tempo === this.maxTempo &&
            this.rowsWithStars >= 5 && this.totalPoints >= this.nextPoints;
      },
      ...mapGetters({
        lessonName: 'progress/lessonName',
        level: 'progress/level',
        power: 'progress/power',
        next: 'progress/next',
        weenie: 'progress/weenie',
        penalty: 'progress/penalty',
        backing: 'progress/backing',
        showBacking: 'progress/showBacking',
        tempo: 'progress/tempo',
        minTempo: 'progress/minTempo',
        maxTempo: 'progress/maxTempo',
        rowsWithStars: 'progress/rowsWithStars',
        nextPoints: 'progress/nextPoints',
        paused: 'transport/paused'
      })
    },
    watch: {
      backing(backing) {
        if (this.paused) {
          Sound.playSequence('sawtooth6', backing === 'bass' ? ['A1', 'A2'] : ['A1'], '32n');
        }
      },
      tempo(tempo, oldTempo) {
        Sound.click.play('+0', { variation: tempo > oldTempo ? 'normal' : 'heavy' });
        Sound.click.play('+16n', { variation: tempo > oldTempo ? 'heavy' : 'normal' });
      },
      showNextBacking(showNextBacking) {
        if (showNextBacking) {
          this.$refs.backing.appear(this.next.backing);
        }
      },
      showNextTempo(showNextTempo) {
        if (showNextTempo) {
          this.$refs.tempo.appear(this.next.tempo);
        }
      },
      lessonName(lessonName) {
        if (lessonName) {
          this.$refs.backing.disappear();
          this.$refs.tempo.disappear();
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

    &-enter-active, &-leave-active
      transition: all 250ms;

    &-enter, &-leave-to
      opacity: 0;

  .bottom
    posit(fixed, x, 0, 0, 0);
    height: 0;

    .left, .right
      bottom: 0;
      margin: 5px 10px;

  .left, .right
    filter: drop-shadow(0 0 4px white);
    text-shadow: 0 0 5px white;

  .left
    posit(absolute, x, x, x, 0);

  .right
    posit(absolute, x, 0, x, x);
    text-align: right;

  .points, .stars
    color: active-blue;
    font-size: 40px;
    font-weight: 600;

  .star
    transition: all 250ms ease-in-out;

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
