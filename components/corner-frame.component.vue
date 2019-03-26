<template lang="pug">
  .corner-frame(:style="{backgroundColor: power.notes && bgIntensity}")
    slot
    transition(name="top")
      .top.scale(v-show="!hideTop", :class="scaleClass")
        transition(name="fade")
          level-control.left(v-if="!lessonName", :level="level.intensity", :max="power.intensity",
              @level="$store.dispatch('progress/intensity', $event)")
            intensity-icon.intensity(:level="level.intensity", :color="fgIntensity",
                @mouseenter.native="level.intensity === power.intensity && onHint('intensity')",
                @mouseleave.native="onHint()")
        power-intensity(ref="intensity", @click="$store.dispatch('progress/next', 'intensity')")
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
          star.star(color="black", :class="{highlight: activeHint === 'intensity'}")
          span {{ totalStars }}
        transition(name="slide"): .points(v-if="showPoints") {{ showPoints | floor }}
</template>

<script>
  import { TweenMax } from 'gsap';
  import { mapGetters } from 'vuex';

  import Sound from '~/common/sound/sound';

  import IntensityIcon from '~/components/icon/intensity-icon.component';
  import LevelControl from '~/components/level-control.component';
  import PowerIntensity from '~/components/power/power-intensity.component';
  import PowerTempo from '~/components/power/power-tempo.component';
  import Star from '~/components/star.component';
  import TempoControl from '~/components/tempo-control.component';

  export default {
    components: {
      'intensity-icon': IntensityIcon,
      'level-control': LevelControl,
      'power-intensity': PowerIntensity,
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
        this.activeHint = this.next[type] && type;
        this.$emit('hint', this.next[type] && this.hint[type] ? type : null);
      }
    },
    computed: {
      hint() {
        return !this.lessonName && {
          tempo: this.minTempo === this.maxTempo && this.power.notes >= 8
        };
      },
      showNextIntensity() {
        return !this.lessonName && this.power.notes > 4 &&
            this.level.intensity === this.next.intensity - 1 &&
            this.starsCountForIntensity >= 2;
      },
      showNextTempo() {
        return !this.lessonName && !!this.next.tempo && this.tempo === this.maxTempo &&
            this.rowsWithStars >= 5 && this.totalPoints >= this.nextPoints;
      },
      ...mapGetters({
        lessonName: 'progress/lessonName',
        power: 'progress/power',
        level: 'progress/level',
        next: 'progress/next',
        weenie: 'progress/weenie',
        penalty: 'progress/penalty',
        bgIntensity: 'progress/bgIntensity',
        fgIntensity: 'progress/fgIntensity',
        tempo: 'progress/tempo',
        minTempo: 'progress/minTempo',
        maxTempo: 'progress/maxTempo',
        scaleClass: 'progress/scaleClass',
        starsCountForIntensity: 'progress/starsCountForIntensity',
        rowsWithStars: 'progress/rowsWithStars',
        nextPoints: 'progress/nextPoints'
      })
    },
    watch: {
      'level.intensity'(intensity, oldIntensity) {
        Sound.toggle(intensity > oldIntensity);
      },
      tempo(tempo, oldTempo) {
        Sound.toggle(tempo > oldTempo);
      },
      showNextIntensity(showNextIntensity) {
        if (showNextIntensity) {
          this.$refs.intensity.appear(this.next.intensity);
        }
      },
      showNextTempo(showNextTempo) {
        if (showNextTempo) {
          this.$refs.tempo.appear(this.next.tempo);
        }
      },
      lessonName(lessonName) {
        if (lessonName) {
          this.$refs.intensity.disappear();
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
  @import "~assets/stylus/scale.styl"
  @import "~assets/stylus/weenie.styl"

  .corner-frame
    posit(absolute);

  .top
    posit(absolute, 0, 0, x, 0);
    height: 0;
    transform-origin: top left;


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

    .right
      pointer-events: none;

  .left, .right
    filter: drop-shadow(0 0 4px white);
    text-shadow: 0 0 5px white;

  .left
    posit(absolute, x, x, x, 0);

  .right
    posit(absolute, x, 0, x, x);
    text-align: right;

  .intensity, .points, .stars
    color: active-blue;
    font-size: 40px;
    font-weight: 600;

  .star
    transition: all 250ms ease-in-out;

  .fade-enter-active, .fade-leave-active
    transition: opacity 500ms;

  .fade-enter, .fade-leave-to
    opacity: 0;

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
