<template lang="pug">
  corner-frame(:totalPoints="totalPoints", :totalStars="totalStars",
      :hideTop="!!finaleStages.length", @hint="hint = $event")
    curriculum(:hint="hint", :debug="true", :scrollTop="scrollTop", @click="onLesson($event)")
    .config(v-if="!pulseBeat")
      .button(@click="max()") o
    transition(name="lesson-container")
      .lesson-container(v-show="pulseBeat", :style="transformOrigin")
        transition(name="finale", mode="out-in")
          .finale(v-if="finaleStages.length")
            finale(:stages="finaleStages", :bonusStage="true", @finish="finale($event)")
            quit-button(@click="redoLesson()")
          .lesson(v-else)
            lesson-builder(ref="lessonBuilder", :debug="true")
            .points
              .button(@click="finishLesson()") +
              input(v-for="(points, i) in pointsByStage", type="number",
                  v-model.number="pointsByStage[i]", :class="{invalid: invalidPoints[i]}",
                  @mouseover="i > 1 && showNextAuto()")
              star.button(:hollow="hollow", @click.native="onStar()")
              .power
                power-auto(ref="auto", @click="$store.dispatch('progress/next', 'auto')")
            quit-button(@click="exitLesson()")
</template>

<script>
  import { mapGetters } from 'vuex';

  import CornerFrame from '~/components/corner-frame.component';
  import Curriculum from '~/components/curriculum/curriculum.component';
  import Finale from '~/components/finale.component';
  import LessonBuilder from '~/components/lesson-builder.component';
  import PowerAuto from '~/components/power/power-auto.component';
  import QuitButton from '~/components/quit-button.component';
  import Star from '~/components/star.component';

  const MAX_POINTS = 100;

  export default {
    components: {
      'corner-frame': CornerFrame,
      'curriculum': Curriculum,
      'finale': Finale,
      'lesson-builder': LessonBuilder,
      'power-auto': PowerAuto,
      'quit-button': QuitButton,
      'star': Star
    },
    head: {
      title: 'Flat Thirteen | Progress'
    },
    layout: 'debug',
    data() {
      return {
        hint: null,
        pulseBeat: null,
        pointsByStage: _.times(4, _.constant(MAX_POINTS)),
        finaleStages: [],
        scrollTop: 0,
        transformOrigin: {}
      };
    },
    methods: {
      max() {
        this.$store.dispatch('progress/initialize', { max: !this.power.notes});
        this.$refs.auto.disappear();
      },
      onStar() {
        if (this.hollow) {
          this.pointsByStage = _.times(4, _.constant(MAX_POINTS));
        } else {
          this.finale(500);
        }
      },
      onLesson({pulseBeat, x, y, scrollTop}) {
        this.pulseBeat = pulseBeat;
        this.scrollTop = scrollTop;
        this.transformOrigin = {
          transformOrigin: x + 'px ' + (y - scrollTop) + 'px'
        };
        this.$store.dispatch('player/update', { pulseBeat,
          layout: this.layout,
          clear: true
        });
        this.$store.dispatch('progress/setStages', {
          name: this.level.layout + '-' + pulseBeat
        });
        this.buildLesson();
      },
      buildLesson() {
        let finished = this.pointsByPulseBeat[this.pulseBeat].length;
        this.$refs.lessonBuilder.build(finished);
      },
      finishLesson() {
        let stages = this.$refs.lessonBuilder.stages;
        if (!_.some(this.invalidPoints) && stages.length >= this.pointsByStage.length) {
          this.finaleStages = _.map(this.pointsByStage, (points, i) => ({ points,
            phrase: stages[i]
          }));
        }
      },
      redoLesson() {
        this.finaleStages = [];
        // Wait for nextTick so that $refs are updated again
        this.$nextTick(this.buildLesson);
      },
      exitLesson() {
        this.pulseBeat = null;
        this.finaleStages = [];
        this.$store.dispatch('progress/setStages');
      },
      finale(points) {
        this.$store.dispatch('progress/addPoints', {
          pulseBeat: this.pulseBeat,
          amount: { base: points, star: points === 500 }
        });
        this.exitLesson();
      },
      showNextAuto() {
        if (this.next.auto && !this.hollow) {
          this.$refs.auto.appear(this.next.auto);
        }
      }
    },
    computed: {
      invalidPoints() {
        return _.map(this.pointsByStage, points => points < 5 || points > MAX_POINTS);
      },
      hollow() {
        return !_.every(this.pointsByStage, points => points === MAX_POINTS);
      },
      ...mapGetters({
        power: 'progress/power',
        next: 'progress/next',
        level: 'progress/level',
        layout: 'progress/layout',
        pointsByPulseBeat: 'progress/pointsByPulseBeat',
        totalPoints: 'progress/totalPoints',
        totalStars: 'progress/totalStars'
      })
    },
    watch: {
      hollow(hollow) {
        if (hollow) {
          this.$refs.auto.disappear();
        }
      }
    }
  }

</script>

<style scoped lang="stylus" type="text/stylus">
  .container
    position: absolute;
    user-select: none;

  .config
    posit(fixed, x, x, 0, 5px);
    font-size: 40px;
    font-weight: 600;
    color: primary-blue;

  .lesson-container-enter-active, .lesson-container-leave-active, .finale-enter-active, .finale-leave-active
    transition: all 500ms;

  .lesson-container-enter, .lesson-container-leave-to
    transform: scale(.1);
    opacity: 0.5;

  .finale-enter
    opacity: 0;
    transform: translateX(100%);

  .finale-leave-to
    opacity: 0;
    transform: translateX(-100%);

  .lesson-container
    posit(absolute);
    background-color: white;
    overflow: scroll;

  .points
    posit(fixed, x, 100px, 0, 5px);
    font-size: 40px;
    font-weight: 600;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;

    input
      background-color: transparent;
      border: none;
      color: active-blue;
      font-size: 40px;
      font-weight: 600;
      vertical-align: text-top;
      width: 100px;
      filter: drop-shadow(0 0 4px white);
      text-shadow: 0 0 5px white;

      &.invalid
        color: primary-red;

      &:focus
        outline: none;

    .button
      vertical-align: baseline;

  .power
    height: 0px;
    flex-grow: 1;
</style>
