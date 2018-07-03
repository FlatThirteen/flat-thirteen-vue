<template lang="pug">
  .container
    .lesson-control(v-if="lessonIndex === null")
      .lesson.button(v-for="(lesson, i) in lessons", @click="setLesson(i)",
          :class="{done: points[i]}") {{ points[i] || i }}
    .quit.button(v-else, @click="clearLesson()") X
    stage(:pulseBeat="pulseBeat", :surfaces="surfaces")
      note-counter.notes

</template>

<script>
  import { mapGetters } from 'vuex';

  import NoteCounter from '~/components/note-counter.component';
  import Stage from '~/components/stage.component';

  export default {
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
//          stages: []
        }, {
          autoLevel: 1
        }, {
          autoLevel: 2
        }, {
          pulseBeat: '2111'
        }, {
          pulseBeat: '2211'
        }, {
          pulseBeat: '2221'
        }, {
          pulseBeat: '2222'
        }],
        lessonIndex: null,
        points: []
      }
    },
    methods: {
      setLesson(index) {
        this.lessonIndex = index;
        let lesson = this.getLesson(index);
        if (!lesson.stages) {
          this.$store.commit('pulseBeat', lesson.pulseBeat);
          console.log('TODO: Make stages!');
        }
        this.$store.dispatch('lesson/initialize', lesson);
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
        surfaces: 'lesson/surfaces',
        pulseBeat: 'lesson/pulseBeat',
        totalPoints: 'lesson/totalPoints',
        autoLevel: 'stage/autoLevel',
        autoLevels: 'stage/autoLevels',
        numBeats: 'transport/numBeats'
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
