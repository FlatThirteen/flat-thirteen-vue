<template lang="pug">
  .curriculum-container
    .main-content(:class="scaleClass")
      .settings
        .layouts
          power-layout.power(ref="layout", @click="onNext('layout')")
          layout-button(v-for="(layout, i) in layouts", :key="i",
              :layout="layout", :selected="layoutIndex === i",
              @click="$emit('update:layoutIndex', i)")
      slot
      .lesson-group(v-for="lessonGroup in pulseBeatGroups", v-if="display")
        lesson-button(v-for="pulseBeat in lessonGroup", :key="pulseBeat",
            @mousedown="$emit('mousedown', pulseBeat)",
            @click="$emit('click', pulseBeat)", :pulseBeat="pulseBeat",
            :playable="allPlayable || playableForSetting[pulseBeat]",
            :points="display[pulseBeat]")
      .end
    .bottom(v-if="power.notes", :class="scaleClass")
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

  function splitPulseBeat(pulseBeat) {
    return _.map(_.split(pulseBeat, ''), _.toNumber);
  }

  function splice(string, startIndex, length, insertString) {
    return string.substring(0, startIndex) + insertString + string.substring(startIndex + length);

  }

  export default {
    components: {
      'layout-button': LayoutButton,
      'lesson-button': LessonButton,
      'note-count': NoteCount,
      'power-layout': PowerLayout,
      'power-notes': PowerNotes,
    },
    props: {
      backingLevel: Number,
      layoutIndex: Number,
      tempo: Number,
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
        this.$store.commit('progress/nextPower', power);
        this.clicked = true;
        this.$nextTick(() => this.clicked = false);
      }
    },
    computed: {
      scaleClass() {
        return this.power.notes === 4 ? 'first' : this.power.notes === 5 ? 'second' : '';
      },
      layoutNotesMultiple() {
        return this.layouts[this.layoutIndex] && this.layouts[this.layoutIndex].length;
      },
      pulseBeatGroups() {
        return _.map(_.pickBy(_.groupBy(_.map(this.pulseBeats, splitPulseBeat), _.sum),
            (group, noteCount) => _.toNumber(noteCount) * this.layoutNotesMultiple <= this.power.notes),
            _.partial(_.map, _, _.partial(_.join, _, '')));
      },
      display() {
        return _.mapValues(this.displayPoints[this.layoutIndex],
            _.property([this.tempo, this.backingLevel]));
      },
      playableForSetting() {
        return _.mapValues(this.display, (points, pulseBeat, pointsByPulseBeat) => {
          if (points.length) {
            return true;
          }
          let check = pulseBeat === '3333' ? ['2222'] : pulseBeat === '4444' ? ['3333'] :
              _.compact(_.times(pulseBeat.length, i =>
                  pulseBeat.charAt(i) === '2' && splice(pulseBeat, i, 1, '1')));
          return !check.length || _.some(check,
              pulseBeat => pointsByPulseBeat[pulseBeat].length);
        });
      },
      showNextBacking() {
        return _.every(this.playableForSetting) && this.power.auto > 1 && !!this.next.backing;
      },
      showNextLayout() {
        return this.next.layout === this.layoutIndex + 1 &&
            _.every(this.nextLayoutConditions[this.layoutIndex],
                (points, pulseBeat) => _.get(this.display, [pulseBeat, 0, 'base']) >= points);
      },
      showNextNotes() {
        return !this.clicked && this.next.notes &&
            (this.next.notes - 4) * 600 <= this.totalPoints;
      },
      ...mapGetters({
        power: 'progress/power',
        next: 'progress/next',
        layouts: 'progress/layouts',
        pulseBeats: 'progress/pulseBeats',
        displayPoints: 'progress/displayPoints',
        totalPoints: 'progress/totalPoints'
      })
    },
    watch: {
      showNextBacking(showNextBacking) {
        this.$emit('showNextBacking', showNextBacking);
      },
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
    transition: transform 250ms ease-in-out;
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
    transition: transform 250ms ease-in-out;
    transform-origin: bottom;

  .first
    transform: scale(2);

  .second
    transform: scale(1.5);

</style>
