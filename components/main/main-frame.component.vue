<template lang="pug">
  corner-frame(:totalPoints="points", :totalStars="totalStars",
      :hideTop="lessonDone", @hint="hint = $event")
    composer(ref="composer")
    lesson-builder(ref="lessonBuilder")
    transition(name="lesson-container")
      curriculum(v-if="!pulseBeat", key="choose", :scrollTop="scrollTop", :hint="hint",
          @click="onLesson($event)")
        slot(name="curriculum")
      finale.finale(v-else-if="lessonDone", key="finale", :stages="stages", :bonusStage="bonus",
          :style="transformOrigin", @finish="clearLesson($event)")
      .lesson-container(v-else, key="stage", :style="transformOrigin")
        backing
        stage(:goal="stageGoal", :stage="stageIndex", :intensity="level.intensity", :tempo="tempo",
            @basePoints="stagePoints = $event", @complete="nextStage($event)")
        quit-button(@click="clearLesson()", :creep="willCreep")
    slot(name="help", slot="bottom-left")
      .help
</template>

<script>
  import { mapActions, mapGetters } from 'vuex';

  import GameAnalytics from '~/common/game-analytics';

  import Backing from '~/components/backing.component';
  import Composer from '~/components/composer.component';
  import CornerFrame from '~/components/corner-frame.component';
  import Curriculum from '~/components/curriculum/curriculum.component';
  import Finale from '~/components/finale.component';
  import LessonBuilder from '~/components/lesson-builder.component';
  import QuitButton from '~/components/quit-button.component';
  import Stage from '~/components/stage/stage.component';

  export default {
    components: {
      'backing': Backing,
      'composer': Composer,
      'corner-frame': CornerFrame,
      'curriculum': Curriculum,
      'finale': Finale,
      'lesson-builder': LessonBuilder,
      'quit-button': QuitButton,
      'stage': Stage,
    },
    provide() {
      return { getComposer: () => this.$refs.composer };
    },
    props: {
      bonus: Boolean
    },
    data() {
      return {
        pulseBeat: null,
        stagePoints: 0,
        stages: [],
        hint: null,
        scrollTop: 0,
        transformOrigin: {}
      };
    },
    destroyed() {
      this.setStages();
    },
    methods: {
      onLesson({pulseBeat, x, y, scrollTop}) {
        this.scrollTop = scrollTop;
        this.transformOrigin = {
          transformOrigin: x + 'px ' + (y - scrollTop) + 'px'
        };
        this.update({ pulseBeat, layout: this.layout, clear: true });
        let lessonScore = this.displayScores[pulseBeat];
        this.setStages({ pulseBeat,
          stages: this.$refs.lessonBuilder.build(lessonScore),
        });
        this.$refs.composer.set(_.defaults({ pulseBeat,
          stars: lessonScore.stars || []
        }, this.level));
        this.pulseBeat = pulseBeat;
      },
      nextStage(points) {
        this.stages.push({ phrase: this.stageGoal, points });
        this.$store.dispatch('progress/nextStage');
      },
      clearLesson(points) {
        console.assert(this.pulseBeat);
        console.assert(this.stagePoints);
        if (!points) {
          GameAnalytics.fail(this.stagePoints);
        }
        if (points || this.wlllCreep) {
          this.addScore({
            pulseBeat: this.pulseBeat,
            score: {base: points, star: points === 500}
          });
        }
        this.pulseBeat = null;
        this.stages = [];
        this.setStages();
      },
      ...mapActions({
        update: 'player/update',
        addScore: 'progress/addScore',
        setStages: 'progress/setStages'
      })
    },
    computed: {
      willCreep() {
        return this.stagePoints < 100 || _.some(this.stages, stage => stage.points < 100);
      },
      points() {
        return this.totalPoints + _.sumBy(this.stages, 'points');
      },
      ...mapGetters({
        stageGoal: 'progress/stageGoal',
        stageIndex: 'progress/stageIndex',
        lessonDone: 'progress/lessonDone',
        level: 'progress/level',
        layout: 'progress/layout',
        tempo: 'progress/tempo',
        displayScores: 'progress/displayScores',
        totalPoints: 'progress/totalPoints',
        totalStars: 'progress/totalStars'
      })
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  .lesson-container
    posit(absolute);

    &-enter-active, &-leave-active
      transition: all 500ms;

    &-enter, &-leave-to
      opacity: 0;

    &-enter.lesson-container, &-leave-to.finale
      transform: scale(.1);
      opacity: 0.5;

    &-enter.finale
      transform: translateX(100%);
</style>
