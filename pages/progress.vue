<template lang="pug">
  corner-frame(:totalPoints="totalPoints", :totalStars="totalStars",
      :hideTop="!!finaleStages.length", @hint="hint = $event")
    curriculum(:hint="hint", :debug="true", @mousedown="onLesson($event)")
    .points(v-if="!pulseBeat")
      .button(@click="max()") o
    transition(name="lesson-container")
      .lesson-container(v-show="pulseBeat")
        transition(name="finale", mode="out-in")
          .finale(v-if="finaleStages.length")
            finale(:stages="finaleStages", @finish="finale($event)")
            quit-button(@click="redoLesson()")
          .lesson(v-else)
            lesson-builder(ref="lessonBuilder", :debug="true")
            .power
              power-auto(ref="auto", @click="$store.dispatch('progress/next', 'auto')")
            .points
              .button(@click="finishLesson()") +
              input(v-for="(points, i) in pointsByStage", type="number",
                  v-model.number="pointsByStage[i]", :class="{invalid: invalidPoints[i]}",
                  @mouseover="i > 1 && showNextAuto()")
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

  const MAX_POINTS = 100;

  export default {
    components: {
      'corner-frame': CornerFrame,
      'curriculum': Curriculum,
      'finale': Finale,
      'lesson-builder': LessonBuilder,
      'power-auto': PowerAuto,
      'quit-button': QuitButton
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
        finaleStages: []
      };
    },
    methods: {
      max() {
        this.$store.dispatch('progress/initialize', { max: !this.power.notes});
        this.$refs.auto.disappear();
      },
      onLesson(pulseBeat) {
        this.pulseBeat = pulseBeat;
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
          amount: { base: points }
        });
        this.exitLesson();
      },
      showNextAuto() {
        if (this.next.auto && this.pointsByStage[0] === 100 && this.pointsByStage[1] === 100) {
          this.$refs.auto.appear(this.next.auto);
        }
      }
    },
    computed: {
      invalidPoints() {
        return _.map(this.pointsByStage, points => points < 5 || points > MAX_POINTS);
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
    }
  }

</script>

<style scoped lang="stylus" type="text/stylus">
  .container
    position: absolute;
    user-select: none;

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
    posit(fixed, x, x, 0, 0);
    font-size: 40px;
    font-weight: 600;
    margin-left: 5px;

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

  .power
    posit(fixed, x, 100px, 0, 250px);
    height: 100px;
</style>
