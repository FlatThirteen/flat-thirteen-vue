<template lang="pug">
  corner-frame(:totalPoints="totalPoints", :totalStars="totalStars",
      :hideTop="!!finaleStages.length", @hint="hint = $event")
    curriculum(:hint="hint", :debug="true", :scrollTop="scrollTop", @click="onLesson($event)")
    .config(v-if="!pulseBeat")
      .button(@click="max()") o
    transition(name="lesson-container")
      .lesson-container(v-show="pulseBeat", :style="lessonContainerStyle")
        transition(name="finale", mode="out-in")
          .finale(v-if="finaleStages.length")
            finale(:stages="finaleStages", :bonusStage="true", @finish="finale($event)")
            quit-button(@click="redoLesson()")
          .lesson(v-else)
            lesson-builder(ref="lessonBuilder", :debug="true")
            .points
              .button(@click="finishLesson()") +
              input(v-for="(points, i) in pointsByStage", type="number",
                  v-model.number="pointsByStage[i]", :class="{invalid: invalidPoints[i]}")
              star.button(:hollow="hollowStar", @click.native="onStar()")
            quit-button(@click="exitLesson()")
</template>

<script>
  import { mapGetters } from 'vuex';

  import CornerFrame from '~/components/corner-frame.component';
  import Curriculum from '~/components/curriculum/curriculum.component';
  import Finale from '~/components/finale.component';
  import LessonBuilder from '~/components/lesson-builder.component';
  import QuitButton from '~/components/quit-button.component';
  import Star from '~/components/star.component';

  const MAX_POINTS = 100;

  export default {
    components: {
      'corner-frame': CornerFrame,
      'curriculum': Curriculum,
      'finale': Finale,
      'lesson-builder': LessonBuilder,
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
        transformOrigin: null
      };
    },
    methods: {
      max() {
        this.$store.dispatch('progress/initialize', { max: !this.power.notes});
      },
      onStar() {
        if (this.hollowStar) {
          this.pointsByStage = _.times(4, _.constant(MAX_POINTS));
        } else {
          this.finale(500);
        }
      },
      onLesson({pulseBeat, x, y, scrollTop}) {
        this.pulseBeat = pulseBeat;
        this.scrollTop = scrollTop;
        this.transformOrigin = x + 'px ' + (y - scrollTop) + 'px';
        this.$store.dispatch('player/update', { pulseBeat,
          layout: this.layout,
          clear: true
        });
        this.$store.dispatch('progress/setStages', { pulseBeat });
        this.buildLesson();
      },
      buildLesson() {
        this.$refs.lessonBuilder.build(this.displayScores[this.pulseBeat]);
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
        this.$store.dispatch('progress/addScore', {
          pulseBeat: this.pulseBeat,
          score: { base: points, star: points === 500 }
        });
        this.exitLesson();
      }
    },
    computed: {
      invalidPoints() {
        return _.map(this.pointsByStage, points => points < 5 || points > MAX_POINTS);
      },
      hollowStar() {
        return !_.every(this.pointsByStage, points => points === MAX_POINTS);
      },
      lessonContainerStyle() {
        return {
          backgroundColor: this.bgIntensity,
          transformOrigin: this.transformOrigin
        };
      },
      ...mapGetters({
        power: 'progress/power',
        bgIntensity: 'progress/bgIntensity',
        layout: 'progress/layout',
        displayScores: 'progress/displayScores',
        totalPoints: 'progress/totalPoints',
        totalStars: 'progress/totalStars'
      })
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
</style>
