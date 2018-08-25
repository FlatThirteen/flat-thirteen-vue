<template lang="pug">
  .curriculum-container
    .main-content(:class="scaleClass")
      .settings
        .layouts
          power-layout.power(ref="layout", @click="onNext('layout')")
          .layout-selected(ref="selected", :class="{off: mode.layout < 0}")
          transition-group(name="layout", tag="div", ref="layouts", class="layouts")
            layout-button(v-for="(layout, i) in layouts", :key="i",
                :layout="layout", :selected="mode.layout === i", @click="onLayout(i)")
      slot
      .lessons(ref="lessons", :class="{transition}"): transition-group(name="lesson-group")
        .lesson-group(v-for="(lessonGroup, key) in pulseBeatGroups", :key="key",
            v-if="pointsByPulseBeat", :class="{transition}")
          lesson-button(v-for="pulseBeat in lessonGroup", :key="pulseBeat",
              :pulseBeat="pulseBeat", :layoutChange="layoutChange",
              @click="$emit('click', pulseBeat)",
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

  import AnimatedMixin from '~/mixins/animated.mixin';

  import LayoutButton from '~/components/curriculum/layout-button.component';
  import LessonButton from '~/components/curriculum/lesson-button.component';
  import NoteCount from '~/components/curriculum/note-count.component';
  import PowerLayout from '~/components/power/power-layout.component';
  import PowerNotes from '~/components/power/power-notes.component';

  export default {
    mixins: [AnimatedMixin],
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
      animationTarget: 'lessons',
      animationDefinitions: {
        left: [[1, {
          transform: 'translateX(-30vw)',
          opacity: 0
        }]],
        right: [[1, {
          transform: 'translateX(30vw)',
          opacity: 0
        }]],
        back: [[1, {
          transform: 'translateX(0)',
          opacity: 1
        }]]
      },
      nextLayoutConditions: [
        { '1111': 300 },
        { '1111': 400, '2222': 400 }
      ],
    },
    data() {
      return {
        clicked: false,
        layoutChange: false
      };
    },
    mounted() {
      if (this.next.layout && this.showNextLayout) {
        this.$refs.layout.appear();
      }
      if (this.next.notes && this.showNextNotes) {
        this.$refs.notes.appear();
      }
      this.$nextTick(() => {
        // Wait for reset to update layout
        if (this.$refs.layout && this.mode.layout > 0) {
          TweenMax.set(this.$refs.selected, {
            left: this.getLayoutLeft()
          });
        }
      })

    },
    methods: {
      onLayout(layout) {
        if (layout === this.mode.layout) {
          return;
        }
        TweenMax.to(this.$refs.selected, this.mode.layout < 0 ? .75 : .25, {
          left: this.getLayoutLeft(layout),
          top: 0
        });
        this.layoutChange = true;
        let next = layout > this.mode.layout;
        this.animate(next ? 'left' : 'right', {
          duration: .1,
          onComplete: () => {
            this.$store.dispatch('progress/mode', { power: 'layout', level: layout });
            this.animate(next ? 'right' : 'left', {
              duration: .05,
              onComplete: () => {
                this.animate('back', { duration: .1 });
                this.layoutChange = false;
              }
            });
          }
        });
      },
      onNext(power) {
        this.$store.dispatch('progress/next', power);
        this.clicked = true;
        this.$nextTick(() => this.clicked = false);
      },
      getLayoutLeft(layout = this.mode.layout) {
        return this.$refs.layouts.children[layout].elm.offsetLeft
      }
    },
    computed: {
      transition() {
        return !this.layoutChange;
      },
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

  .layout-selected
    position: absolute;
    left: -5px;
    background-color: white;
    height: 100px;
    width: 100px;
    margin-top: -20px;

    &.off
      top: 200px;

  .layout-enter-active
    transition: all 250ms cubic-bezier(0,.37,.29,1.3);
    overflow: hidden;

  .layouts .layout-enter
    opacity: 0;
    width: 0;

  .layouts .layout-enter-to
    opacity: 1;
    width: 100px;

  .lesson-group
    text-align: center;

  .lesson-group-enter-active.transition
    transform-origin: top;
    transition: all 750ms ease-in-out;

  .lesson-group-enter.transition
    transform: scale(0);

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
    transform: scale(6);

  .first
    transform: scale(2.5);

  .second
    transform: scale(1.5);
</style>
