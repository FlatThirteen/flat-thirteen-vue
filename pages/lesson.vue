<template lang="pug">
  .container
    transition(name="lesson-container")
      .lesson-container(v-if="lessonIndex === null", key="choose")
        .lesson.button(v-for="(lesson, i) in lessons", @click="setLesson(i)",
            :class="{done: stagePoints[i]}") {{ stagePoints[i] || i }}
      .lesson-container(v-else, key="stage")
        .quit.button(@click="clearLesson()") X
        stage(:showNextPower="showNextPower")
    .bottom-controls
      .auto
        .icon(@click="$store.commit('stage/autoAdjust', { max: 0 })") o
        | :{{ autoMax }}
      .points {{ showPoints | floor }}
</template>

<script>
  import { TweenMax } from 'gsap';
  import { mapGetters } from 'vuex';

  import LessonBuilderMixin from '~/mixins/lesson-builder.mixin';

  import Stage from '~/components/stage.component';

  export default {
    mixins: [LessonBuilderMixin],
    components: {
      'stage': Stage
    },
    head: {
      title: 'Flat Thirteen | Lesson'
    },
    layout: 'debug',
    data: function() {
      return {
        lessons: [{
          surfaces: [
            { soundByKey: { a: 'kick' } }
          ],
          pulseBeat: '1111',
          stages: [
            [{ type: 'drums', notes: 'K|K|K|K' }],
            [{ type: 'drums', notes: 'K|K|K' }],
            [{ type: 'drums', notes: 'K||K|K' }],
            [{ type: 'drums', notes: 'K|K||K' }]
          ]
        }, {
          surfaces: [
            { soundByKey: { q: 'snare', a: 'kick' } }
          ],
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
        },{
          pulseBeat: '3333',
          buildParams: () => {}
        },{
          pulseBeat: '4444'
        }],
        lessonIndex: null,
        stages: null,
        stagePoints: [],
        showPoints: 0
      };
    },
    mounted() {
      this.$store.dispatch('stage/clear');
    },
    methods: {
      setLesson(index) {
        this.setupLesson(this.getLesson(index));
        this.lessonIndex = index;
      },
      getLesson(index) {
        let lesson = this.lessons[index];
        if (!index) {
          return lesson;
        }
        if (!lesson.surfaces || !lesson.pulseBeat) {
          lesson = _.defaults(lesson, this.getLesson(index - 1));
        }
        return lesson;
      },
      clearLesson(points) {
        if (points) {
          this.stagePoints[this.lessonIndex] = points;
        }
        this.$store.dispatch('lesson/clear');
        this.lessonIndex = null;
      }
    },
    computed: {
      showNextPower() {
        return this.showPoints >= this.autoNext * 200;
      },
      ...mapGetters({
        autoMax: 'stage/autoMax',
        autoNext: 'stage/autoNext',
        done: 'lesson/done',
        lessonPoints: 'lesson/totalPoints'
      })
    },
    watch: {
      done(done) {
        if (done) {
          this.clearLesson(this.lessonPoints);
        }
      },
      lessonPoints(lessonPoints) {
        TweenMax.to(this.$data, .5, {
          showPoints: _.sum(this.stagePoints) + lessonPoints
        });
      }
    }
  }

</script>

<style scoped lang="stylus" type="text/stylus">
  .container
    position: relative;

  .lesson-container
    posit(absolute);

  .lesson
    background-color: primary-blue;
    color: primary-blue;
    margin: 10px;
    width: 120px;
    font-size: 40px;
    line-height: 60px;
    transition: all 250ms;

    &:hover:not(.done)
      color: black;

    &.done
      background-color: primary-green;

  .lesson-container-enter-active, .lesson-container-leave-active
    transition: transform 250ms;

  .lesson-container-enter, .lesson-container-leave-to
    transform: scale(0)

  .quit
    posit(fixed, 50px, 0, x, x)
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

  .bottom-controls
    posit(fixed, x, 0, 0, 0)
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    user-select: none;

    .auto
      font-size: 40px;
      font-weight: bold;
      margin: 5px 10px;

      .icon
        display: inline-block;
        color: primary-blue;
        line-height: 30px;

    .points
      color: active-blue;
      font-size: 40px;
      font-weight: 600;
</style>
