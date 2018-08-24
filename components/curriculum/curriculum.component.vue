<template lang="pug">
  .curriculum-container
    .main-content(:class="scaleClass")
      .settings
        .layouts
          power-layout.power(ref="layout", @click="onNext('layout')")
          layout-button(v-for="(layout, i) in layouts", :key="i",
              :layout="layout", :selected="mode.layout === i",
              @click="$store.dispatch('progress/mode', {power: 'layout', level: i})")
      slot
      .lesson-group(v-for="lessonGroup in pulseBeatGroups", v-if="pointsByPulseBeat")
        lesson-button(v-for="pulseBeat in lessonGroup", :key="pulseBeat",
            :pulseBeat="pulseBeat", @click="$emit('click', pulseBeat)",
            @mousedown="$emit('mousedown', pulseBeat)",
            :playable="allPlayable || playable[pulseBeat]",
            :points="pointsByPulseBeat[pulseBeat]")
      .end
    .bottom(:class="scaleClass")
      note-count(:notes="power.notes")
        power-notes.power(ref="notes", @click="onNext('notes')")
</template>

<script>
  import { mapGetters } from 'vuex';

  import LayoutButton from '~/components/curriculum/layout-button.component';
  import LessonButton from '~/components/curriculum/lesson-button.component';
  import NoteCount from '~/components/curriculum/note-count.component';
  import PowerLayout from '~/components/power/power-layout.component';
  import PowerNotes from '~/components/power/power-notes.component';

  export default {
    components: {
      'layout-button': LayoutButton,
      'lesson-button': LessonButton,
      'note-count': NoteCount,
      'power-layout': PowerLayout,
      'power-notes': PowerNotes,
    },
    props: {
      allPlayable: Boolean
    },
    constants: {
      nextLayoutConditions: [
        { '1111': 300 },
        { '2222': 400 }
      ],
    },
    data() {
      return {
        clicked: false
      };
    },
    mounted() {
      if (this.next.layout && this.showNextLayout) {
        this.$refs.layout.appear();
      }
      if (this.next.notes && this.showNextNotes) {
        this.$refs.notes.appear();
      }
    },
    methods: {
      onNext(power) {
        this.$store.dispatch('progress/next', power);
        this.clicked = true;
        this.$nextTick(() => this.clicked = false);
      }
    },
    computed: {
      scaleClass() {
        return this.power.notes === 4 ? 'first' : this.power.notes === 5 ? 'second' :
            this.power.notes ? '' : 'initial';
      },
      showNextLayout() {
        return this.next.layout === this.mode.layout + 1 &&
            _.every(this.nextLayoutConditions[this.mode.layout],
                (points, pulseBeat) => _.get(this.pointsByPulseBeat, [pulseBeat, 0, 'base']) >= points);
      },
      showNextNotes() {
        return !this.clicked && this.next.notes &&
            (this.next.notes - 4) * 600 <= this.totalPoints;
      },
      ...mapGetters({
        power: 'progress/power',
        mode: 'progress/mode',
        next: 'progress/next',
        layouts: 'progress/layouts',
        pulseBeatGroups: 'progress/pulseBeatGroups',
        pointsByPulseBeat: 'progress/pointsByPulseBeat',
        playable: 'progress/playable',
        totalPoints: 'progress/totalPoints'
      })
    },
    watch: {
      showNextLayout(showNextLayout) {
        if (showNextLayout) {
          this.$refs.layout.appear();
        }
      },
      showNextNotes(showNextNotes) {
        if (showNextNotes) {
          this.$nextTick(() => this.$refs.notes.appear());
        }
      }
    }
  }

</script>

<style scoped lang="stylus" type="text/stylus">
  .curriculum-container
    posit(absolute);

  .main-content
    transform-origin: top;

  .settings
    background-color: faint-grey;
    padding: 30px 0 20px;
    margin-bottom: 20px;
    display: flex;
    justify-content: center;
    align-items: flex-end;

  .layouts
    display: inline-flex;
    position: relative;

  .lesson-group
    text-align: center;

  .end
    height: 100px;

  .bottom
    posit(fixed, x, 0, 0, 0);
    background-color: white;
    box-shadow: 0 0 25px 15px white;
    text-align: center;
    transform-origin: bottom;

    &.initial
      transform: scale(0);

  .main-content, .bottom
    transition: transform 500ms ease-in-out;
    transition-delay: 250ms;

  .initial
    transform: scale(5);

  .first
    transform: scale(2);

  .second
    transform: scale(1.5);
</style>
