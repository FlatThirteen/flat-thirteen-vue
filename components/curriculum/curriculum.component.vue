<template lang="pug">
  .curriculum-container(ref="container", @click="onTouch()")
    .main-content.scale(:class="scaleClass")
      .settings(:class="{space: power.tempo}")
        .layouts
          power-layout.power(ref="layout", @click="onNext('layout')")
          .layout-selected(ref="selected", :class="{off: level.layout < 0}",
              :style="{backgroundColor: bgIntensity}")
          transition-group(name="layout", tag="div", ref="layouts", class="layouts")
            layout-button(v-for="(layout, i) in layouts", :key="String(i)", :layout="layout",
                :selected="initialSelected || level.layout === i",
                :weenie="weenie.layout === i && transition", @click="onLayout(i)")
      slot
      .lessons(ref="lessons", :class="{transition}"): transition-group(name="lesson-group")
        .lesson-group(v-for="(lessonGroup, notes) in pulseBeatGroups", :key="String(notes)",
            v-if="displayScores", :class="{transition, weenie: String(weenie.notes) === notes}")
          lesson-button(v-for="pulseBeat in lessonGroup", ref="lessonButton", :key="pulseBeat",
              :class="{highlight: highlight[pulseBeat]}", :intensity="bgIntensity", :backing="backing",
              :pulseBeat="pulseBeat", :score="displayScores[pulseBeat]", :transition="transition",
              :intensityChange="intensityChange", :tempoChange="tempoChange", @onTouch="onTouch(pulseBeat)",
              @click="onLesson(pulseBeat, $event)", @mousedown="$emit('mousedown', pulseBeat)",
              @mouseenter="onMouseOver(pulseBeat)", @mouseleave="onMouseOver()")
      .end
    .bottom.scale(:class="scaleClass", :style="bottomStyle")
      note-count.bottom__contents(:notes="power.notes")
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
        { '1111': 'passing' },
        { '1111': 'perfect', '2221': 'perfect', '2212': 'perfect',
          '2122': 'perfect', '1222': 'perfect', '2222': 'perfect' }
      ],
    },
    data() {
      return {
        initialSelected: false,
        clicked: false,
        layoutChange: false,
        intensityChange: false,
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
      });
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
      onTouch(pulseBeat) {
        _.forEach(this.$refs.lessonButton, lessonButton => {
          if (lessonButton.pulseBeat !== pulseBeat) {
            lessonButton.touchOff();
          } else {
            this.onMouseOver(pulseBeat);
          }
        });
      },
      onMouseOver(pulseBeat) {
        this.highlight = !pulseBeat || this.displayScores[pulseBeat] ? {} : _.reduce(
            this.prerequisite[pulseBeat], (result, required) => _.set(result, required, true), {});
      },
      onLesson(pulseBeat, {x, y}) {
        this.$store.dispatch('progress/weenie', { power: 'notes' });
        this.$emit('click', { pulseBeat,
          x: x * (this.scaleClass === 'second' ? 1.4 : 1),
          y: y * (this.scaleClass === 'first' ? 2 : this.scaleClass === 'second' ? 1.4 : 1),
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
      showNextLayout() {
        return this.next.layout && this.next.layout === this.level.layout + 1 &&
            _.every(this.nextLayoutConditions[this.level.layout],
                (condition, pulseBeat) => _.get(this.displayScores, [pulseBeat, condition]));
      },
      showNextNotes() {
        return !this.clicked && this.next.notes &&  this.totalPoints >= this.nextPoints &&
            this.totalPoints >= (this.next.notes - 4) * 600 &&
            (this.next.notes < 9 || this.level.layout > 1) &&
            _.some(_.last(_.values(this.pulseBeatGroups)),
                pulseBeat => _.get(this.displayScores, [pulseBeat, 'passing']));
      },
      bottomStyle() {
        return {
          backgroundColor: this.bgIntensity,
          boxShadow: '0 0 25px 15px ' + this.bgIntensity
        }
      },
      ...mapGetters({
        power: 'progress/power',
        level: 'progress/level',
        next: 'progress/next',
        weenie: 'progress/weenie',
        backing: 'progress/backing',
        bgIntensity: 'progress/bgIntensity',
        layouts: 'progress/layouts',
        pulseBeatGroups: 'progress/pulseBeatGroups',
        scaleClass: 'progress/scaleClass',
        groupsWithoutStars: 'progress/groupsWithoutStars',
        displayScores: 'progress/displayScores',
        prerequisite: 'progress/prerequisite',
        nextPoints: 'progress/nextPoints',
        totalPoints: 'progress/totalPoints'
      })
    },
    watch: {
      hint(hint) {
        if (hint === 'TODO') { // TODO: Use for power needing all playable
          this.highlight = _.mapValues(this.displayScores, value => !value);
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
      bgIntensity() {
        this.intensityChange = true;
        this.$nextTick(() => {
          this.intensityChange = false;
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
  @import "~assets/stylus/scale.styl"
  @import "~assets/stylus/weenie.styl"

  .curriculum-container
    posit(absolute);
    overflow-x: hidden;

  .main-content
    transform-origin: top;

  .settings
    background-color: alpha(gray, .2);
    padding: 30px 0 20px;
    margin-bottom: 20px;
    display: flex;
    justify-content: center;
    align-items: flex-end;

    &.space
      transition: padding-top 250ms;

      @media (max-width: 650px)
        padding-top: 120px;

  .layouts
    display: inline-flex;
    position: relative;

  .layout-selected
    position: absolute;
    left: -5px;
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
    margin: 20px 2px;
    text-align: center;

    &.weenie:not(:hover) .button
      animation: weenie 1s infinite 500ms;

  .lesson-group-enter-active.transition
    transform-origin: top;
    transition: all 750ms ease-in-out;

  .lesson-group-enter.transition
    transform: scale(0);

  .end
    height: 100px;

  .bottom
    posit(fixed, x, 0, 0, 0);
    height: 0;
    text-align: center;
    transform-origin: bottom;
    pointer-events: none;

    &.initial
      transform: scale(0);

    &__contents
      posit(relative, -55px, x, x, x);
      opacity: .9;

    .power
      pointer-events: visible;

  .second .lessons
      margin: 0 15%;
</style>
