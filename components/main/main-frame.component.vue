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
        stage(:goal="stageGoal", :tempo="tempo", :showNextAuto="showNextAuto",
            @basePoints="stagePoints = $event", @complete="nextStage($event)")
        quit-button(@click="clearLesson()")
    slot(name="help", slot="bottom-left")
      .help
</template>

<script>
  import { TweenMax } from 'gsap';
  import { mapActions, mapGetters } from 'vuex';

  import Monotonic from '~/common/composer/monotonic';
  import Note from '~/common/core/note.model';
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
        this.setStages({
          stages: this.$refs.lessonBuilder.build(this.pointsByPulseBeat[pulseBeat].length),
          name: this.level.layout + '-' + pulseBeat
        });
        if (this.level.backing) {
          this.$refs.composer.reset();
        }
        this.pulseBeat = pulseBeat;
      },
      nextStage(points) {
        this.stages.push({ phrase: this.stageGoal, points });
        this.$store.dispatch('progress/nextStage');
        if (this.level.backing) {
          this.$refs.composer.updateRhythm();
        }
      },
      clearLesson(points) {
        console.assert(this.pulseBeat);
        console.assert(this.stagePoints);
        if (!points) {
          GameAnalytics.fail(this.stagePoints);
        }
        this.addPoints({
          pulseBeat: this.pulseBeat,
          amount: { base: points, star: points === (this.bonus ? 500 : 400) }
        });
        this.pulseBeat = null;
        this.stages = [];
        this.$refs.composer.clear();
        this.setStages();
      },
      ...mapActions({
        update: 'player/update',
        addPoints: 'progress/addPoints',
        setStages: 'progress/setStages'
      })
    },
    computed: {
      points() {
        return this.totalPoints + _.sumBy(this.stages, 'points');
      },
      showNextAuto() {
        return this.totalStars >= Math.pow(2, this.next.auto) && this.points >= this.nextPoints &&
            this.next.auto === this.level.auto + 1;
      },
      ...mapGetters({
        stageGoal: 'progress/stageGoal',
        lessonDone: 'progress/lessonDone',
        level: 'progress/level',
        next: 'progress/next',
        layout: 'progress/layout',
        tempo: 'progress/tempo',
        pointsByPulseBeat: 'progress/pointsByPulseBeat',
        nextPoints: 'progress/nextPoints',
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
