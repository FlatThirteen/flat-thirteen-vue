<template lang="pug">
  corner-frame(:backingLevel.sync="backingLevel", :tempo.sync="tempo",
      :showNextBacking="showNextBacking",
      :totalPoints="totalPoints", :totalStars="totalStars")
    curriculum(:backingLevel.sync="backingLevel", :layoutIndex.sync="layoutIndex",
        @showNextBacking="showNextBacking = $event", v-bind:tempo.sync="tempo",
        @mousedown="onLesson($event)")
    .points(slot="bottom-left")
      span(@mouseover="showNextAuto()") +
      input(type="number", v-model.number="addPoints", :class="{invalid: invalidPoints}")
      .power
        power-auto(ref="auto", @click="$store.dispatch('progress/next', 'auto')")
</template>

<script>
  import { mapGetters } from 'vuex';

  import CornerFrame from '~/components/corner-frame.component';
  import Curriculum from '~/components/curriculum/curriculum.component';
  import PowerAuto from '~/components/power/power-auto.component';

  import { MAX_POINTS } from '~/store/progress';

  export default {
    components: {
      'corner-frame': CornerFrame,
      'curriculum': Curriculum,
      'power-auto': PowerAuto
    },
    head: {
      title: 'Flat Thirteen | Lesson'
    },
    layout: 'debug',
    mounted() {
      this.$store.dispatch('progress/reset');
    },
    data() {
      return {
        backingLevel: 0,
        layoutIndex: 0,
        tempo: 120,
        addPoints: MAX_POINTS,
        showNextBacking: false
      };
    },
    methods: {
      onLesson(pulseBeat) {
        if (this.invalidPoints) {
          return;
        }
        this.$store.commit('progress/addPoints', { pulseBeat,
          layoutIndex: this.layoutIndex,
          tempo: this.tempo,
          backingLevel: this.backingLevel,
          amount: {
            base: this.addPoints
          }
        });
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

  .points input
    border: none;
    color: active-blue;
    font-size: 40px;
    font-weight: 600;
    width: 100px;

    &.invalid
      color: primary-red;

    &:focus
      outline: none;

  .power
    posit(absolute, x, x, 0, 160px)
    height: 100%;
</style>
