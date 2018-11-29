<template lang="pug">
  corner-frame(:totalPoints="totalPoints", :totalStars="totalStars", @hint="hint = $event")
    curriculum(:hint="hint", @mousedown="onLesson($event)")
    transition(name="lesson-container")
      .lesson-container(v-show="pulseBeat")
        lesson-builder(ref="lessonBuilder", :debug="true")
        .points
          span(@mouseover="showNextAuto()", @click="max()") +
          input(type="number", v-model.number="addPoints", :class="{invalid: invalidPoints}")
          .power
            power-auto(ref="auto", @click="$store.dispatch('progress/next', 'auto')")
        quit-button(@click="exitLesson()")
</template>

<script>
  import { mapGetters } from 'vuex';

  import CornerFrame from '~/components/corner-frame.component';
  import Curriculum from '~/components/curriculum/curriculum.component';
  import LessonBuilder from '~/components/lesson-builder.component';
  import PowerAuto from '~/components/power/power-auto.component';
  import QuitButton from '~/components/quit-button.component';

  import { MAX_POINTS } from '~/store/progress';

  export default {
    components: {
      'corner-frame': CornerFrame,
      'curriculum': Curriculum,
      'lesson-builder': LessonBuilder,
      'power-auto': PowerAuto,
      'quit-button': QuitButton
    },
    head: {
      title: 'Flat Thirteen | Progress'
    },
    layout: 'debug',
    data() {
      return {
        hint: null,
        pulseBeat: null,
        addPoints: MAX_POINTS
      };
    },
    methods: {
      max() {
        this.$store.dispatch('progress/initialize', { max: !this.power.notes});
        this.$refs.auto.disappear();
      },
      onLesson(pulseBeat) {
        this.pulseBeat = pulseBeat;
        this.$store.dispatch('player/update', { pulseBeat,
          layout: this.layout,
          clear: true
        });
        let finished = this.pointsByPulseBeat[pulseBeat].length;
        this.$refs.lessonBuilder.build(finished);
      },
      exitLesson() {
        if (!this.invalidPoints) {
          this.$store.dispatch('progress/addPoints', {
            pulseBeat: this.pulseBeat,
            amount: { base: this.addPoints }
          });
        }
        this.pulseBeat = null;
      },
      showNextAuto() {
        if (this.next.auto) {
          this.$refs.auto.appear(this.next.auto);
        }
      }
    },
    computed: {
      invalidPoints() {
        return this.addPoints <= 0 || this.addPoints > MAX_POINTS;
      },
      ...mapGetters({
        power: 'progress/power',
        next: 'progress/next',
        layout: 'progress/layout',
        pointsByPulseBeat: 'progress/pointsByPulseBeat',
        totalPoints: 'progress/totalPoints',
        totalStars: 'progress/totalStars'
      })
    }
  }

</script>

<style scoped lang="stylus" type="text/stylus">
  .container
    position: absolute;
    user-select: none;

  .lesson-container-enter-active, .lesson-container-leave-active
    transition: all 500ms;

  .lesson-container-enter, .lesson-container-leave-to
    transform: scale(.1);
    opacity: 0.5;

  .lesson-container
    posit(absolute);
    background-color: white;
    overflow: scroll;

  .points
    posit(fixed, x, x, 0, 0);
    font-size: 40px;
    font-weight: 600;
    margin-left: 5px;

    input
      background-color: transparent;
      border: none;
      color: active-blue;
      font-size: 40px;
      font-weight: 600;
      vertical-align: text-top;
      width: 100px;
      filter: drop-shadow(0 0 4px white);
      text-shadow: 0 0 5px white;

      &.invalid
        color: primary-red;

      &:focus
        outline: none;

  .power
    posit(absolute, x, x, 0, 160px)
    height: 100%;
</style>
