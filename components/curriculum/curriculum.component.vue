<template lang="pug">
  .curriculum-container(ref="container")
    .main-content(:class="scaleClass")
      .settings
        .layouts
          power-layout.power(ref="layout", @click="onNext('layout')")
          .layout-selected(ref="selected", :class="{off: level.layout < 0}")
          transition-group(name="layout", tag="div", ref="layouts", class="layouts")
            layout-button(v-for="(layout, i) in layouts", :key="i", :layout="layout",
                :selected="initialSelected || level.layout === i",
                :weenie="weenie.layout === i && transition", @click="onLayout(i)")
      slot
      .lessons(ref="lessons", :class="{transition}"): transition-group(name="lesson-group")
        .lesson-group(v-for="(lessonGroup, notes) in pulseBeatGroups", :key="notes",
            v-if="displayPoints", :class="{transition, weenie: String(weenie.notes) === notes}")
          lesson-button(v-for="pulseBeat in lessonGroup", :key="pulseBeat",
              :class="{highlight: highlight[pulseBeat]}", :backing="backing",
              :pulseBeat="pulseBeat", :points="displayPoints[pulseBeat]", :transition="transition",
              :backingChange="backingChange", :tempoChange="tempoChange",
              @click="onLesson(pulseBeat, $event)", @mousedown="$emit('mousedown', pulseBeat)",
              @mouseenter.native="onMouseOver(pulseBeat)", @mouseleave.native="onMouseOver()")
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
      hint: String,
      scrollTop: Number,
      debug: Boolean
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
        { '1111': 400, '2221': 400, '2212': 400, '2122': 400, '1222': 400, '2222': 400 }
      ],
    },
    data() {
      return {
        initialSelected: false,
        clicked: false,
        layoutChange: false,
        backingChange: false,
        tempoChange: false,
        highlight: {}
      };
    },
    mounted() {
      this.$refs.container.scrollTop = this.scrollTop;
      if (this.showNextLayout) {
        this.$refs.layout.appear(this.next.layout);
      }
      if (this.showNextNotes) {
        this.$refs.notes.appear(this.next.notes);
      }
      this.$nextTick(() => {
        // Wait for reset to update layout
        if (this.$refs.layout && this.level.layout > 0) {
          TweenMax.set(this.$refs.selected, {
            left: this.getLayoutLeft()
          });
        }
      })

    },
    methods: {
      onLayout(layout) {
        if (this.level.layout < 0) {
          if (!this.layoutChange) {
            this.layoutChange = true;
            this.initialSelected = !this.initialSelected;
            TweenMax.to(this.$refs.selected, 1, {
              left: this.getLayoutLeft(layout),
              top: 0,
              delay: this.debug ? 0 : 2,
              onComplete: () => {
                this.$store.dispatch('progress/layout', layout);
                this.animate('back', { duration: 0 });
                this.layoutChange = false;
                this.initialSelected = false;
              }
            });
          }
        } else if (layout !== this.level.layout) {
          TweenMax.to(this.$refs.selected, .25, {
            left: this.getLayoutLeft(layout),
            top: 0
          });
          this.layoutChange = true;
          let next = layout > this.level.layout;
          this.animate(next ? 'left' : 'right', {
            duration: .1,
            onComplete: () => {
              this.$store.dispatch('progress/layout', layout);
              this.animate(next ? 'right' : 'left', {
                duration: .05,
                onComplete: () => {
                  this.animate('back', { duration: .1,
                  onComplete: () => {
                    this.$refs.lessons.removeAttribute('style');
                    this.layoutChange = false;
                  }});
                }
              });
            }
          });
        }
      },
      onMouseOver(pulseBeat) {
        this.highlight = !pulseBeat || this.displayPoints[pulseBeat] ? {} : _.reduce(
            this.prerequisite[pulseBeat], (result, required) => _.set(result, required, true), {});
      },
      onLesson(pulseBeat, {x, y}) {
        this.$store.dispatch('progress/weenie', { power: 'notes' });
        this.$emit('click', { pulseBeat,
          x: x * (this.scaleClass === 'second' ? 1.5 : 1),
          y: y * (this.scaleClass === 'first' ? 2 : this.scaleClass === 'second' ? 1.5 : 1),
          scrollTop: this.$refs.container.scrollTop
        });
      },
      onNext(power) {
        this.$store.dispatch('progress/next', power);
        this.clicked = true;
        this.$nextTick(() => this.clicked = false);
      },
      getLayoutLeft(layout = this.level.layout) {
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
        return this.next.layout && this.next.layout === this.level.layout + 1 &&
            _.every(this.nextLayoutConditions[this.level.layout],
                (points, pulseBeat) => _.get(this.displayPoints, [pulseBeat, 0, 'base']) >= points);
      },
      showNextNotes() {
        return !this.clicked && this.next.notes &&  this.totalPoints >= this.nextPoints &&
            this.totalPoints >= (this.next.notes - 4) * 600 &&
            _.some(_.last(_.values(this.pulseBeatGroups)),
                pulseBeat => !_.isEmpty(this.displayPoints[pulseBeat]));
      },
      ...mapGetters({
        power: 'progress/power',
        level: 'progress/level',
        next: 'progress/next',
        weenie: 'progress/weenie',
        backing: 'progress/backing',
        layouts: 'progress/layouts',
        pulseBeatGroups: 'progress/pulseBeatGroups',
        groupsWithoutStars: 'progress/groupsWithoutStars',
        displayPoints: 'progress/displayPoints',
        prerequisite: 'progress/prerequisite',
        nextPoints: 'progress/nextPoints',
        totalPoints: 'progress/totalPoints'
      })
    },
    watch: {
      hint(hint) {
        if (hint === 'backing') {
          this.highlight = _.mapValues(this.displayPoints, value => !value);
        } else if (hint === 'tempo') {
          let pulseBeats = _.flatten(this.groupsWithoutStars);
          this.highlight = _.zipObject(pulseBeats, _.times(pulseBeats.length, _.constant(true)));
        } else {
          this.highlight = {};
        }
      },
      showNextLayout(showNextLayout) {
        if (showNextLayout) {
          this.$refs.layout.appear(this.next.layout);
        }
      },
      showNextNotes(showNextNotes) {
        if (showNextNotes) {
          this.$nextTick(() => this.$refs.notes.appear(this.next.notes));
        }
      },
      'level.backing'() {
        this.backingChange = true;
        this.$nextTick(() => {
          this.backingChange = false;
        });
      },
      'level.tempo'() {
        this.tempoChange = true;
        this.$nextTick(() => {
          this.tempoChange = false;
        });
      }
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  @import "~assets/stylus/weenie.styl"

  .curriculum-container
    posit(absolute);
    overflow-x: hidden;

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
    margin: 20px;
    text-align: center;

    &.weenie:not(:hover) .button
      animation: weenie 1s infinite 500ms;

    .highlight:not(:hover)
      shadow(primary-blue, 3px);

      &.button
        shadow(primary-blue, 8px);
        animation: none;

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
    transition: all 500ms ease-in-out;
    transition-delay: 250ms;

  .initial
    transform: scale(5);

  .first
    transform: scale(2);
    transition-delay: 0;

  .second
    margin: 0 15%;
    transform: scale(1.5);
</style>
