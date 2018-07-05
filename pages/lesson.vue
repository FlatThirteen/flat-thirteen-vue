<template lang="pug">
  .container
    .lesson-control(v-if="lessonIndex === null")
      .lesson.button(v-for="(lesson, i) in lessons", @click="setLesson(i)",
          :class="{done: points[i]}") {{ points[i] || i }}
    .lesson-container(v-else)
      .quit.button(@click="clearLesson()") X
      stage
        note-counter.notes

</template>

<script>
  import { mapGetters } from 'vuex';

  import LessonBuilderMixin from '~/mixins/lesson-builder.mixin';

  import NoteCounter from '~/components/note-counter.component';
  import Stage from '~/components/stage.component';

  export default {
    mixins: [LessonBuilderMixin],
    components: {
      'note-counter': NoteCounter,
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
          ],
          autoLevel: 0
        }, {
          surfaces: [
            { soundByKey: { q: 'snare', a: 'kick' } }
          ],
          stages: 4,
          buildParams: () => ({ requiredBeatTicks: ['00:000'] })
        }, {
          autoLevel: 1,
          buildParams: () => {}
        }, {
          autoLevel: 2
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
        points: []
      }
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
          this.points[this.lessonIndex] = points;
        }
        this.$store.dispatch('lesson/clear');
        this.lessonIndex = null;
      }
    },
    computed: {
      ...mapGetters({
        done: 'lesson/done',
        totalPoints: 'lesson/totalPoints',
        autoLevel: 'stage/autoLevel',
        autoLevels: 'stage/autoLevels',
        pulseBeat: 'player/pulseBeat',
        surfaces: 'player/surfaces'
      })
    },
    watch: {
      done(done) {
        if (done) {
          this.clearLesson(this.totalPoints);
        }
      }
    }
  }

</script>

<style scoped lang="stylus" type="text/stylus">
  .container
    position: relative;

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

  .notes
    margin: 5vh;

</style>
