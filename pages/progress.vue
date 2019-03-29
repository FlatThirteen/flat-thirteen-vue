<template lang="pug">
  corner-frame(:totalPoints="totalPoints", :totalStars="totalStars",
      :hideTop="!!finaleStages.length", @hint="hint = $event")
    curriculum(:hint="hint", :debug="true", :scrollTop="scrollTop", @click="onLesson($event)")
    composer(ref="composer")
    .config(v-if="!pulseBeat")
      .button(@click="max()") o
    transition(name="lesson-container")
      .lesson-container(v-if="pulseBeat", :style="lessonContainerStyle")
        mixer(:show="true")
        transition(name="finale", mode="out-in")
          .finale(v-if="finaleStages.length")
            finale(:stages="finaleStages", :bonusStage="true", @finish="finale($event)")
            quit-button(@click="redoLesson()")
          .lesson(v-else)
            lesson-builder(ref="lessonBuilder", :debug="true", @stars="overrideStars($event)")
            .points
              .button(@click="finishLesson()") +
              input(v-for="(points, i) in pointsByStage", type="number",
                  v-model.number="pointsByStage[i]", :class="{invalid: invalidPoints[i]}")
              star.button(:color="hollowStar ? null : 'black'", @click.native="onStar()")
            quit-button(@click="exitLesson()")
</template>

<script>
  import { mapActions, mapGetters } from 'vuex';

  import Composer from '~/components/composer.component';
  import CornerFrame from '~/components/corner-frame.component';
  import Curriculum from '~/components/curriculum/curriculum.component';
  import Finale from '~/components/finale.component';
  import LessonBuilder from '~/components/lesson-builder.component';
  import QuitButton from '~/components/quit-button.component';
  import Star from '~/components/star.component';
  import Mixer from '~/components/widget/mixer.component';

  const MAX_POINTS = 100;

  export default {
    components: {
      'composer': Composer,
      'corner-frame': CornerFrame,
      'curriculum': Curriculum,
      'finale': Finale,
      'lesson-builder': LessonBuilder,
      'quit-button': QuitButton,
      'star': Star,
      'mixer': Mixer
    },
    head: {
      title: 'Flat Thirteen | Progress'
    },
    layout: 'debug',
    provide() {
      return { getComposer: () => this.$refs.composer };
    },
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
      overrideStars(stars) {
        this.$refs.composer.setStage(_.defaults({ stars }, this.level));
      },
      onLesson({pulseBeat, x, y, scrollTop}) {
        this.pulseBeat = pulseBeat;
        this.scrollTop = scrollTop;
        this.transformOrigin = x + 'px ' + (y - scrollTop) + 'px';
        this.update({ pulseBeat, layout: this.layout, clear: true });
        this.$nextTick(() => { this.buildLesson(); });
      },
      buildLesson() {
        let lessonScore = this.displayScores[this.pulseBeat];
        this.setStages({
          pulseBeat: this.pulseBeat,
          stages: this.$refs.lessonBuilder.build(lessonScore)
        });
        this.$refs.composer.setStage(_.defaults({ stars: lessonScore.stars || [] }, this.level));
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
        this.setStages();
      },
      finale(points) {
        this.addScore({
          pulseBeat: this.pulseBeat,
          score: { base: points, star: points === 500 }
        });
        this.exitLesson();
      },
      ...mapActions({
        update: 'player/update',
        addScore: 'progress/addScore',
        setStages: 'progress/setStages'
      })
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
        level: 'progress/level',
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
