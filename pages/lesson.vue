<template lang="pug">
  .container
    composer(ref="composer")
    corner-frame(:totalPoints="points", :totalStars="totalStars")
      transition(name="lesson-container")
        curriculum(v-if="!stageGoal", key="choose", :allPlayable="!wasReset",
            @click="onLesson($event)")
          .reset.button(@click="reset()") Reset
        .lesson-container(v-else, key="stage")
          backing
          stage(:goal="stageGoal", :tempo="tempo", :showNextAuto="showNextAuto",
              @complete="$store.dispatch('lesson/next', {points: $event})")
          .quit.button(@click="clearLesson()") X
      .auto(slot="bottom-left")
        .icon o
        | :{{ power.auto }}
</template>

<script>
  import { TweenMax } from 'gsap';
  import { mapGetters } from 'vuex';

  import LessonBuilderMixin from '~/mixins/lesson-builder.mixin';

  import Backing from '~/components/backing.component';
  import Composer from '~/components/composer.component';
  import CornerFrame from '~/components/corner-frame.component';
  import Curriculum from '~/components/curriculum/curriculum.component';
  import Stage from '~/components/stage/stage.component';

  export default {
    mixins: [LessonBuilderMixin],
    components: {
      'backing': Backing,
      'composer': Composer,
      'corner-frame': CornerFrame,
      'curriculum': Curriculum,
      'stage': Stage,
    },
    head: {
      title: 'Flat Thirteen | Lesson'
    },
    layout: 'debug',
    data() {
      return {
        pulseBeat: null,
        lessons: [{
          pulseBeat: '1111',
          stages: [
            [{ type: 'drums', notes: 'K|K|K|K' }],
            [{ type: 'drums', notes: 'K|K|K' }],
            [{ type: 'drums', notes: 'K||K|K' }],
            [{ type: 'drums', notes: 'K|K||K' }]
          ]
        }, {
          stages: 4,
          buildParams: () => ({ requiredBeatTicks: ['00:000'] })
        }, {
          pulseBeat: '2111',
          buildParams: (i) => i < 3 ? { requiredBeatTicks: ['00:096'] } : {}
        }, {
          pulseBeat: '2211',
          buildParams: (i) => i < 3 ? { requiredBeatTicks: ['01:096'] } : {}
        }, {
          pulseBeat: '2221',
          buildParams: (i) => i < 3 ? { requiredBeatTicks: ['02:096'] } : {}
        }, {
          pulseBeat: '2222',
          buildParams: (i) => i < 3 ? { requiredBeatTicks: ['03:096'] } : {}

        }],
        wasReset: false,
      };
    },
    mounted() {
      this.$store.dispatch('progress/reset', { max: true });
    },
    methods: {
      reset() {
        this.wasReset = true;
        this.$store.dispatch('progress/reset');
      },
      onLesson(pulseBeat) {
        this.setupLesson({pulseBeat,
          layout: this.layout,
          stages: 4,
          buildParams: () => {}
        });
        this.pulseBeat = pulseBeat;
      },
      clearLesson(points) {
        console.assert(this.pulseBeat);
        this.$store.dispatch('progress/addPoints', {
          pulseBeat: this.pulseBeat,
          amount: { base: points }
        });
        this.$store.dispatch('lesson/clear');
      }
    },
    computed: {
      points() {
        return this.totalPoints + this.lessonPoints;
      },
      showNextAuto() {
        return this.points >= this.next.auto * 200;
      },
      ...mapGetters({
        stage: 'lesson/stage',
        stageGoal: 'lesson/stageGoal',
        done: 'lesson/done',
        lessonPoints: 'lesson/totalPoints',
        power: 'progress/power',
        mode: 'progress/mode',
        next: 'progress/next',
        layout: 'progress/layout',
        tempo: 'progress/tempo',
        totalPoints: 'progress/totalPoints',
        totalStars: 'progress/totalStars'
      })
    },
    watch: {
      'mode.backing'(backingLevel) {
        if (backingLevel) {
          this.$refs.composer.reset();
        } else {
          this.$refs.composer.clear();
        }
      },
      stage(stage) {
        if (this.mode.backing) {
          if (stage) {
            this.$refs.composer.updateRhythm();
          } else {
            this.$refs.composer.reset();
          }
        }
      },
      done(done) {
        if (done) {
          this.clearLesson(this.lessonPoints);
        }
      }
    }
  }

</script>

<style scoped lang="stylus" type="text/stylus">
  .container
    posit(absolute);
    user-select: none;

  .lesson-container
    posit(absolute);

  .lesson-container-enter-active, .lesson-container-leave-active
    transition: transform 250ms;

  .lesson-container-enter, .lesson-container-leave-to
    transform: scale(0)

  .reset
    posit(absolute, x, x, x, 20px);
    background-color: white;
    border: solid 1px #EEE;
    padding: 5px;

  .quit
    posit(fixed, 50px, x, x, 0)
    background-color: white;
    border: solid 1px #EEE;
    border-radius: 5px;
    color: #EEE;
    font-size: 20px;
    padding: 5px;
    margin: 5px;

    &:hover
      color: #888;
      border-color: #888;

  .auto
    font-size: 40px;
    font-weight: 600;

    .icon
      display: inline-block;
      color: primary-blue;
</style>
